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
        const { data: connection, error: connError } = await supabaseAdmin
            .from("platform_connections")
            .select("*")
            .eq("page_id", pageId)
            .maybeSingle();

        console.log("🔍 Connection Search:", { pageId, found: !!connection, error: connError });

        if (!connection) {
            console.log("⚠️ No connection found for Page ID:", pageId);
            return res.sendStatus(200);
        }

        // Fix: connection might use 'user_id' as saved in oauth.ts
        const merchantId = connection.user_id || connection.merchant_id;
        console.log("👤 Merchant identified:", merchantId);

        let { data: conversation, error: convError } = await supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("merchant_id", merchantId)
            .eq("user_psid", senderId)
            .eq("status", "active")
            .maybeSingle();

        if (convError) console.error("❌ Conversation lookup error:", convError);

        let flow;

        // 3️⃣ If no conversation → match trigger
        if (!conversation) {
            const keyword = messageText.toLowerCase().trim();
            console.log("🆕 New conversation attempt. Keyword:", keyword);

            const { data: matchedFlow, error: errorFlow } = await supabaseAdmin
                .from("automation_flows")
                .select("*")
                .eq("merchant_id", merchantId)
                .eq("trigger_keyword", keyword)
                .eq("is_active", true)
                .maybeSingle();

            if (errorFlow) {
                console.error("❌ Error fetching flow:", errorFlow);
                return res.sendStatus(200);
            }

            if (!matchedFlow) {
                console.log("🚫 No active flow matched for keyword:", keyword, "Merchant:", merchantId);
                return res.sendStatus(200);
            }

            flow = matchedFlow;
            console.log("✅ Flow matched:", flow.name);

            const { data: newConversation, error: insertError } =
                await supabaseAdmin
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

            if (insertError) {
                console.error("❌ Insert conversation error:", insertError);
                return res.sendStatus(200);
            }

            conversation = newConversation;
        } else {
            console.log("♻️ Existing conversation found:", conversation.id);
            const { data: existingFlow } = await supabaseAdmin
                .from("automation_flows")
                .select("*")
                .eq("id", conversation.flow_id)
                .single();

            flow = existingFlow;
        }

        if (!conversation || !flow) {
            console.log("⚠️ Conversation or flow missing at runtime", { conversation: !!conversation, flow: !!flow });
            return res.sendStatus(200);
        }

        // 4️⃣ Run AI conversation engine
        const result = await runConversationEngine(
            conversation,
            messageText,
            flow
        );

        // 5️⃣ Auto create order/shipment if completed
        if (result.order_complete) {
            const businessType = result.business_type || flow.business_type || 'online_shop';

            if (businessType === 'cargo') {
                // Create shipment record for cargo business
                await supabaseAdmin.from("shipments").insert({
                    merchant_id: merchantId,
                    conversation_id: conversation.id,
                    package_type: result.temp_data.package_type,
                    weight: result.temp_data.weight,
                    pickup_address: result.temp_data.pickup_address,
                    delivery_address: result.temp_data.delivery_address,
                    phone_number: result.temp_data.phone_number,
                    delivery_urgency: result.temp_data.delivery_urgency || 'standard',
                    status: "pending",
                });
            } else {
                // Create order record for online shop
                await supabaseAdmin.from("orders").insert({
                    merchant_id: merchantId,
                    conversation_id: conversation.id,
                    ...result.temp_data,
                    status: "pending",
                });
            }

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
