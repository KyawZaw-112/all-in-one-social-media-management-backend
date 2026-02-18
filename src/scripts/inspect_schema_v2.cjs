
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFullSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'merchants' });

    // If RPC is not available, use raw query if possible or just try to select from information_schema
    // Since we don't have a direct SQL execution tool, we'll try to select from a view if it exists
    // or just rely on our previous method but more carefully.

    console.log('Inspecting merchants table...');
    const { data: cols, error: err } = await supabase
        .from('merchants')
        .select('*')
        .limit(1);

    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Merchants columns:', Object.keys(cols[0] || {}));
    }

    console.log('Inspecting auto_reply_templates...');
    const { data: cols2, error: err2 } = await supabase
        .from('auto_reply_templates')
        .select('*')
        .limit(1);

    if (err2) {
        console.error('Error:', err2);
    } else {
        console.log('Templates columns:', Object.keys(cols2[0] || {}));
    }
}

// Actually, let's try to just insert a dummy and rollback? No, simpler to just assume for now
// and fix based on the errors we see.

checkFullSchema();
