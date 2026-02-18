
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function promoteAdmin() {
    const adminId = '40b42079-6636-4b09-b9c9-db9ec0d40b75'; // holeokyawzawwin@gmail.com

    console.log(`Promoting user ${adminId} to admin...`);

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: adminId,
            role: 'admin'
        })
        .select();

    if (error) {
        console.error('Error promoting admin:', error);
    } else {
        console.log('✅ Success! User promoted to admin:', data);
    }
}

promoteAdmin();
