import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function checkConversations() {
    try {
        const { supabaseAdmin } = await import("../supabaseAdmin.js");
        console.log("Fetching active conversations...");
        const { data: convs, error } = await supabaseAdmin
            .from('conversations')
            .select('id, created_at, status, flow_id, temp_data')
            .order('created_at', { ascending: false })
            .limit(5);
        if (error) {
            console.error("Error:", error.message);
        }
        else {
            console.log("Recent Conversations:", JSON.stringify(convs, null, 2));
        }
    }
    catch (e) {
        console.error("Execution error:", e);
    }
}
checkConversations();
