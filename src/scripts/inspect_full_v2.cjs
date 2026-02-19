
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectColumns() {
    console.log("🧐 Getting ALL columns for 'orders'...");

    // We try to insert a row with an invalid column to see the full list in the error hint
    const { error } = await supabase.from('orders').insert({ __schema_helper_fake_column__: 1 });

    if (error && error.message.includes('column')) {
        console.log("Error Message:", error.message);
        // Sometimes the error hint contains the list of columns
        if (error.hint) console.log("Hint:", error.hint);
        if (error.details) console.log("Details:", error.details);
    }

    // Alternative: Try to fetch a dummy row and show keys
    const { data } = await supabase.from('orders').select('*').limit(1);
    if (data && data.length > 0) {
        console.log("✅ All columns in first row:", Object.keys(data[0]));
    } else {
        console.log("⚠️ Table is empty, cannot use select keys.");
    }
}

inspectColumns();
