const axios = require('axios');
require('dotenv').config();

async function run() {
    const pageId = "957808180755824"; // Bluh bluh
    const senderId = "TEST_SENDER_123";
    const messageText = "Hi";

    console.log(`🧪 Simulating Webhook for Page: ${pageId}...`);

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

    try {
        // We need the local URL or the production URL
        // Let's try to hit the local one if running in the terminal
        const url = "http://localhost:4000/api/webhook/facebook";
        console.log(`📡 Hitting: ${url}`);

        const res = await axios.post(url, payload);
        console.log("✅ Response Status:", res.status);
        console.log("✅ Response Data:", res.data);

    } catch (err) {
        console.error("❌ Simulation Failed:", err.message);
        if (err.response) {
            console.error("Data:", err.response.data);
        }
    }
}

run().catch(console.error);
