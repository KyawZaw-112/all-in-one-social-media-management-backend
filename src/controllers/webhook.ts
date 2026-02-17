import {runRuleEngine} from "../services/ruleEngine.js";
import {sendMessage} from "../services/facebook.services.js";
import {supabaseAdmin} from "../supabaseAdmin.js";
import {Request, Response} from "express";
import {runConversationEngine} from "../services/conversationEngine.js";
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
    const body = req.body;

    if (body.object !== "page") {
        return res.sendStatus(404);
    }

    try {
        for (const entry of body.entry) {
            const pageId = String(entry.id);

            if (!entry.messaging) continue;

            for (const event of entry.messaging) {
                if (!event?.message?.text) continue;

                const senderId = event.sender.id;
                const messageText = event.message.text.trim();

                // 1️⃣ Save incoming message
                await supabaseAdmin.from("messages").insert({
                    page_id: pageId,
                    sender_id: senderId,
                    body: messageText,
                    direction: "incoming"
                });

                // 2️⃣ Get page access token
                const { data: connection } = await supabaseAdmin
                    .from("platform_connections")
                    .select("page_access_token")
                    .eq("page_id", pageId)
                    .single();

                if (!connection) continue;

                // 3️⃣ Get merchant
                const { data: merchant } = await supabaseAdmin
                    .from("merchants")
                    .select("*")
                    .eq("page_id", pageId)
                    .single();

                if (!merchant) continue;

                // 4️⃣ Get or create conversation
                let { data: conversation } = await supabaseAdmin
                    .from("conversations")
                    .select("*")
                    .eq("page_id", pageId)
                    .eq("sender_id", senderId)
                    .maybeSingle();

                if (!conversation) {
                    const { data: newConv } = await supabaseAdmin
                        .from("conversations")
                        .insert({
                            page_id: pageId,
                            sender_id: senderId,
                            current_step: "ASK_PRODUCT"
                        })
                        .select()
                        .single();

                    conversation = newConv;
                }

                // 5️⃣ Run conversation engine
                const result = await runConversationEngine(
                    conversation,
                    messageText,
                    merchant
                );

                // 6️⃣ Update conversation
                await supabaseAdmin
                    .from("conversations")
                    .update({
                        current_step: result.nextStep,
                        temp_data: {
                            ...conversation.temp_data,
                            ...result.save
                        },
                        updated_at: new Date()
                    })
                    .eq("id", conversation.id);

                // 7️⃣ If DONE → create order
                if (result.nextStep === "DONE") {

                    const finalData = {
                        ...conversation.temp_data,
                        ...result.save
                    };

                    await supabaseAdmin.from("orders").insert({
                        page_id: pageId,
                        sender_id: senderId,
                        product_id: finalData.product,
                        qty: finalData.qty,
                        address: finalData.address,
                        order_status: "confirmed",
                        payment_status:
                            merchant.business_type === "cargo"
                                ? "none"
                                : "pending",
                        shipping_status: "none"
                    });

                    await supabaseAdmin
                        .from("conversations")
                        .delete()
                        .eq("id", conversation.id);
                }

                // 8️⃣ Send reply
                await sendMessage(
                    pageId,
                    connection.page_access_token,
                    senderId,
                    result.reply
                );

                // Save outgoing
                await supabaseAdmin.from("messages").insert({
                    page_id: pageId,
                    sender_id: senderId,
                    body: result.reply,
                    direction: "outgoing"
                });
            }
        }

        return res.sendStatus(200);

    } catch (err) {
        console.error("Webhook error:", err);
        return res.sendStatus(500);
    }
};
