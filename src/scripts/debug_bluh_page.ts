import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BLUH_PAGE_ID = "957808180755824";
const KAY_PAGE_ID = "100530332303174";

async function debugPage(pageName: string, pageId: string) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🔍 Debugging: ${pageName} (${pageId})`);
    console.log("=".repeat(50));

    // 1. Check platform_connections
    const { data: conn, error: connErr } = await supabaseAdmin
        .from("platform_connections")
        .select("*")
        .eq("page_id", pageId)
        .maybeSingle();

    if (!conn) {
        console.log("❌ No platform_connection found!");
        return;
    }
    console.log(`✅ Connection found | merchant_id: ${conn.user_id || conn.merchant_id} | page_name: ${conn.page_name}`);

    const merchantId = conn.user_id || conn.merchant_id;

    // 2. Check merchant profile
    const { data: merchant, error: merchantErr } = await supabaseAdmin
        .from("merchants")
        .select("id, email, subscription_status, trial_ends_at, business_type")
        .eq("id", merchantId)
        .maybeSingle();

    if (!merchant) {
        console.log("❌ Merchant NOT found in merchants table!");
    } else {
        console.log(`✅ Merchant: ${merchant.email} | type: ${merchant.business_type} | sub: ${merchant.subscription_status} | trial: ${merchant.trial_ends_at}`);
    }

    // 3. Check automation flows
    const { data: flows, error: flowErr } = await supabaseAdmin
        .from("automation_flows")
        .select("id, business_type, trigger_keyword, is_active")
        .eq("merchant_id", merchantId);

    if (!flows || flows.length === 0) {
        console.log("❌ NO automation_flows found for this merchant!");
    } else {
        console.log(`📋 Automation Flows (${flows.length}):`);
        flows.forEach(f => {
            console.log(`   ${f.is_active ? "✅" : "❌"} [${f.business_type}] trigger: "${f.trigger_keyword}" | active: ${f.is_active}`);
        });
    }

    // 4. Check active conversations
    const { data: convos } = await supabaseAdmin
        .from("conversations")
        .select("id, status, created_at, user_psid")
        .eq("merchant_id", merchantId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);

    console.log(`💬 Active conversations: ${convos?.length || 0}`);
    convos?.forEach(c => {
        console.log(`   - ${c.id} | psid: ${c.user_psid} | ${c.created_at}`);
    });

    // 5. Check page access token validity
    try {
        const resp = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=name,access_token&access_token=${conn.page_access_token}`);
        const data = await resp.json();
        if (data.error) {
            console.log(`❌ Token INVALID: ${data.error.message}`);
        } else {
            console.log(`✅ Token VALID | Page name from API: ${data.name}`);
        }
    } catch (e: any) {
        console.log(`❌ Token check failed: ${e.message}`);
    }
}

async function main() {
    await debugPage("Bluh bluh", BLUH_PAGE_ID);
    await debugPage("Kay (Working)", KAY_PAGE_ID);
}

main();
