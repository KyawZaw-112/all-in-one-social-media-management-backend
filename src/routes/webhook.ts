import { Router } from "express";
import fetch from "node-fetch";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

/**
 * Facebook Webhook Verification
 */
router.get("/facebook", (req, res) => {
    const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
});

/**
 * Facebook Webhook Event Receiver
 */
router.post("/facebook", async (req, res) => {
    const body = req.body;

    try {
        if (body.object !== "page") {
            return res.sendStatus(404);
        }

        for (const entry of body.entry) {
            const pageId = entry.id; // 👈 IMPORTANT
            const event = entry.messaging?.[0];

            if (!event?.message?.text) continue;

            const senderId = event.sender.id;
            const userMessage = event.message.text;

            console.log("Incoming:", userMessage, "from page:", pageId);

            // 1️⃣ Get correct page token from DB
            const { data, error } = await supabaseAdmin
                .from("platform_connections")
                .select("page_access_token")
                .eq("page_id", pageId)
                .eq("connected", true)
                .single();

            if (error || !data) {
                console.error("No page token found:", error);
                continue;
            }

            const pageToken = data.page_access_token;

            // 2️⃣ Send reply using that page token
            await fetch(
                `https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        recipient: { id: senderId },
                        message: {
                            text: "Hello! Your auto-reply system is active 🚀",
                        },
                    }),
                }
            );
        }

        return res.sendStatus(200);
    } catch (err) {
        console.error("Webhook error:", err);
        return res.sendStatus(500);
    }
});

export default router;
