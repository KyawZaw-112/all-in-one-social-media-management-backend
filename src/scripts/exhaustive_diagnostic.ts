
import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function exhaustiveDiagnostic() {
    const pageId = "957808180755824"; // Bluh bluh
    console.log(`\n🏥 Exhaustive Diagnostic for Page ID: ${pageId}...`);

    const { data: conn } = await supabaseAdmin
        .from("platform_connections")
        .select("*")
        .eq("page_id", pageId)
        .maybeSingle();

    if (!conn) {
        console.log("❌ Connection not found in DB");
        return;
    }

    const token = conn.page_access_token;

    try {
        // 1. Check Page Status
        console.log("📄 1. Checking Page Status...");
        const pageRes = await axios.get(`https://graph.facebook.com/v21.0/${pageId}`, {
            params: {
                access_token: token,
                fields: "is_published,category,name"
            }
        });
        console.log("📊 Page Data:", JSON.stringify(pageRes.data, null, 2));

        // 2. Check Messenger Profile
        console.log("\n💬 2. Checking Messenger Profile...");
        try {
            const messRes = await axios.get(`https://graph.facebook.com/v21.0/me/messenger_profile`, {
                params: {
                    access_token: token,
                    fields: "get_started,greeting,persistent_menu"
                }
            });
            console.log("👤 Messenger Profile:", JSON.stringify(messRes.data, null, 2));
        } catch (e) { console.log("⚠️ Messenger Profile check failed (might be empty)"); }

        // 3. Check Subscribed Apps
        console.log("\n📡 3. Checking Subscribed Apps...");
        const subRes = await axios.get(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`, {
            params: { access_token: token }
        });
        console.log("🔗 Links:", JSON.stringify(subRes.data.data, null, 2));

    } catch (err: any) {
        console.error("❌ Diagnostic Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
    }
}

exhaustiveDiagnostic();
