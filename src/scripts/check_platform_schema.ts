import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkSchema() {
    console.log("🔍 Checking 'platform_connections' schema...");

    // We can't directly check table schema via supabase-js easily, 
    // but we can try to trigger an error or use an RPC if available.
    // Instead, let's try to query the information_schema via a trick.

    const { data: cols, error } = await supabaseAdmin
        .rpc('get_table_columns_names', { t_name: 'platform_connections' });

    if (error) {
        console.log("ℹ️ RPC not found, trying query for informative error...");
        const { error: insertError } = await supabaseAdmin
            .from("platform_connections")
            .insert({ user_id: '00000000-0000-0000-0000-000000000000', platform: 'test_probe' })
            .select();

        console.log("Probing insert error (expected):", insertError?.message);
    } else {
        console.log("Columns:", cols);
    }
}

checkSchema();
