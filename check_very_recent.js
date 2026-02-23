
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRecentMissing() {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    console.log(`🔍 Checking users created since ${twelveHoursAgo}...`);

    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("❌ Auth list error:", authError);
        return;
    }

    const recentUsers = users.filter(u => u.created_at >= twelveHoursAgo);
    console.log(`📊 Found ${recentUsers.length} recent users.`);

    for (const u of recentUsers) {
        const { data: merchant, error: mErr } = await supabase.from("merchants").select("id").eq("id", u.id).maybeSingle();
        if (mErr) {
            console.error(`❌ Error checking merchant for ${u.email}:`, mErr);
        } else if (!merchant) {
            console.log(`⚠️ User ${u.email} (ID: ${u.id}) is MISSING a merchant profile!`);
        } else {
            console.log(`✅ User ${u.email} has a merchant profile.`);
        }
    }
}

checkRecentMissing();
