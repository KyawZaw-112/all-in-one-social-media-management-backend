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

    for (const entry of body.entry) {
        const pageId = entry.id;

        if (entry.messaging) {
            for (const event of entry.messaging) {
                if (!event?.message?.text) continue;

                const senderId = event.sender.id;

                const {data} = await supabaseAdmin
                    .from("platform_connections")
                    .select("page_access_token")
                    .eq("page_id", pageId)
                    .single();

                console.log("Token:", data);

                if (!data) {
                    console.error("No access token found for page:", pageId);
                    continue;
                }
                const reply = await runRuleEngine(
                    pageId,
                    event.message.text
                );

                if (reply) {
                    await sendMessage(
                        pageId,
                        data.page_access_token,
                        senderId,
                        reply
                    );

                    // Save outgoing message
                    await supabaseAdmin.from("messages").insert({
                        page_id: pageId,
                        sender_id: senderId,
                        body: reply,
                        direction: "outgoing"
                    })
                }
            }
        }


        res.sendStatus(200);
    }
};
