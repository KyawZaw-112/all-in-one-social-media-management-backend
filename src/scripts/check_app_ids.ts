
import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAppIds() {
    const pages = [
        { name: "Bluh bluh (Not Working)", id: "957808180755824" },
        { name: "Kay (Working)", id: "100530332303174" }
    ];

    for (const page of pages) {
        console.log(`\n🔍 Checking App ID for ${page.name} (${page.id})...`);
        const { data: conn } = await supabaseAdmin
            .from("platform_connections")
            .select("*")
            .eq("page_id", page.id)
            .maybeSingle();

        if (!conn) {
            console.log("❌ Connection not found in DB");
            continue;
        }

        try {
            const res = await axios.get(`https://graph.facebook.com/debug_token`, {
                params: {
                    input_token: conn.page_access_token,
                    access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
                }
            });
            console.log(`✅ App ID: ${res.data.data.app_id} (${res.data.data.application})`);

        } catch (err: any) {
            console.error("❌ Debug Token Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
        }
    }
}

checkAppIds();
