import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkFlows() {
    const merchantId = "40b42079-6636-4b09-b9c9-db9ec0d40b75";
    console.log(`🔍 Checking automation flows for merchant: ${merchantId}...`);

    const { data, error } = await supabaseAdmin
        .from("automation_flows")
        .select("*")
        .eq("merchant_id", merchantId);

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("ℹ️ No flows found.");
    } else {
        console.log(`✅ Found ${data.length} flows:`);
        data.forEach(f => {
            console.log(`- Flow: ${f.name} | Keyword: '${f.trigger_keyword}' | Active: ${f.is_active} | Business: ${f.business_type}`);
        });
    }
}

checkFlows().catch(console.error);
