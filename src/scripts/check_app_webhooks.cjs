const axios = require('axios');
require('dotenv').config();

async function run() {
    console.log("🔍 Checking App Webhook Configuration...");

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const appToken = `${appId}|${appSecret}`;

    try {
        // 1. Get App Info (basic)
        const appRes = await axios.get(`https://graph.facebook.com/v19.0/${appId}?fields=id,name&access_token=${appToken}`);
        console.log("✅ App Info:", JSON.stringify(appRes.data, null, 2));

        // 2. Get Subscriptions
        const subsRes = await axios.get(`https://graph.facebook.com/v19.0/${appId}/subscriptions?access_token=${appToken}`);
        console.log("✅ Webhook Subscriptions:", JSON.stringify(subsRes.data, null, 2));

    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
    }
}

run().catch(console.error);
