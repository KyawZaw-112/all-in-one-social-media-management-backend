import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";
async function probeConvMsgs() {
    console.log("🕵️ Probing 'conversation_messages' columns...");
    const candidates = ["conversation_id", "body", "role", "sender_id", "content", "message", "created_at"];
    for (const col of candidates) {
        const { error } = await supabaseAdmin.from("conversation_messages").select(col).limit(1);
        if (!error || !error.message.includes("column")) {
            console.log(`✅ Column '${col}' EXISTS.`);
        }
    }
}
probeConvMsgs().catch(console.error);
