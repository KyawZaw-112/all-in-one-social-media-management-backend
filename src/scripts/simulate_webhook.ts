import "../env.js";
import axios from "axios";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function simulateWebhook(pageId: string, senderId: string, text: string) {
    console.log(`\n🚀 Simulating Webhook for Page: ${pageId}, Sender: ${senderId}, Text: "${text}"`);

    const payload = {
        object: "page",
        entry: [{
            id: pageId,
            time: Date.now(),
            messaging: [{
                sender: { id: senderId },
                recipient: { id: pageId },
                timestamp: Date.now(),
                message: {
                    mid: `sim_${Date.now()}`,
                    text: text
                }
            }]
        }]
    };

    try {
        // We call our own webhook endpoint via axios (assuming it's reachable or we use direct function call if possible)
        // Since we are running in the backend environment, we can actually import the handler or just hit the URL.
        // Let's hit the relative URL if we find the server port, or assume 3000.

        console.log("📡 Sending simulation payload to /api/webhook...");
        const response = await axios.post("http://localhost:3000/api/webhook", payload);
        console.log("✅ Response Status:", response.status);

        // Now check if a conversation was created
        setTimeout(async () => {
            const { data: conv } = await supabaseAdmin
                .from("conversations")
                .select("*")
                .eq("page_id", pageId)
                .eq("user_psid", senderId)
                .maybeSingle();

            if (conv) {
                console.log("✅ Simulation SUCCESS: Conversation created!");
                console.log("🤖 Last Temp Data:", JSON.stringify(conv.temp_data, null, 2));

                const { data: msgs } = await supabaseAdmin
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", conv.id)
                    .order("created_at", { ascending: false });

                console.log(`📩 Messages in DB for this conversation: ${msgs?.length || 0}`);
                msgs?.forEach(m => console.log(`- [${m.sender_name}]: ${m.body}`));
            } else {
                console.log("❌ Simulation FAILED: No conversation was created.");
            }
        }, 3000);

    } catch (err: any) {
        console.error("❌ Simulation Error:", err.message);
        if (err.code === 'ECONNREFUSED') {
            console.log("💡 Tip: Ensure the main server is running on port 3000.");
        }
    }
}

async function run() {
    // Testing with "Bluh bluh"
    await simulateWebhook("957808180755824", "sim_user_123", "order");
}

run().catch(console.error);
