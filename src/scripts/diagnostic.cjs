
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Defined' : 'Missing');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
    console.log('--- Platform Connections ---');
    const { data: conns, error: err1 } = await supabase
        .from('platform_connections')
        .select('*');

    if (err1) console.error(err1);
    else console.table(conns.map(c => ({ id: c.id, user_id: c.user_id, merchant_id: c.merchant_id, page_id: c.page_id })));

    console.log('\n--- Active Conversations ---');
    const { data: convs, error: err2 } = await supabase
        .from('conversations')
        .select('*')
        .eq('status', 'active');

    if (err2) console.error(err2);
    else console.table(convs.map(c => ({ id: c.id, merchant_id: c.merchant_id, psid: c.user_psid, status: c.status })));

    console.log('\n--- Automation Flows ---');
    const { data: flows, error: err3 } = await supabase
        .from('automation_flows')
        .select('*');

    if (err3) console.error(err3);
    else console.table(flows.map(f => ({ id: f.id, name: f.name, trigger: f.trigger_keyword, active: f.is_active })));
}

diagnose();
