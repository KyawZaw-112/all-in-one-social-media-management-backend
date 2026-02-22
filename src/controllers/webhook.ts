import { sendMessage, getUserProfile } from "../services/facebook.services.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { Request, Response } from "express";
import { runConversationEngine, getDefaultReply, getWelcomeMessage } from "../services/conversationEngine.js";
import { FacebookWebhookPayload } from "../types/facebook.js";
import logger from "../utils/logger.js";

export const verifyWebhook = (req: Request, res: Response) => {
    const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
};

export const handleWebhook = async (req: Request, res: Response) => {
    const body = req.body as FacebookWebhookPayload;
    logger.info("📥 Webhook received", { object: body.object });

    try {
        const entry = body.entry?.[0];
        const messaging = entry?.messaging?.[0];
        const isEcho = messaging?.message?.is_echo;

        if (isEcho) {
            console.log("🗣️ Ignoring message echo from Facebook");
            return res.sendStatus(200);
        }

        const pageId = entry?.id;
        const senderId = messaging?.sender?.id;
        const messageText = messaging?.message?.text || "";
        const attachments = messaging?.message?.attachments || [];
        const mid = messaging?.message?.mid;

        console.log("📝 Parsed Webhook Data:", { pageId, senderId, mid, messageText: messageText?.substring(0, 20), attachmentCount: attachments.length });

        if (!pageId || !senderId || (!messageText && attachments.length === 0)) {
            console.log("⚠️ Missing required data (pageId/senderId/messageText/attachments)");
            return res.sendStatus(200);
        }

        // 0️⃣ DEDUPLICATION & EARLY RESPONSE
        // Send 200 OK immediately to satisfy Facebook and prevent retries
        res.sendStatus(200);

        if (mid) {
            // Check if we've already processed this message ID
            // We store mid in metadata.fb_mid
            const { data: existingMsg } = await supabaseAdmin
                .from("messages")
                .select("id")
                .contains('metadata', { fb_mid: mid })
                .maybeSingle();

            if (existingMsg) {
                console.log("🛑 Duplicate mid detected, skipping processing:", mid);
                return;
            }
        }

        // 1️⃣ Find merchant connection
        const { data: connection, error: connError } = await supabaseAdmin
            .from("platform_connections")
            .select("*")
            .eq("page_id", pageId)
            .maybeSingle();

        if (connError) {
            logger.error("❌ Connection Search Error", connError, { pageId });
        }

        if (!connection) {
            console.log("🚫 No connection record for Page ID:", pageId);
            return res.sendStatus(200);
        }

        const merchantId = connection.user_id || connection.merchant_id;
        console.log("👤 Merchant:", merchantId, "Page Access Token exists:", !!connection.page_access_token);

        // 1.2️⃣ Admin Keyword Check (Silence Bot)
        const adminKeywords = ["admin", "အက်မင်", "မင်မင်"];
        const lowerMessage = messageText.toLowerCase().trim();
        if (adminKeywords.some(k => lowerMessage.includes(k))) {
            console.log("👤 Admin requested by user. Silencing bot.");
            // Record message for the dashboard
            await supabaseAdmin.from("messages").insert({
                user_id: merchantId,
                sender_id: senderId,
                sender_email: senderId,
                sender_name: "Facebook User",
                body: messageText,
                content: messageText,
                channel: "facebook",
                status: "received",
                metadata: { fb_mid: mid }
            });
            // Send a small confirmation that admin is notified (optional, but good UX)
            await sendMessage(pageId, connection.page_access_token, senderId, "ခဏစောင့်ပေးပါခင်ဗျာ။ Admin မှ မကြာခင် ပြန်လည်ဖြေကြားပေးပါမည်။ 🙏");
            return;
        }

        // 1.5️⃣ Check Subscription Status (Disabled as per user request to let page owner handle)
        const { data: merchant, error: merchError } = await supabaseAdmin
            .from("merchants")
            .select("subscription_status, trial_ends_at, business_type")
            .eq("id", merchantId)
            .maybeSingle();

        if (merchError) logger.error("❌ Merchant Search Error", merchError, { merchantId });

        // 2️⃣ Check for active conversation
        let isResuming = true;
        let { data: activeConvs, error: convError } = await supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("merchant_id", merchantId)
            .eq("user_psid", senderId)
            .eq("status", "active")
            .order("created_at", { ascending: false });

        if (convError) logger.error("❌ Conversation Search Error", convError, { merchantId, senderId });

        // Take the latest one
        let conversation = activeConvs && activeConvs.length > 0 ? activeConvs[0] : null;

        // Cleanup: If there are multiple active conversations, DELETE older ones
        // to prevent database clutter (as per user concern).
        if (activeConvs && activeConvs.length > 1) {
            console.log(`🧹 Deleting ${activeConvs.length - 1} redundant active conversations for PSID: ${senderId}`);
            const olderIds = activeConvs.slice(1).map(c => c.id);

            // Note: In a production environment with foreign keys, 
            // you might want to switch to 'superseded' status if you want to keep history,
            // but for "trash prevention", immediate deletion of unfinished sessions is effective.
            await supabaseAdmin
                .from("conversations")
                .delete()
                .in("id", olderIds);
        }

        let flow;

        // 3️⃣ Match flow or load existing
        if (!conversation) {
            isResuming = false;
            const rawMessage = messageText.toLowerCase().trim();
            console.log("🆕 Checking for flow trigger. Message:", rawMessage);

            // Get all active flows for this merchant
            const { data: flows, error: flowError } = await supabaseAdmin
                .from("automation_flows")
                .select("*")
                .eq("merchant_id", merchantId)
                .eq("is_active", true);

            if (flowError) logger.error("❌ Flow Search Error", flowError, { merchantId });

            // flexible Trigger: Check if message matches any keyword (supports commas)
            const matchedFlow = flows?.find(f => {
                const keywords = f.trigger_keyword.toLowerCase().split(',').map((k: string) => k.trim());
                return keywords.some((k: string) => rawMessage.includes(k) && k.length > 0);
            });

            if (!matchedFlow) {
                console.log(`🆕 Attempting auto-start for message: "${rawMessage}"`);

                let bType = merchant?.business_type || 'online_shop';
                if (bType === 'shop') bType = 'online_shop';

                const autoMatched = flows?.find(f => f.business_type === bType);
                if (autoMatched) {
                    flow = autoMatched;
                    console.log("✅ Auto-matched Flow by Type:", flow.name);
                } else if (flows && flows.length > 0) {
                    flow = flows[0];
                    console.log("✅ Fallback to first flow:", flow.name);
                } else {
                    console.log("🚫 No flows available for auto-start.");
                    return;
                }
            } else {
                flow = matchedFlow;
            }

            console.log("✅ Matched Flow:", flow.name, "ID:", flow.id, "triggered by:", rawMessage);

            const { data: newConv, error: createError } = await supabaseAdmin
                .from("conversations")
                .insert({
                    merchant_id: merchantId,
                    page_id: pageId,
                    user_psid: senderId,
                    flow_id: flow.id,
                    temp_data: {},
                    status: "active",
                })
                .select()
                .single();

            if (createError) {
                logger.error("❌ Failed to create conversation", createError, { merchantId, senderId, flowId: flow.id });
                return;
            }

            conversation = newConv;
            console.log("✨ New conversation created:", conversation.id);

            // 🔥 Fetch User Profile Name
            let senderName = "Facebook User";
            try {
                const profile = await getUserProfile(senderId, connection.page_access_token);
                if (profile?.name) {
                    senderName = profile.name;
                    console.log("👤 Fetched User Name:", senderName);
                }
            } catch (err) {
                logger.warn("⚠️ Failed to fetch user name", err);
            }

            // Send welcome message first
            const welcomeMsg = getWelcomeMessage(
                flow.business_type || 'online_shop',
                senderName,
                connection.page_name,
                flow.metadata
            );
            try {
                await sendMessage(pageId, connection.page_access_token, senderId, welcomeMsg);

                // Log welcome message
                await supabaseAdmin.from("messages").insert({
                    user_id: merchantId,
                    sender_id: merchantId,
                    sender_email: "AI-Assistant",
                    sender_name: "Auto-Reply Bot",
                    body: welcomeMsg,
                    content: welcomeMsg,
                    channel: "facebook",
                    status: "replied",
                    conversation_id: conversation.id
                });
            } catch (welcomeErr) {
                logger.warn("⚠️ Welcome message send failed (non-critical)", welcomeErr);
            }

            // Record trigger message for new conversation (so engine sees it)
            await supabaseAdmin.from("messages").insert({
                user_id: merchantId,
                sender_id: senderId,
                sender_email: senderId,
                sender_name: "Facebook User",
                body: messageText,
                content: messageText,
                channel: "facebook",
                status: "received",
                conversation_id: conversation.id,
                metadata: { conversation_id: conversation.id, fb_mid: mid }
            });

            // Transition to engine logic immediately for first question
            // We set isResuming to FALSE here so the engine doesn't try to 
            // validate the trigger message (e.g. "cargo") as the first answer.
            isResuming = false;
        } else {
            console.log("♻️ Resuming active conversation:", conversation.id);

            // 🟢 Migration Handle: If conversation was in 'selecting_type', auto-match it now
            if (conversation.temp_data?._state === 'selecting_type') {
                console.log("🛠️ Migrating orphaned selection state to auto-flow...");

                const { data: flows } = await supabaseAdmin
                    .from("automation_flows")
                    .select("*")
                    .eq("merchant_id", merchantId)
                    .eq("is_active", true);

                let bType = merchant?.business_type || 'online_shop';
                if (bType === 'shop') bType = 'online_shop';

                const matched = flows?.find(f => f.business_type === bType) || flows?.[0];

                if (matched) {
                    flow = matched;
                    await supabaseAdmin.from("conversations").update({
                        flow_id: flow.id,
                        temp_data: {}
                    }).eq("id", conversation.id);

                    conversation.flow_id = flow.id;
                    conversation.temp_data = {};
                    isResuming = false; // Start fresh
                }
            }

            // Normal flow loading
            if (!flow && conversation.flow_id) {
                const { data: existingFlow } = await supabaseAdmin
                    .from("automation_flows")
                    .select("*")
                    .eq("id", conversation.flow_id)
                    .maybeSingle();

                flow = existingFlow;
            }

            // If flow is still missing (e.g. flow was deleted), try to match a new one
            if (!flow) {
                console.log("⚠️ Flow missing or null for active conversation. Attempting to re-match...");
                const rawMessage = messageText.toLowerCase().trim();

                const { data: flows } = await supabaseAdmin
                    .from("automation_flows")
                    .select("*")
                    .eq("merchant_id", merchantId)
                    .eq("is_active", true);

                const matchedFlow = flows?.find(f => {
                    const keyword = f.trigger_keyword.toLowerCase().trim();
                    return rawMessage.includes(keyword);
                });

                if (matchedFlow) {
                    console.log("✅ Re-matched orphaned conversation to flow:", matchedFlow.name);
                    flow = matchedFlow;
                    // Update conversation with new flow_id
                    await supabaseAdmin.from("conversations").update({ flow_id: flow.id }).eq("id", conversation.id);
                    isResuming = false;
                } else {
                    let bType = merchant?.business_type || 'online_shop';
                    if (bType === 'shop') bType = 'online_shop';
                    const selectionMsg = bType === 'cargo'
                        ? "မင်္ဂလာပါ! အောက်ပါတို့မှ တစ်ခုကို ရွေးချယ်ပေးပါခင်ဗျာ:\n\n1️⃣ Cargo ပို့ဆောင်ရန် တောင်းဆိုရန် 📦\n2️⃣ Admin နှင့် စကားပြောရန် 👤"
                        : "မင်္ဂလာပါ! အောက်ပါတို့မှ တစ်ခုကို ရွေးချယ်ပေးပါခင်ဗျာ:\n\n1️⃣ Online Shop မှာ ပစ္စည်းမှာယူရန် 🛍️\n2️⃣ Admin နှင့် စကားပြောရန် 👤";

                    await supabaseAdmin.from("conversations").update({
                        temp_data: { _state: 'selecting_type' }
                    }).eq("id", conversation.id);

                    await sendMessage(pageId, connection.page_access_token, senderId, selectionMsg);
                    return;
                }
            }

            // 4.5 Record incoming message (for Resume path)
            const { data: recordedMsg } = await supabaseAdmin
                .from("messages")
                .select("id")
                .match({ conversation_id: conversation.id, status: 'received' })
                .contains('metadata', { fb_mid: mid })
                .maybeSingle();

            if (!recordedMsg) {
                const { error: msgErr } = await supabaseAdmin.from("messages").insert({
                    user_id: merchantId,
                    sender_id: senderId,
                    sender_email: senderId,
                    sender_name: "Facebook User",
                    body: messageText,
                    content: messageText,
                    channel: "facebook",
                    status: "received",
                    conversation_id: conversation?.id,
                    metadata: { conversation_id: conversation?.id, fb_mid: mid }
                });
                if (msgErr) logger.error("❌ Failed to record linked message", msgErr, { merchantId, conversationId: conversation?.id });
            }
        }

        if (!conversation || !flow) {
            logger.error("💥 Critical: Conversation or flow is null after initialization", null, { conversation, flow });
            return;
        }

        // 5️⃣ Run conversation engine
        console.log("⚙️ Running Conversation Engine. Resuming:", isResuming);
        const result = await runConversationEngine(conversation, messageText, flow, attachments, isResuming);
        console.log("🤖 Engine Result (Summary):", { replyLength: result.reply.length, complete: result.order_complete });

        // 6️⃣ Completion Logic
        if (result.order_complete) {
            console.log("🎉 Conversation Complete. Saving results...");
            const businessType = result.business_type || flow.business_type || 'online_shop';

            const cleanData = Object.keys(result.temp_data || {}).reduce((acc: any, key) => {
                if (!key.startsWith('_')) {
                    acc[key] = result.temp_data[key];
                }
                return acc;
            }, {});

            if (cleanData.payment && !cleanData.payment_method) {
                cleanData.payment_method = cleanData.payment;
            }

            if (businessType === 'cargo') {
                console.log(`📦 Saving Shipment Request for merchant ${merchantId}. Keys:`, Object.keys(cleanData));
                const { error: shipErr } = await supabaseAdmin.from("shipments").insert({
                    merchant_id: merchantId,
                    conversation_id: conversation.id,
                    page_id: pageId,
                    order_no: result.temp_data.order_no,
                    ...cleanData,
                    status: "pending",
                });

                if (shipErr && shipErr.message.includes('column') && shipErr.message.includes('does not exist')) {
                    const { item_photos, ...safeData } = cleanData;
                    await supabaseAdmin.from("shipments").insert({
                        merchant_id: merchantId,
                        conversation_id: conversation.id,
                        page_id: pageId,
                        order_no: result.temp_data.order_no,
                        ...safeData,
                        status: "pending",
                    });
                }
            } else {
                console.log(`🛍️ Saving Order for merchant ${merchantId}. Keys:`, Object.keys(cleanData));
                const { error: orderErr } = await supabaseAdmin.from("orders").insert({
                    merchant_id: merchantId,
                    conversation_id: conversation.id,
                    page_id: pageId,
                    order_no: result.temp_data.order_no,
                    ...cleanData,
                    status: "pending",
                });
                if (orderErr && orderErr.message.includes('column') && orderErr.message.includes('does not exist')) {
                    const { item_photos, ...safeData } = cleanData;
                    await supabaseAdmin.from("orders").insert({
                        merchant_id: merchantId,
                        conversation_id: conversation.id,
                        page_id: pageId,
                        order_no: result.temp_data.order_no,
                        ...safeData,
                        status: "pending",
                    });
                }
            }
            await supabaseAdmin.from("conversations").update({ status: "completed" }).eq("id", conversation.id);
        }

        // 7️⃣ Send Reply
        console.log("📤 Sending reply to Facebook...");
        await sendMessage(pageId, connection.page_access_token, senderId, result.reply);
        console.log("🏁 Webhook processing finished successfully.");

    } catch (error) {
        logger.error("🔴 GLOBAL WEBHOOK ERROR", error);
        // We dont send 500 here because we already sent 200 early or it might cause more retries
    }
};
