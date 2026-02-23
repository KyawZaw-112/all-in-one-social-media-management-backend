
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    console.log("🔍 Fetching table list via PostgREST schema inference...");

    // We can't query information_schema directly via PostgREST usually.
    // But we can try to guess or use a known list and verify.
    // Tables I know about:
    const tables = [
        'merchants', 'profiles', 'orders', 'shipments',
        'automation_flows', 'conversations', 'messages',
        'platform_connections', 'products', 'rates',
        'warehouse', 'stock_logs', 'rate_calculator_logs',
        'facebook_pages', 'instagram_accounts'
    ];

    console.log("Checking tables existence...");
    for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (!error) {
            console.log(`✅ Table exists: ${table}`);
        } else if (error.code !== '42P01') {
            console.log(`⚠️ Table ${table} returned error: ${error.message} (Code: ${error.code})`);
        }
    }
}

listTables();
