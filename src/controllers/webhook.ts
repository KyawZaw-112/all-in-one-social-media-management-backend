import { sendMessage } from "../services/facebook.services.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { Request, Response } from "express";
import { runConversationEngine } from "../services/conversationEngine.js";

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
        let { data: conversation, error: convError } = await supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("merchant_id", merchantId)
            .eq("user_psid", senderId)
            .eq("status", "active")
            .maybeSingle();

        if (convError) console.error("❌ Conversation Search Error:", convError);

        let flow;

        // 3️⃣ Match flow or load existing
        if (!conversation) {
            const keyword = messageText.toLowerCase().trim();
            console.log("🆕 Initializing new conversation. Keyword:", keyword);

            const { data: matchedFlow, error: flowError } = await supabaseAdmin
                .from("automation_flows")
                .select("*")
                .eq("merchant_id", merchantId)
                .eq("trigger_keyword", keyword)
                .eq("is_active", true)
                .maybeSingle();

            if (flowError) console.error("❌ Flow Search Error:", flowError);

            if (!matchedFlow) {
                console.log("🚫 No active flow matched for:", keyword);
                return res.sendStatus(200);
            }

            flow = matchedFlow;
            console.log("✅ Matched Flow:", flow.name, "ID:", flow.id);

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
        } else {
            console.log("♻️ Resuming active conversation:", conversation.id);
            const { data: existingFlow } = await supabaseAdmin
                .from("automation_flows")
                .select("*")
                .eq("id", conversation.flow_id)
                .single();

            flow = existingFlow;
        }

        if (!conversation || !flow) {
            console.error("💥 Critical: Conversation or flow is null after initialization");
            return res.sendStatus(200);
        }

        // 4️⃣ Run conversation engine
        console.log("⚙️ Running Conversation Engine...");
        const result = await runConversationEngine(conversation, messageText, flow);
        console.log("🤖 Engine Result (Summary):", { replyLength: result.reply.length, complete: result.order_complete });

        // 5️⃣ Completion Logic
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

        // 6️⃣ Send Reply
        console.log("📤 Sending reply to Facebook...");
        await sendMessage(pageId, connection.page_access_token, senderId, result.reply);
        console.log("🏁 Webhook processing finished successfully.");

        return res.sendStatus(200);
    } catch (error) {
        console.error("🔴 GLOBAL WEBHOOK ERROR:", error);
        return res.sendStatus(500);
    }
};
