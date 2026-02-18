
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectDataTables() {
    const tables = ['orders', 'shipments'];

    for (const table of tables) {
        // Try to get one row to see columns
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.error(`Error fetching from ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Columns in ${table}:`, Object.keys(data[0]));
        } else {
            console.log(`${table} is empty, attempting to get columns from RPC or info schema...`);
            // Fallback: try to select nothing but get metadata if possible
            // Since we can't easily do that with supabase-js without results, 
            // we'll just try to insert a dummy and rollback if we really had to, 
            // but let's try a common trick: select a non-existent column to see error? No.
            // Let's just try to find where it was created in the codebase again.
        }
    }
}

inspectDataTables();
