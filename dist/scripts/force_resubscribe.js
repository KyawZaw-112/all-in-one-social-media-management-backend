import "../env.js";
import { subscribePageToWebhook } from "../services/facebook.services.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
async function forceResubscribe(pageId) {
    console.log(`\n🔄 Force Re-subscribing Page ID: ${pageId}`);
    const { data: connection } = await supabaseAdmin
        .from("platform_connections")
        .select("*")
        .eq("page_id", pageId)
        .maybeSingle();
    if (!connection || !connection.page_access_token) {
        console.error("❌ Connection or Token not found in DB.");
        return;
    }
    try {
        await subscribePageToWebhook(pageId, connection.page_access_token);
        console.log(`✅ SUCCESSFULLY RE-SUBSCRIBED ${connection.page_name}`);
    }
    catch (err) {
        console.error("❌ Subscription Failed:", err.message);
    }
}
async function run() {
    // Kay
    await forceResubscribe("100530332303174");
    // Bluh bluh
    await forceResubscribe("957808180755824");
}
run().catch(console.error);
