import {runRuleEngine} from "../services/ruleEngine.js";
import {sendMessage} from "../services/facebook.services.js";
import {supabaseAdmin} from "../supabaseAdmin.js";
import {Request, Response} from "express";

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
            const pageId = String(entry.id); // 🔥 ensure string match
            console.log("Webhook Page ID:", pageId);

            if (!entry.messaging) continue;

            for (const event of entry.messaging) {
                if (!event?.message?.text) continue;

                const senderId = event.sender.id;
                const messageText = event.message.text;

                console.log("Incoming message:", messageText);

                // 🔥 get page access token
                const { data: connection, error } = await supabaseAdmin
                    .from("platform_connections")
                    .select("page_access_token")
                    .eq("page_id", pageId)
                    .single();

                if (error || !connection) {
                    console.error("No access token for page:", pageId);
                    continue;
                }

                // 🔥 run rule engine
                const reply = await runRuleEngine(pageId, messageText);

                console.log("Engine reply:", reply);

                if (reply) {
                    await sendMessage(
                        pageId,
                        connection.page_access_token,
                        senderId,
                        reply
                    );

                    // Save outgoing message
                    await supabaseAdmin.from("messages").insert({
                        page_id: pageId,
                        sender_id: senderId,
                        body: reply,
                        direction: "outgoing"
                    });
                }
            }
        }

        return res.sendStatus(200); // 🔥 must be outside loop
    } catch (err) {
        console.error("Webhook error:", err);
        return res.sendStatus(500);
    }
};
