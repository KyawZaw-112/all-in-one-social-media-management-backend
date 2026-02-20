import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";
async function findFK() {
    const candidates = ["conversation_id", "convo_id", "conv_id", "chat_id", "parent_id", "session_id"];
    console.log("🕵️ Searching for Conversation Foreign Key...");
    for (const col of candidates) {
        const { error } = await supabaseAdmin.from("messages").select(col).limit(1);
        if (error && error.message.includes("Could not find the") && error.message.includes("column")) {
            // console.log(`❌ ${col} no`);
        }
        else if (error) {
            console.log(`⚠️ Column '${col}' Error: ${error.message}`);
        }
        else {
            console.log(`✅ Column '${col}' EXISTS.`);
        }
    }
}
findFK().catch(console.error);
