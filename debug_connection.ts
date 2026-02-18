import 'dotenv/config';
import { supabaseAdmin } from './src/supabaseAdmin.js';

async function debugConnection() {
    console.log("🔍 Checking ALL connection records...");

    // 1. Check platform_connections
    const { data: connections, error: connError } = await supabaseAdmin
        .from('platform_connections')
        .select('*')
        .order('created_at', { ascending: false });

    if (connError) {
        console.error("❌ Error fetching platform_connections:", connError);
    } else {
        console.log("\n--- Platform Connections ---");
        console.table(connections?.map(c => ({
            user: c.user_id,
            p_id: c.page_id,
            name: c.page_name,
            created: c.created_at
        })));
    }

    // 2. Check merchants
    const { data: merchants, error: merchError } = await supabaseAdmin
        .from('merchants')
        .select('*')
        .order('created_at', { ascending: false });

    if (merchError) {
        console.error("❌ Error fetching merchants:", merchError);
    } else {
        console.log("\n--- Merchants ---");
        console.table(merchants?.map(m => ({
            id: m.id,
            pid: m.page_id,
            biz: m.business_name,
            created: m.created_at
        })));
    }
}

debugConnection().catch(console.error);
