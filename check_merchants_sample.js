
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTableDefinition() {
    console.log("🔍 Checking 'merchants' table constraints...");

    // Check foreign keys and constraints using information_schema via RPC
    const sql = `
        SELECT 
            tc.table_name, kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'merchants';
    `;

    // We can't run raw SQL directly via the client easily unless there's an RPC for it.
    // Let's check if there's a generic query RPC.

    console.log("Querying RPC definitions...");
    const { data: functions, error: funcErr } = await supabase.rpc('get_table_columns', { table_name: 'merchants' });
    // I already tried this and it failed (returned null/error).

    // Instead, let's try to just SELECT from merchants again and check for any anomalies.
    const { data: merchants, error } = await supabase.from("merchants").select("*").limit(1);
    console.log("Sample merchant:", merchants?.[0]);
}

checkTableDefinition();
