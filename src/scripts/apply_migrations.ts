import "dotenv/config";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function applyMigrations() {
    console.log("🚀 Attempting to apply schema updates...");

    // Since we cannot run raw SQL directly without an RPC, 
    // we will check if the columns exist and if not, we can't do much 
    // unless we have a specific RPC.

    // However, we can try to create a shipment to see if the table exists
    const { error: shipError } = await supabaseAdmin.from('shipments').select('id').limit(1);
    if (shipError && shipError.message.includes('relation "shipments" does not exist')) {
        console.error("❌ Table 'shipments' is missing. Please run src/scripts/add_business_type.sql in Supabase Dashboard.");
    } else {
        console.log("✅ Table 'shipments' exists.");
    }

    const { error: stepError } = await supabaseAdmin.from('automation_flows').select('steps').limit(1);
    if (stepError && stepError.message.includes('column "steps" does not exist')) {
        console.error("❌ Column 'steps' is missing in 'automation_flows'. Please run src/scripts/add_steps_to_flows.sql in Supabase Dashboard.");
    } else {
        console.log("✅ Column 'steps' exists in 'automation_flows'.");
    }

    const { error: bTypeError } = await supabaseAdmin.from('automation_flows').select('business_type').limit(1);
    if (bTypeError && bTypeError.message.includes('column "business_type" does not exist')) {
        console.error("❌ Column 'business_type' is missing in 'automation_flows'. Please run src/scripts/add_business_type.sql in Supabase Dashboard.");
    } else {
        console.log("✅ Column 'business_type' exists in 'automation_flows'.");
    }
}

applyMigrations().catch(console.error);
