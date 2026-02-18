
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPendingMerchants() {
    const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .like('page_id', 'pending_%');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} pending merchants:`);
        console.table(data.map(m => ({
            id: m.id,
            page_id: m.page_id,
            status: m.subscription_status
        })));
    }
}

checkPendingMerchants();
