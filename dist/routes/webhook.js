import { Router } from "express";
const router = Router();
router.get("/facebook", (req, res) => {
    const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});
router.post("/facebook", async (req, res) => {
    const body = req.body;
    if (body.object === "page") {
        for (const entry of body.entry) {
            const event = entry.messaging?.[0];
            if (event?.message?.text) {
                console.log("Incoming message:", event.message.text);
                // Auto reply logic here
            }
        }
    }
    res.sendStatus(200);
});
export default router;
