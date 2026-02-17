import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function findAllID() {
    const candidates = [
        "conversation_id", "convo_id", "conv_id", "chat_id", "parent_id", "session_id",
        "merchant_id", "user_id", "psid", "sender_psid", "recipient_psid",
        "order_id", "flow_id", "page_id"
    ];
    console.log("🕵️ Searching for ALL ID columns in 'messages'...");

    for (const col of candidates) {
        const { error } = await supabaseAdmin.from("messages").select(col).limit(1);
        if (!error || !error.message.includes("column")) {
            console.log(`✅ Column '${col}' EXISTS!`);
        }
    }
}

findAllID().catch(console.error);
