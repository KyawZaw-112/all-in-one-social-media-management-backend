import { sendMessage } from "../services/facebook.services.js";
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

        // Cleanup: If there are multiple active conversations, mark older ones as completed/superseded
        if (activeConvs && activeConvs.length > 1) {
            console.log(`🧹 Cleaning up ${activeConvs.length - 1} duplicate active conversations for PSID: ${senderId}`);
            const olderIds = activeConvs.slice(1).map(c => c.id);
            await supabaseAdmin
                .from("conversations")
                .update({ status: "superseded" })
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

            // Flexible Trigger: Check if message contains the trigger keyword
            const matchedFlow = flows?.find(f => {
                const keyword = f.trigger_keyword.toLowerCase().trim();
                return rawMessage.includes(keyword);
            });

            if (!matchedFlow) {
                console.log("🚫 No active flow matched for:", rawMessage);
                // Record orphaned message for visibility
                await supabaseAdmin.from("messages").insert({
                    user_id: merchantId,
                    sender_id: senderId,
                    sender_email: senderId,
                    sender_name: "Facebook User",
                    body: messageText,
                    channel: "facebook",
                    status: "received"
                });

                // Send default fallback reply
                const defaultReply = getDefaultReply();
                try {
                    await sendMessage(pageId, connection.page_access_token, senderId, defaultReply);

                    // Log fallback reply
                    await supabaseAdmin.from("messages").insert({
                        user_id: merchantId,
                        sender_id: merchantId,
                        sender_email: "AI-Assistant",
                        sender_name: "Auto-Reply Bot",
                        body: defaultReply,
                        channel: "facebook",
                        status: "replied"
                    });
                } catch (sendErr) {
                    console.error("❌ Failed to send default reply:", sendErr);
                }

                return res.sendStatus(200);
            }

            flow = matchedFlow;
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

            // Send welcome message first
            const welcomeMsg = getWelcomeMessage(flow.business_type || 'online_shop');
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

            if (conversation.flow_id) {
                const { data: existingFlow } = await supabaseAdmin
                    .from("automation_flows")
                    .select("*")
                    .eq("id", conversation.flow_id)
                    .maybeSingle(); // Use maybeSingle to avoid error if missing

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
                    isResuming = false; // Treat as new flow start since we just matched it
                } else {
                    console.log("🚫 Could not re-match flow. Treating as orphaned message.");
                }
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

            if (businessType === 'cargo') {
                await supabaseAdmin.from("shipments").insert({
                    merchant_id: merchantId,
                    conversation_id: conversation.id,
                    ...result.temp_data,
                    status: "pending",
                });
            } else {
                await supabaseAdmin.from("orders").insert({
                    merchant_id: merchantId,
                    conversation_id: conversation.id,
                    ...result.temp_data,
                    status: "pending",
                });
            }

            await supabaseAdmin.from("conversations").update({ status: "completed" }).eq("id", conversation.id);
        }

        // 7️⃣ Send Reply
        console.log("📤 Sending reply to Facebook...");
        await sendMessage(pageId, connection.page_access_token, senderId, result.reply);
        console.log("🏁 Webhook processing finished successfully.");

        return res.sendStatus(200);
    } catch (error) {
        console.error("🔴 GLOBAL WEBHOOK ERROR:", error);
        return res.sendStatus(500);
    }
};
