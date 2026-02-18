
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalize() {
    const emails = [];
    for (let i = 1; i <= 10; i++) {
        emails.push(`testuser${i}@autoreply.biz`);
    }

    console.log('🔄 Resetting trial expiration for test users...');

    // 1. Get IDs for these emails
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error(authError);
        return;
    }

    const targetIds = users.filter(u => emails.includes(u.email)).map(u => u.id);

    if (targetIds.length === 0) {
        console.log('⚠️ No target users found.');
        return;
    }

    // 2. Update Merchants table
    const { error: merchError } = await supabase
        .from('merchants')
        .update({ trial_ends_at: null })
        .in('id', targetIds);

    if (merchError) {
        console.error('❌ Update failed:', merchError);
    } else {
        console.log(`✅ Successfully reset ${targetIds.length} users to "Wait for Approval" state (trial_ends_at: null).`);
    }
}

finalize();
