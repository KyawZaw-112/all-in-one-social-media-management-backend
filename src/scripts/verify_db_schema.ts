import "dotenv/config";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function verifySchema() {
    console.log("🔍 Verifying Database Schema...");

    const checks = [
        { table: 'automation_flows', columns: ['business_type', 'steps'] },
        { table: 'merchants', columns: ['business_type', 'subscription_plan'] },
        { table: 'orders', columns: ['item_photos', 'order_no', 'item_id', 'payment', 'delivery', 'page_id'] },
        { table: 'shipments', columns: ['item_photos', 'country', 'shipping', 'order_no', 'page_id'] }
    ];

    for (const check of checks) {
        console.log(`\nTable: ${check.table}`);
        for (const column of check.columns) {
            const { error } = await supabaseAdmin
                .from(check.table)
                .select(column)
                .limit(1);

            if (error) {
                console.error(`❌ Column ${column} is MISSING in ${check.table}:`, error.message);
            } else {
                console.log(`✅ Column ${column} exists in ${check.table}.`);
            }
        }
    }
}

verifySchema().catch(console.error);
