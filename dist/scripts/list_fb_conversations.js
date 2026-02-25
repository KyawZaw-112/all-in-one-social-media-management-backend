import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function listConversations() {
    const pageId = "957808180755824"; // Bluh bluh
    console.log(`\n🔍 Listing Conversations for Page ID: ${pageId}...`);
    const { data: conn } = await supabaseAdmin
        .from("platform_connections")
        .select("*")
        .eq("page_id", pageId)
        .maybeSingle();
    if (!conn) {
        console.log("❌ Connection not found in DB");
        return;
    }
    try {
        const res = await axios.get(`https://graph.facebook.com/v21.0/${pageId}/conversations`, {
            params: {
                access_token: conn.page_access_token,
                fields: "id,participants,updated_time"
            }
        });
        console.log("💬 Conversations:", JSON.stringify(res.data.data, null, 2));
    }
    catch (err) {
        console.error("❌ API Call Failed:", err.response?.data || err.message);
    }
}
listConversations();
