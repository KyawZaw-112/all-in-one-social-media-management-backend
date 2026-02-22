import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkUnresponsive() {
    console.log("🔍 Checking for recent UNRESPONSIVE messages...");

    // Get last 20 received messages
    const { data: received, error } = await supabaseAdmin
        .from("messages")
        .select("id, user_id, sender_id, body, created_at, metadata")
        .eq("status", "received")
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        console.error("❌ Error fetching received:", error);
        return;
    }

    for (const msg of received) {
        const convId = msg.metadata?.conversation_id;

        if (convId) {
            // Check if there is a reply for this conversation after this message
            const { data: reply } = await supabaseAdmin
                .from("messages")
                .select("id")
                .eq("status", "replied")
                .contains('metadata', { conversation_id: convId })
                .gt("created_at", msg.created_at)
                .maybeSingle();

            if (!reply) {
                console.log(`⚠️ NO REPLY for: [${msg.created_at}] Merchant: ${msg.user_id}, Body: "${msg.body}"`);
            } else {
                console.log(`✅ Repied to: [${msg.created_at}] Merchant: ${msg.user_id}`);
            }
        } else {
            console.log(`❓ NO CONV_ID for: [${msg.created_at}] Merchant: ${msg.user_id}, Body: "${msg.body}"`);
        }
    }
}

checkUnresponsive();
