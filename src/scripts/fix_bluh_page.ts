import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BLUH_PAGE_ID = "957808180755824";

async function resubscribePage() {
    // 1. Get the page access token
    const { data: conn } = await supabaseAdmin
        .from("platform_connections")
        .select("*")
        .eq("page_id", BLUH_PAGE_ID)
        .maybeSingle();

    if (!conn) {
        console.log("❌ No connection found for Bluh bluh page");
        return;
    }

    const token = conn.page_access_token;
    console.log(`✅ Found connection for: ${conn.page_name}`);

    // 2. First, unsubscribe
    console.log("\n🔄 Step 1: Unsubscribing...");
    try {
        const unsub = await axios.delete(
            `https://graph.facebook.com/v21.0/${BLUH_PAGE_ID}/subscribed_apps`,
            { params: { access_token: token } }
        );
        console.log("✅ Unsubscribed:", unsub.data);
    } catch (err: any) {
        console.log("⚠️ Unsub error (ok to ignore):", err.response?.data?.error?.message || err.message);
    }

    // 3. Re-subscribe with messages field
    console.log("\n🔄 Step 2: Re-subscribing with messages + messaging_postbacks...");
    try {
        const sub = await axios.post(
            `https://graph.facebook.com/v21.0/${BLUH_PAGE_ID}/subscribed_apps`,
            null,
            {
                params: {
                    access_token: token,
                    subscribed_fields: "messages,messaging_postbacks"
                }
            }
        );
        console.log("✅ Re-subscribed:", sub.data);
    } catch (err: any) {
        console.error("❌ Subscribe failed:", err.response?.data || err.message);
    }

    // 4. Verify
    console.log("\n🔍 Step 3: Verifying subscription...");
    try {
        const verify = await axios.get(
            `https://graph.facebook.com/v21.0/${BLUH_PAGE_ID}/subscribed_apps`,
            { params: { access_token: token } }
        );
        console.log("📊 Current subscriptions:", JSON.stringify(verify.data.data, null, 2));
    } catch (err: any) {
        console.error("❌ Verify failed:", err.response?.data || err.message);
    }

    // 5. Also clean up stale test conversations
    console.log("\n🧹 Step 4: Cleaning stale test conversations...");
    const { data: staleConvos } = await supabaseAdmin
        .from("conversations")
        .select("id, user_psid")
        .eq("merchant_id", conn.user_id || conn.merchant_id)
        .eq("status", "active")
        .in("user_psid", ["NEW_TEST_ID", "MANUAL_TEST"]);

    if (staleConvos && staleConvos.length > 0) {
        const ids = staleConvos.map(c => c.id);
        await supabaseAdmin.from("conversations").delete().in("id", ids);
        console.log(`✅ Cleaned ${ids.length} stale test conversations`);
    } else {
        console.log("✅ No stale test conversations to clean");
    }

    console.log("\n🎉 Done! Try sending a message to Bluh bluh page now.");
}

resubscribePage();
