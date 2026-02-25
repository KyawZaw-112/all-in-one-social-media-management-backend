import "../env.js";
import { subscribePageToWebhook } from "../services/facebook.services.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
async function manualSubscribe(pageId) {
    console.log(`🔍 Attempting to manually subscribe Page: ${pageId}...`);
    const { data: connection, error } = await supabaseAdmin
        .from("platform_connections")
        .select("page_access_token, page_name")
        .eq("page_id", pageId)
        .maybeSingle();
    if (error || !connection) {
        console.error(`❌ Could not find connection for ${pageId} in database.`, error);
        return;
    }
    console.log(`✅ Found token for Page: ${connection.page_name}`);
    try {
        await subscribePageToWebhook(pageId, connection.page_access_token);
        console.log(`🚀 Subscription request for ${connection.page_name} sent SUCCESSFULLY.`);
    }
    catch (err) {
        console.error(`❌ Subscription for ${connection.page_name} FAILED:`, err);
    }
}
async function run() {
    await manualSubscribe("100530332303174"); // Kay
    await manualSubscribe("957808180755824"); // Bluh bluh
}
run().catch(console.error);
