import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkRecentActivity() {
    console.log("🔍 Checking recent conversations...");
    const { data: convs, error: convError } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

    if (convError) {
        console.error("❌ Error fetching conversations:", convError);
        return;
    }

    if (!convs || convs.length === 0) {
        console.log("ℹ️ No conversations found.");
        return;
    }

    for (const conv of convs) {
        console.log(`\n--- Conversation ID: ${conv.id} ---`);
        console.log(`Merchant: ${conv.merchant_id}`);
        console.log(`Status: ${conv.status}`);
        console.log(`Created: ${conv.created_at}`);
        console.log(`Temp Data: ${JSON.stringify(conv.temp_data)}`);

        const { data: msgs } = await supabaseAdmin
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true });

        if (msgs && msgs.length > 0) {
            console.log("Messages:");
            msgs.forEach(m => {
                console.log(`  [${m.role.toUpperCase()}] ${m.content}`);
            });
        } else {
            console.log("  (No messages found)");
        }
    }
}

checkRecentActivity().catch(console.error);
