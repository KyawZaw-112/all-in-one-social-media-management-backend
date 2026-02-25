import "dotenv/config";
import { supabaseAdmin } from "../supabaseAdmin.js";
async function verifySchema() {
    console.log("🔍 Verifying Database Schema...");
    const checks = [
        { table: 'automation_flows', columns: ['business_type', 'steps'] },
        { table: 'orders', columns: ['item_photos'] },
        { table: 'shipments', columns: ['item_photos', 'country', 'shipping'] }
    ];
    for (const check of checks) {
        console.log(`\nTable: ${check.table}`);
        const { data, error } = await supabaseAdmin
            .from(check.table)
            .select(check.columns.join(','))
            .limit(1);
        if (error) {
            console.error(`❌ Error checking ${check.table}:`, error.message);
            if (error.message.includes('column') || error.message.includes('relation')) {
                console.log(`💡 Missing schema elements detected for ${check.table}.`);
            }
        }
        else {
            console.log(`✅ Table ${check.table} has required columns.`);
        }
    }
}
verifySchema().catch(console.error);
