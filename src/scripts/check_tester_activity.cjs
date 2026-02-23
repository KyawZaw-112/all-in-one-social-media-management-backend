const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const merchantId = "66594720-77bb-4a5c-aa49-1504a2a0c4fe";
    console.log(`🔍 Checking messages for merchant: ${merchantId}...`);

    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', merchantId)
        .order('created_at', { ascending: false });

    console.log(`✅ Found ${messages?.length || 0} messages.`);
    console.log(JSON.stringify(messages, null, 2));

    const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('merchant_id', merchantId);
    console.log(`✅ Found ${conversations?.length || 0} conversations.`);
    console.log(JSON.stringify(conversations, null, 2));
}

run().catch(console.error);
