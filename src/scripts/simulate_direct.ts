import "../env.js";
import { handleWebhook } from "../controllers/webhook.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function simulateDirect(pageId: string, senderId: string, text: string) {
    console.log(`\n🚀 Direct Simulation for Page: ${pageId}, Sender: ${senderId}, Text: "${text}"`);

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
                    mid: `sim_direct_${Date.now()}`,
                    text: text
                }
            }]
        }]
    };

    // Mock Express Request & Response
    const req = { body: payload } as any;
    const res = {
        sendStatus: (status: number) => {
            console.log(`📡 Res Status Sent: ${status}`);
            return res;
        },
        status: (status: number) => {
            console.log(`📡 Res Status: ${status}`);
            return res;
        },
        send: (msg: any) => {
            console.log(`📡 Res Send: ${msg}`);
            return res;
        }
    } as any;

    try {
        await handleWebhook(req, res);

        // Wait and check DB
        console.log("⏳ Waiting for DB updates...");
        setTimeout(async () => {
            const { data: conv } = await supabaseAdmin
                .from("conversations")
                .select("*")
                .eq("page_id", pageId)
                .eq("user_psid", senderId)
                .maybeSingle();

            if (conv) {
                console.log("✅ SUCCESS: Webhook logic processed and Conversation created!");
                console.log("📊 Flow ID:", conv.flow_id);

                // Check for bot's reply message
                const { data: msgs } = await supabaseAdmin
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", conv.id)
                    .order("created_at", { ascending: false });

                console.log(`📩 Messages generated: ${msgs?.length || 0}`);
                msgs?.forEach(m => console.log(`- [${m.sender_name}]: ${m.body?.substring(0, 50)}...`));
            } else {
                console.log("❌ FAILED: Processing complete but no conversation found in DB.");
            }
        }, 3000);

    } catch (err: any) {
        console.error("❌ Simulation Error:", err);
    }
}

async function run() {
    // Test Kay
    await simulateDirect("100530332303174", "sim_kay_user", "buy");

    // Give some time
    await new Promise(r => setTimeout(r, 5000));

    // Test Bluh bluh
    await simulateDirect("957808180755824", "sim_bluh_user", "cargo");
}

run().catch(console.error);
