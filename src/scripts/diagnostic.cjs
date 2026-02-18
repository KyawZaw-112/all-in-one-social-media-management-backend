
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
    console.log('--- Merchants ---');
    const { data: merchants, error: errM } = await supabase
        .from('merchants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

    if (errM) console.error(errM);
    else console.table(merchants.map(m => ({
        id: m.id,
        status: m.subscription_status,
        trial_ends: m.trial_ends_at,
        plan: m.subscription_plan
    })));

    console.log('\n--- Profiles (Latest 15) ---');
    const { data: profiles, error: errP } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

    if (errP) console.error(errP);
    else console.table(profiles.map(p => ({ id: p.id, role: p.role })));
}

diagnose();
