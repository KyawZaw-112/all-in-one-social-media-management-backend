import 'dotenv/config';
import { supabaseAdmin } from './src/supabaseAdmin.js';

async function diagnose() {
    const userId = '40b42079-6636-4b09-b9c9-db9ec0d40b75'; // Current user ID from logs
    console.log(`🧪 Diagnosing merchant creation for user: ${userId}`);

    // Try to simulate the exact upsert from the middleware
    const { data, error } = await supabaseAdmin
        .from('merchants')
        .upsert({
            id: userId,
            page_id: `pending_${userId.substring(0, 8)}_test`,
            business_name: "Diagnostic Test Business",
            business_type: "online_shop",
            subscription_plan: "shop",
            subscription_status: "active",
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: "id" })
        .select();

    if (error) {
        console.error("❌ UPSERT FAILED!");
        console.error("Error Code:", error.code);
        console.error("Message:", error.message);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
    } else {
        console.log("✅ UPSERT SUCCEEDED in script!");
        console.log("Result:", data);
    }

    // Check ALL columns for the table to ensure no other NOT NULLs
    console.log("\n📋 Table Column Info:");
    const { data: cols } = await supabaseAdmin.from('merchants').select().limit(1);
    if (cols && cols.length > 0) {
        console.log("Columns present in table:", Object.keys(cols[0]));
    }
}

diagnose().catch(console.error);
