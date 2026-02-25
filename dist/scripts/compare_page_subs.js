import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function comparePages() {
    const pages = [
        { name: "Bluh bluh (Not Working)", id: "957808180755824" },
        { name: "Kay (Working)", id: "100530332303174" }
    ];
    for (const page of pages) {
        console.log(`\n🔍 Checking ${page.name} (${page.id})...`);
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
            const subRes = await axios.get(`https://graph.facebook.com/v21.0/${page.id}/subscribed_apps`, {
                params: { access_token: conn.page_access_token }
            });
            console.log("📊 Subscribed Apps:", JSON.stringify(subRes.data.data, null, 2));
            // Check if messages is in subscribed_fields
            const app = subRes.data.data.find((a) => a.id === process.env.FACEBOOK_APP_ID);
            if (app) {
                console.log(`✅ App ${app.id} is subscribed. Fields: ${app.subscribed_fields.join(", ")}`);
            }
            else {
                console.log(`❌ App ${process.env.FACEBOOK_APP_ID} is NOT found in subscribed_apps`);
            }
        }
        catch (err) {
            console.error("❌ API Call Failed:", err.response?.data || err.message);
        }
    }
}
comparePages();
