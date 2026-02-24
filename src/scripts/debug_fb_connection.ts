
import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugConnection() {
    const pageId = "957808180755824"; // Junior Alex's Page ID
    console.log(`🔍 Debugging Connection for Page ID: ${pageId}`);

    const { data: conn, error } = await supabaseAdmin
        .from("platform_connections")
        .select("*")
        .eq("page_id", pageId)
        .maybeSingle();

    if (error || !conn) {
        console.error("❌ Connection not found in DB");
        return;
    }

    const token = conn.page_access_token;
    console.log("✅ Token found in DB");

    try {
        // 1. Check Subscribed Apps
        console.log("📡 Checking /me/subscribed_apps...");
        const subRes = await axios.get(`https://graph.facebook.com/v21.0/me/subscribed_apps`, {
            params: { access_token: token }
        });
        console.log("📊 Subscribed Apps:", JSON.stringify(subRes.data, null, 2));

        // 2. Check Token Debug Info
        console.log("\n📡 Checking token info...");
        const debugRes = await axios.get(`https://graph.facebook.com/v21.0/debug_token`, {
            params: {
                input_token: token,
                access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
            }
        });
        console.log("🧐 Token Info:", JSON.stringify(debugRes.data.data, null, 2));

        // 3. Try to re-subscribe just in case
        console.log("\n🔄 Attempting to re-subscribe...");
        const reSubRes = await axios.post(`https://graph.facebook.com/v21.0/me/subscribed_apps`, {
            access_token: token,
            subscribed_fields: ["messages", "messaging_postbacks", "messaging_optins", "message_deliveries", "message_reads"]
        });
        console.log("✅ Re-subscription Result:", JSON.stringify(reSubRes.data, null, 2));

    } catch (err: any) {
        console.error("❌ API Call Failed:", err.response?.data || err.message);
    }
}

debugConnection();
