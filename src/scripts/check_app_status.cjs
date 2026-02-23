const axios = require('axios');
require('dotenv').config();

async function run() {
    console.log("🔍 Checking App Status...");

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const appToken = `${appId}|${appSecret}`;

    try {
        const appRes = await axios.get(`https://graph.facebook.com/v19.0/${appId}?fields=id,name,roles,category,link&access_token=${appToken}`);
        console.log("✅ App Info:", JSON.stringify(appRes.data, null, 2));

        // Roles might be sensitive, checking if we can see them
        const rolesRes = await axios.get(`https://graph.facebook.com/v19.0/${appId}/roles?access_token=${appToken}`);
        console.log("✅ App Roles:", JSON.stringify(rolesRes.data, null, 2));

    } catch (err) {
        console.log("❌ Error fetching roles/status:", err.response?.data || err.message);
    }
}

run().catch(console.error);
