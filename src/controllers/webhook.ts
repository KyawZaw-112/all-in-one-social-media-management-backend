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
    console.log("Webhook received:");
    console.log(JSON.stringify(req.body, null, 2));
    try {
        const pageId = req.body.entry?.[0]?.id;
        const senderId =
            req.body.entry?.[0]?.messaging?.[0]?.sender?.id;
        const messageText =
            req.body.entry?.[0]?.messaging?.[0]?.message?.text;

        if (!pageId || !senderId || !messageText) {
            return res.sendStatus(200);
        }

        // 1️⃣ Find merchant connection
        const { data: connection } = await supabaseAdmin
            .from("platform_connections")
            .select("*")
            .eq("page_id", pageId)
            .single();

        if (!connection) return res.sendStatus(200);

        const merchantId = connection.merchant_id;

        // 2️⃣ Find existing active conversation
        let { data: conversation } = await supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("merchant_id", merchantId)
            .eq("user_psid", senderId)
            .eq("status", "active")
            .maybeSingle();

        let flow;

        // 3️⃣ If no conversation → match trigger
        if (!conversation) {
            const { data: matchedFlow } = await supabaseAdmin
                .from("automation_flows")
                .select("*")
                .eq("merchant_id", merchantId)
                .eq("trigger_keyword", messageText)
                .eq("is_active", true)
                .single();

            if (!matchedFlow) return res.sendStatus(200);

            flow = matchedFlow;

            const { data: newConversation } = await supabaseAdmin
                .from("conversations")
                .insert({
                    merchant_id: merchantId,
                    user_psid: senderId,
                    flow_id: flow.id,
                    temp_data: {},
                    status: "active",
                })
                .select()
                .single();

            conversation = newConversation;
        } else {
            const { data: existingFlow } = await supabaseAdmin
                .from("automation_flows")
                .select("*")
                .eq("id", conversation.flow_id)
                .single();

            flow = existingFlow;
        }

        if (!conversation || !flow) {
            return res.sendStatus(200);
        }

        // 4️⃣ Run AI conversation engine
        const result = await runConversationEngine(
            conversation,
            messageText,
            flow
        );

        // 5️⃣ Auto create order if completed
        if (result.order_complete) {
            await supabaseAdmin.from("orders").insert({
                merchant_id: merchantId,
                conversation_id: conversation.id,
                ...result.temp_data,
                status: "pending",
            });

            await supabaseAdmin
                .from("conversations")
                .update({ status: "completed" })
                .eq("id", conversation.id);
        }

        // 6️⃣ Send reply to Messenger
        await sendMessage(
            pageId,
            connection.page_access_token,
            senderId,
            result.reply
        );

        return res.sendStatus(200);
    } catch (error) {
        console.error("Webhook error:", error);
        return res.sendStatus(500);
    }
};
