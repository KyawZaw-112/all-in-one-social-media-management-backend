
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("🔍 Checking 'merchants' table schema via pseudo-query...");
    // We can't directly check schema easily via JS client, but we can try to insert a duplicate page_id to see if it errors
    // Or check if there's an existing RPC to get table info.
    // For now, let's just list the columns and keys if possible.

    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'merchants' });
    // This RPC might not exist, but let's try.

    if (error) {
        // Fallback: use a regular query and check keys
        const { data: rows } = await supabase.from("merchants").select("*").limit(1);
        if (rows && rows.length > 0) {
            console.log("✅ Columns:", Object.keys(rows[0]));
        } else {
            console.log("⚠️ Table is empty, cannot easily get columns.");
        }
    } else {
        console.log("✅ Columns:", data);
    }
}

checkSchema();
