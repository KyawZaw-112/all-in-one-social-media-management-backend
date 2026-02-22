import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkMessages() {
    console.log("🔍 Checking recent 'received' messages in 'messages' table...");
    const { data: messages, error } = await supabaseAdmin
        .from("messages")
        .select("user_id, sender_id, sender_name, body, status, created_at")
        .eq("status", "received")
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) console.error("❌ Error:", error);
    else {
        console.table(messages);
    }
}

checkMessages();
