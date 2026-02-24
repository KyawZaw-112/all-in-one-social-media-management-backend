
import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkHandover() {
    const pageId = "957808180755824"; // Bluh bluh
    console.log(`\n🔍 Checking Handover Protocol for Page ID: ${pageId}...`);

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
        // Check Secondary Receivers
        const secRes = await axios.get(`https://graph.facebook.com/v21.0/${pageId}/secondary_receivers`, {
            params: { access_token: conn.page_access_token }
        });
        console.log("📱 Secondary Receivers:", JSON.stringify(secRes.data.data, null, 2));

        // Check threads for a test PSID (if we have one) - let's just check the page's messenger platform settings
        // Actually, checking "owner" of a thread is more direct but needs a PSID.

    } catch (err: any) {
        console.error("❌ API Call Failed:", err.response?.data || err.message);
    }
}

checkHandover();
