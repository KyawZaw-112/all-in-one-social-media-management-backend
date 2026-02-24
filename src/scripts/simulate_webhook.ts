
import dotenv from "dotenv";
import axios from "axios";
import crypto from "node:crypto";

dotenv.config();

async function simulateWebhook() {
    const pageId = "957808180755824"; // Junior Alex's Page ID
    const senderId = "TEST_SENDER_123";
    const messageText = "hi";

    const payload = {
        object: "page",
        entry: [
            {
                id: pageId,
                time: Date.now(),
                messaging: [
                    {
                        sender: { id: senderId },
                        recipient: { id: pageId },
                        timestamp: Date.now(),
                        message: {
                            mid: `mid.test.${Date.now()}`,
                            text: messageText
                        }
                    }
                ]
            }
        ]
    };


    const APP_SECRET = process.env.FACEBOOK_APP_SECRET!;

    const rawBody = JSON.stringify(payload);
    const expectedHash = crypto
        .createHmac("sha256", APP_SECRET)
        .update(rawBody)
        .digest("hex");

    console.log("🚀 Sending Simulate Webhook...");
    try {
        const res = await axios.post("http://localhost:4000/api/webhook/facebook", payload, {
            headers: {
                "Content-Type": "application/json",
                "x-hub-signature-256": `sha256=${expectedHash}`
            }
        });
        console.log("✅ Response Status:", res.status);
    } catch (err: any) {
        console.error("❌ Simulation Failed:", err.response?.data || err.message);
    }
}

simulateWebhook();
