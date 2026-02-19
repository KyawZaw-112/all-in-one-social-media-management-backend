import { sendMessage, getUserProfile } from "../services/facebook.services.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { Request, Response } from "express";
import { runConversationEngine, getDefaultReply, getWelcomeMessage } from "../services/conversationEngine.js";

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
    console.log("📥 Webhook received:", JSON.stringify(req.body, null, 2));

    try {
        const entry = req.body.entry?.[0];
        const messaging = entry?.messaging?.[0];
        const isEcho = messaging?.message?.is_echo;

        if (isEcho) {
            console.log("🗣️ Ignoring message echo from Facebook");
            return res.sendStatus(200);
        }

        const pageId = entry?.id;
        const senderId = messaging?.sender?.id;
        const messageText = messaging?.message?.text;

        console.log("📝 Parsed Webhook Data:", { pageId, senderId, messageText: messageText?.substring(0, 20) });

        if (!pageId || !senderId || !messageText) {
            console.log("⚠️ Missing required data (pageId/senderId/messageText)");
            return res.sendStatus(200);
        }

        // 1️⃣ Find merchant connection
        const { data: connection, error: connError } = await supabaseAdmin
            .from("platform_connections")
            .select("*")
            .eq("page_id", pageId)
            .maybeSingle();

        if (connError) {
            console.error("❌ Connection Search Error:", connError);
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
                channel: "facebook",
                status: "received"
            });
            // Send a small confirmation that admin is notified (optional, but good UX)
            await sendMessage(pageId, connection.page_access_token, senderId, "ခဏစောင့်ပေးပါခင်ဗျာ။ Admin မှ မကြာခင် ပြန်လည်ဖြေကြားပေးပါမည်။ 🙏");
            return res.sendStatus(200);
        }

        // 1.5️⃣ Check Subscription Status (Disabled as per user request to let page owner handle)
        const { data: merchant, error: merchError } = await supabaseAdmin
            .from("merchants")
            .select("subscription_status, trial_ends_at, business_type")
            .eq("id", merchantId)
            .maybeSingle();

        if (merchError) console.error("❌ Merchant Search Error:", merchError);

        // 2️⃣ Check for active conversation
        let isResuming = true;
        let { data: activeConvs, error: convError } = await supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("merchant_id", merchantId)
            .eq("user_psid", senderId)
            .eq("status", "active")
            .order("created_at", { ascending: false });

        if (convError) console.error("❌ Conversation Search Error:", convError);

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

            if (flowError) console.error("❌ Flow Search Error:", flowError);

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
                    return res.sendStatus(200);
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
                console.error("❌ Failed to create conversation:", createError);
                return res.sendStatus(200);
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
                console.error("⚠️ Failed to fetch user name:", err);
            }

            // Send welcome message first
            const welcomeMsg = getWelcomeMessage(
                flow.business_type || 'online_shop',
                senderName,
                connection.page_name,

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
                    channel: "facebook",
                    status: "replied",
                    conversation_id: conversation.id
                });
            } catch (welcomeErr) {
                console.error("⚠️ Welcome message send failed (non-critical):", welcomeErr);
            }
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
                    return res.sendStatus(200);
                }
            }

            // 4.5 Record incoming message
            const { error: msgErr } = await supabaseAdmin.from("messages").insert({
                user_id: merchantId,
                sender_id: senderId,
                sender_email: senderId,
                sender_name: "Facebook User",
                body: messageText,
                channel: "facebook",
                status: "received",
                conversation_id: conversation?.id,
                metadata: { conversation_id: conversation?.id }
            });
            if (msgErr) console.error("❌ Failed to record linked message:", msgErr);

            if (!conversation || !flow) {
                console.error("💥 Critical: Conversation or flow is null after initialization");
                return res.sendStatus(200);
            }

            // 5️⃣ Run conversation engine
            console.log("⚙️ Running Conversation Engine. Resuming:", isResuming);
            const result = await runConversationEngine(conversation, messageText, flow, isResuming);
            console.log("🤖 Engine Result (Summary):", { replyLength: result.reply.length, complete: result.order_complete });

            // 6️⃣ Completion Logic
            if (result.order_complete) {
                console.log("🎉 Conversation Complete. Saving results...");
                const businessType = result.business_type || flow.business_type || 'online_shop';

                // Clean tempData: remove internal fields starting with "_"
                // and map common fields to ensure database compatibility
                const cleanData = Object.keys(result.temp_data || {}).reduce((acc: any, key) => {
                    if (!key.startsWith('_')) {
                        acc[key] = result.temp_data[key];
                    }
                    return acc;
                }, {});

                // Force mapping for common fields if missing
                if (cleanData.payment && !cleanData.payment_method) {
                    cleanData.payment_method = cleanData.payment;
                }

                if (businessType === 'cargo') {
                    console.log(`📦 Saving Shipment Request for merchant ${merchantId}:`, cleanData);
                    const { error: shipErr } = await supabaseAdmin.from("shipments").insert({
                        merchant_id: merchantId,
                        conversation_id: conversation.id,
                        ...cleanData,
                        status: "pending",
                    });
                    if (shipErr) {
                        console.error("❌ Shipment Insertion Failed:", shipErr.message, shipErr.details);
                    } else {
                        console.log("✅ Shipment saved successfully.");
                    }
                } else {
                    console.log(`🛍️ Saving Order for merchant ${merchantId}:`, cleanData);
                    const { error: orderErr } = await supabaseAdmin.from("orders").insert({
                        merchant_id: merchantId,
                        conversation_id: conversation.id,
                        ...cleanData,
                        status: "pending",
                    });
                    if (orderErr) {
                        console.error("❌ Order Insertion Failed:", orderErr.message, orderErr.details);
                    } else {
                        console.log("✅ Order saved successfully.");
                    }
                }

                await supabaseAdmin.from("conversations").update({ status: "completed" }).eq("id", conversation.id);
            }

            // 7️⃣ Send Reply
            console.log("📤 Sending reply to Facebook...");
            await sendMessage(pageId, connection.page_access_token, senderId, result.reply);
            console.log("🏁 Webhook processing finished successfully.");

            return res.sendStatus(200);
        }
    } catch (error) {
        console.error("🔴 GLOBAL WEBHOOK ERROR:", error);
        return res.sendStatus(500);
    }
};
