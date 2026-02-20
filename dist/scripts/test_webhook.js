import fetch from "node-fetch";
async function testWebhook() {
    const url = "https://all-in-one-social-media-management.onrender.com/api/webhook/facebook";
    const payload = {
        object: "page",
        entry: [
            {
                id: "100530332303174",
                messaging: [
                    {
                        sender: { id: "test_user_ai" },
                        message: { text: "order" }
                    }
                ]
            }
        ]
    };
    console.log("🚀 Sending test webhook to:", url);
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    console.log("📡 Response Status:", response.status);
    const text = await response.text();
    console.log("📝 Response Body:", text);
}
testWebhook().catch(console.error);
