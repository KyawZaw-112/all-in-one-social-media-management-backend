import "dotenv/config";
import { supabaseAdmin } from "../supabaseAdmin.js";
async function checkFlows() {
    const merchantId = 'c8ef74b5-8c87-4e08-b0dc-7f8ae48d267c';
    console.log(`🔍 Checking flows for merchant: ${merchantId}`);
    const { data: flows, error } = await supabaseAdmin
        .from("automation_flows")
        .select("*")
        .eq("merchant_id", merchantId);
    if (error) {
        console.error("❌ Error fetching flows:", error);
        return;
    }
    console.log("Flows found:", JSON.stringify(flows, null, 2));
    const { data: merchant } = await supabaseAdmin
        .from("merchants")
        .select("business_type")
        .eq("id", merchantId)
        .single();
    console.log("Merchant Business Type:", merchant?.business_type);
}
checkFlows().catch(console.error);
