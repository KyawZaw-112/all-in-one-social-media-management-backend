import "../env.js";
import axios from "axios";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function diagnoseToken(pageId: string) {
    console.log(`\n🔍 Deep Diagnosis for Page ID: ${pageId}`);

    const { data: connection } = await supabaseAdmin
        .from("platform_connections")
        .select("*")
        .eq("page_id", pageId)
        .maybeSingle();

    if (!connection) {
        console.error("❌ Connection not found in DB.");
        return;
    }

    const token = connection.page_access_token;
    console.log(`✅ Found token in DB (starts with ${token.substring(0, 10)}...)`);

    try {
        // 1. Check Page Info
        console.log("📡 Checking page identity...");
        const meResponse = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`);
        console.log("👤 Page Identity:", meResponse.data.name, `(ID: ${meResponse.data.id})`);

        // 2. Check Token Debug info (Scopes)
        console.log("🔍 Debugging token scopes...");
        const appToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
        const debugResponse = await axios.get(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appToken}`);
        const debugData = debugResponse.data.data;

        console.log("📊 Token Scopes:", debugData.scopes.join(", "));
        console.log("🕒 Expires at:", debugData.expires_at ? new Date(debugData.expires_at * 1000).toLocaleString() : "Never");
        console.log("✅ Is Valid:", debugData.is_valid);

        // 3. Check Subscribed Apps
        console.log("\n🛠️ Checking subscribed apps for this page...");
        const subsResponse = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${token}`);
        console.log("💾 Subscribed Apps List:", JSON.stringify(subsResponse.data.data, null, 2));

        const ourApp = subsResponse.data.data.find((app: any) => app.id === process.env.FACEBOOK_APP_ID);
        if (ourApp) {
            console.log("✅ OUR APP IS ACTIVE ON THIS PAGE.");
            console.log("🎯 Subscribed Fields:", ourApp.subscribed_fields?.join(", ") || "NONE");
        } else {
            console.log("❌ OUR APP IS NOT SUBSCRIBED TO THIS PAGE.");
        }

    } catch (err: any) {
        console.error("❌ API Error:", err.response?.data || err.message);
    }
}

async function run() {
    await diagnoseToken("957808180755824"); // Bluh bluh
}

run().catch(console.error);
