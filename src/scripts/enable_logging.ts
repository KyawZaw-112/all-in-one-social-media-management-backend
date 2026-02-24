
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function enableLogging() {
    const systemId = "00000000-0000-0000-0000-000000000000";
    console.log(`🛠️ Creating system user ${systemId}...`);

    // We use RPC if possible or direct insert if RLS allows service role
    const { error: pErr } = await supabaseAdmin.from("profiles").upsert({
        id: systemId,
        full_name: "System Debugger",
        email: "system@debug.local",
        role: "admin"
    });

    if (pErr) console.warn("⚠️ Profile upsert failed (might already exist or RLS):", pErr.message);

    const { error: mErr } = await supabaseAdmin.from("merchants").upsert({
        id: systemId,
        business_name: "System Debug",
        page_id: "system-debug-page",
        subscription_status: "active",
        business_type: "online_shop"
    });

    if (mErr) console.warn("⚠️ Merchant upsert failed:", mErr.message);

    console.log("✅ Done.");
}

enableLogging();
