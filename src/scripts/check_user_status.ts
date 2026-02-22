import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkStatus() {
    console.log("🔍 Checking platform_connections...");
    const { data: connections, error: connError } = await supabaseAdmin
        .from("platform_connections")
        .select("user_id, page_id, page_name, created_at");

    if (connError) console.error("❌ Conn Error:", connError);
    else {
        console.table(connections);
    }

    console.log("\n🔍 Checking merchants...");
    const { data: merchants, error: merchError } = await supabaseAdmin
        .from("merchants")
        .select("id, page_id, business_name, subscription_status");

    if (merchError) console.error("❌ Merch Error:", merchError);
    else {
        console.table(merchants);
    }
}

checkStatus();
