import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function sendTestMessage() {
    const pageId = "957808180755824"; // Bluh bluh
    const recipientId = "33882880741360034"; // Kyaw Zaw Win PSID
    console.log(`\n🚀 Sending Test Message from ${pageId} to ${recipientId}...`);
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
        const res = await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${conn.page_access_token}`, {
            recipient: { id: recipientId },
            message: { text: "Hello! This is a test message from Junior Alex Bot. 🤖" }
        });
        console.log("✅ Message Sent Successfully:", JSON.stringify(res.data, null, 2));
    }
    catch (err) {
        console.error("❌ Send Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
    }
}
sendTestMessage();
