const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentActivity() {
    console.log("=== RECENT CONVERSATIONS (last 5) ===");
    const { data: convos, error: convError } = await supabase
        .from('conversations')
        .select('id, merchant_id, page_id, user_psid, flow_id, status, temp_data, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (convError) {
        console.error("Error fetching conversations:", convError.message);
    } else {
        for (const c of convos) {
            console.log(`\n--- Conversation ${c.id} ---`);
            console.log(`  Status: ${c.status}`);
            console.log(`  Created: ${c.created_at}`);
            console.log(`  Updated: ${c.updated_at}`);
            console.log(`  Page ID: ${c.page_id}`);
            console.log(`  User PSID: ${c.user_psid}`);
            console.log(`  Flow ID: ${c.flow_id}`);
            console.log(`  Temp Data keys: ${Object.keys(c.temp_data || {}).join(', ')}`);
            console.log(`  Temp Data: ${JSON.stringify(c.temp_data, null, 2)}`);
        }
    }

    console.log("\n\n=== RECENT MESSAGES (last 10, non-debug) ===");
    const { data: msgs, error: msgError } = await supabase
        .from('messages')
        .select('id, sender_id, sender_name, body, channel, status, created_at, metadata')
        .neq('sender_id', 'SYSTEM_DEBUG')
        .order('created_at', { ascending: false })
        .limit(10);

    if (msgError) {
        console.error("Error fetching messages:", msgError.message);
    } else {
        for (const m of msgs) {
            console.log(`\n  [${m.created_at}] ${m.sender_name} (${m.status}): ${(m.body || '').substring(0, 80)}`);
        }
    }

    console.log("\n\n=== AUTOMATION FLOWS (active) ===");
    const { data: flows, error: flowError } = await supabase
        .from('automation_flows')
        .select('id, merchant_id, trigger_keyword, business_type, is_active')
        .eq('is_active', true);

    if (flowError) {
        console.error("Error fetching flows:", flowError.message);
    } else {
        for (const f of flows) {
            console.log(`  Flow ${f.id}: type=${f.business_type}, trigger="${f.trigger_keyword}", merchant=${f.merchant_id}`);
        }
    }

    console.log("\n\n=== PLATFORM CONNECTIONS ===");
    const { data: conns, error: connError } = await supabase
        .from('platform_connections')
        .select('id, user_id, merchant_id, page_id, page_name, platform, status, created_at')
        .limit(5);

    if (connError) {
        console.error("Error fetching connections:", connError.message);
    } else {
        for (const c of conns) {
            console.log(`  Connection: page=${c.page_name} (${c.page_id}), status=${c.status}, merchant=${c.merchant_id || c.user_id}`);
        }
    }
}

checkRecentActivity();
