
import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTokenPermissions() {
    const pageId = "957808180755824"; // Bluh bluh
    console.log(`\n🔍 Checking Token Permissions for Page ID: ${pageId}...`);

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
        const res = await axios.get(`https://graph.facebook.com/v21.0/me/permissions`, {
            params: { access_token: conn.page_access_token }
        });
        console.log("🔐 Permissions:", JSON.stringify(res.data.data, null, 2));

        // Check if pages_messaging is present and granted
        const messagingPerm = res.data.data.find((p: any) => p.permission === "pages_messaging");
        if (messagingPerm && messagingPerm.status === "granted") {
            console.log("✅ pages_messaging: GRANTED");
        } else {
            console.log("❌ pages_messaging: MISSING or DECLINED");
        }

    } catch (err: any) {
        console.error("❌ API Call Failed:", err.response?.data || err.message);
    }
}

checkTokenPermissions();
