const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching admin_users:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in admin_users:', Object.keys(data[0]));
    } else {
        console.log('admin_users table is empty.');
        // Try to insert a dummy row to see if it fails (and why)
    }
}

checkColumns();
