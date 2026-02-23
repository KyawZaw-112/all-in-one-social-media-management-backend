const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const pageId = "957808180755824";
    console.log(`🔍 Checking for duplicate connections for Page: ${pageId}...`);

    const { data: connections } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('page_id', pageId);

    console.log(`✅ Found ${connections?.length || 0} connections for this page.`);
    console.log(JSON.stringify(connections, null, 2));

    const { data: merchants } = await supabase
        .from('merchants')
        .select('*')
        .ilike('page_id', `%${pageId}%`);

    console.log(`✅ Found ${merchants?.length || 0} merchants related to this page.`);
    console.log(JSON.stringify(merchants, null, 2));
}

run().catch(console.error);
