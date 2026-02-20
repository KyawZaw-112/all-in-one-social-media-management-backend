import "dotenv/config";
import { supabaseAdmin } from "../supabaseAdmin.js";
async function inspectTable() {
    console.log("Checking RLS policies for platform_connections...");
    // Try to query pg_policies via a generic select if possible (might fail depending on permissions)
    const { data: policies, error: polError } = await supabaseAdmin
        .from('pg_policies')
        .select('*');
    if (polError) {
        console.log("Direct pg_policies query failed:", polError.message);
    }
    else {
        console.log("All RLS Policies:", policies);
    }
    // Attempt specific insert test
    console.log("Testing service role insert...");
    const { error: insertError } = await supabaseAdmin
        .from('platform_connections')
        .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        platform: 'test',
        page_id: 'test_page_' + Date.now(),
        page_name: 'Test Page',
        page_access_token: 'test_token'
    });
    if (insertError) {
        console.error("Test insert failed:", insertError);
    }
    else {
        console.log("Test insert succeeded! Service role is working as expected.");
    }
    // Try to select and see if we can see everything
    const { count, error: countError } = await supabaseAdmin
        .from('platform_connections')
        .select('*', { count: 'exact', head: true });
    if (countError) {
        console.error("Count failed:", countError);
    }
    else {
        console.log("Total rows accessible via service role:", count);
    }
}
inspectTable();
