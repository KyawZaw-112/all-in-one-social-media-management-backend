const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const pageId = "957808180755824";
    console.log(`📡 Diagnosing Page: ${pageId} (Bluh bluh)...`);

    // 1. Get token from DB
    const { data: conn, error } = await supabase
        .from('platform_connections')
        .select('page_access_token')
        .eq('page_id', pageId)
        .single();

    if (error || !conn) {
        console.error("❌ Token not found in DB:", error);
        return;
    }

    const token = conn.page_access_token;

    try {
        // 2. Check Token Debug info
        console.log("🔍 Debugging token...");
        const appToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
        const debugResponse = await axios.get(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appToken}`);
        const debugData = debugResponse.data.data;

        console.log("📊 Token Info:", {
            is_valid: debugData.is_valid,
            scopes: debugData.scopes.join(", "),
            expires_at: debugData.expires_at ? new Date(debugData.expires_at * 1000).toLocaleString() : "Never"
        });

        // 3. Check Webhook Subscriptions
        console.log("\n🛠️ Checking subscribed apps...");
        const subsResponse = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${token}`);
        console.log("💾 Subscribed Apps:", JSON.stringify(subsResponse.data.data, null, 2));

        const ourAppId = process.env.FACEBOOK_APP_ID;
        const sub = subsResponse.data.data.find(a => a.id === ourAppId);

        if (sub) {
            console.log("✅ APP IS SUBSCRIBED.");
            console.log("🎯 Fields:", sub.subscribed_fields?.join(", ") || "NONE");
        } else {
            console.log("❌ APP IS NOT SUBSCRIBED TO THIS PAGE.");

            // 4. Try to subscribe
            console.log("\n🚀 Attempting to subscribe our app to this page...");
            const subscribeUrl = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`;
            const subscribeResponse = await axios.post(subscribeUrl, {
                subscribed_fields: "messages,messaging_postbacks,messaging_optins"
            }, {
                params: { access_token: token }
            });
            console.log("Response:", subscribeResponse.data);
            if (subscribeResponse.data.success) {
                console.log("✅ Successfully subscribed!");
            }
        }

    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
    }
}

run().catch(console.error);
