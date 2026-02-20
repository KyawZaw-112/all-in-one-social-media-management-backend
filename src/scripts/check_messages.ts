import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function checkMessages() {
    try {
        const { supabaseAdmin } = await import("../supabaseAdmin.js");

        console.log("Fetching latest messages...");
        const { data: msgs, error } = await supabaseAdmin
            .from('messages')
            .select('id, created_at, sender_name, body, channel, status, conversation_id')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error("Error:", error.message);
        } else {
            console.log("Recent Messages:", JSON.stringify(msgs, null, 2));
        }

    } catch (e) {
        console.error("Execution error:", e);
    }
}

checkMessages();
