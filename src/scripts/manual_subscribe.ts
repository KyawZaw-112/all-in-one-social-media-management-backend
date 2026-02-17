import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { subscribePageToWebhook } from "../services/facebook.services.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function manualSubscribe() {
    const pageId = "100530332303174";
    console.log(`🔍 Attempting to manually subscribe Page: ${pageId}...`);

    const { data: connection, error } = await supabaseAdmin
        .from("platform_connections")
        .select("page_access_token, page_name")
        .eq("page_id", pageId)
        .maybeSingle();

    if (error || !connection) {
        console.error("❌ Could not find connection in database.", error);
        return;
    }

    console.log(`✅ Found token for Page: ${connection.page_name}`);
    await subscribePageToWebhook(pageId, connection.page_access_token);
    console.log("🚀 Subscription request sent. Check Render logs for 'Subscribe response'");
}

manualSubscribe().catch(console.error);
