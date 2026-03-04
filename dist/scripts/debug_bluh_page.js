import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function deepDebug() {
    const pages = [
        { name: "Bluh bluh (NOT working)", id: "957808180755824" },
        { name: "Kay (Working)", id: "100530332303174" }
    ];
    for (const page of pages) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`🔍 ${page.name} | Page ID: ${page.id}`);
        console.log("=".repeat(60));
        const { data: conn } = await supabaseAdmin
            .from("platform_connections")
            .select("*")
            .eq("page_id", page.id)
            .maybeSingle();
        if (!conn) {
            console.log("❌ No connection!");
            continue;
        }
        const token = conn.page_access_token;
        // 1. Page info
        try {
            const info = await axios.get(`https://graph.facebook.com/v21.0/${page.id}`, {
                params: { access_token: token, fields: "name,id,category,is_published,verification_status,new_like_count" }
            });
            console.log(`📄 Page Info:`, JSON.stringify(info.data, null, 2));
        }
        catch (e) {
            console.log("❌ Page info error:", e.response?.data?.error?.message);
        }
        // 2. Check connected app permissions
        try {
            const subs = await axios.get(`https://graph.facebook.com/v21.0/${page.id}/subscribed_apps`, {
                params: { access_token: token }
            });
            console.log(`📊 Subscribed apps:`, JSON.stringify(subs.data.data, null, 2));
        }
        catch (e) {
            console.log("❌ Subs error:", e.response?.data?.error?.message);
        }
        // 3. Check page conversations (to see if FB is receiving messages)
        try {
            const convos = await axios.get(`https://graph.facebook.com/v21.0/${page.id}/conversations`, {
                params: { access_token: token, limit: 3 }
            });
            console.log(`💬 FB Conversations:`, convos.data.data?.length, "found");
            convos.data.data?.forEach((c) => {
                console.log(`   - ${c.id} | updated: ${c.updated_time}`);
            });
        }
        catch (e) {
            console.log("❌ Conversations error:", e.response?.data?.error?.message);
        }
        // 4. Token debug
        try {
            const dbg = await axios.get(`https://graph.facebook.com/debug_token`, {
                params: {
                    input_token: token,
                    access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
                }
            });
            const d = dbg.data.data;
            console.log(`🔑 Token Debug:`);
            console.log(`   Type: ${d.type}`);
            console.log(`   App ID: ${d.app_id}`);
            console.log(`   Valid: ${d.is_valid}`);
            console.log(`   Expires: ${d.expires_at === 0 ? 'NEVER' : new Date(d.expires_at * 1000).toISOString()}`);
            console.log(`   Scopes: ${d.scopes?.join(', ')}`);
        }
        catch (e) {
            console.log("❌ Token debug error:", e.response?.data?.error?.message);
        }
    }
}
deepDebug();
