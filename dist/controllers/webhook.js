import { runRuleEngine } from "../services/ruleEngine.js";
import { sendMessage } from "../services/facebook.services.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
export const verifyWebhook = (req, res) => {
    const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
};
export const handleWebhook = async (req, res) => {
    const body = req.body;
    if (body.object !== "page") {
        return res.sendStatus(404);
    }
    for (const entry of body.entry) {
        const pageId = entry.id;
        // Messenger events
        if (entry.messaging) {
            for (const event of entry.messaging) {
                if (!event?.message?.text)
                    continue;
                const senderId = event.sender.id;
                const text = event.message.text;
                const reply = await runRuleEngine(pageId, text, "messenger");
                if (!reply)
                    continue;
                const { data } = await supabaseAdmin
                    .from("platform_connections")
                    .select("page_access_token")
                    .eq("page_id", pageId)
                    .single();
                if (!data)
                    continue;
                await sendMessage(pageId, data.page_access_token, senderId, reply);
            }
        }
    }
    res.sendStatus(200);
};
