import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function atomicProbe() {
    const candidates = ["body", "message_text", "role", "sender_id", "created_at", "type", "conversation_id"];
    console.log("🕵️ Atomic Probe of 'messages' columns...");

    for (const col of candidates) {
        // We try to select this column. If it fails, it doesn't exist.
        const { error } = await supabaseAdmin.from("messages").select(col).limit(1);
        if (error && error.message.includes("Could not find the") && error.message.includes("column")) {
            console.log(`❌ Column '${col}' DOES NOT exist.`);
        } else if (error) {
            console.log(`⚠️ Column '${col}' MIGHT exist (Error: ${error.message})`);
        } else {
            console.log(`✅ Column '${col}' EXISTS.`);
        }
    }
}

atomicProbe().catch(console.error);
