
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyActivity() {
    console.log("🔍 Verifying System Activity Data Fetching Logic...");

    const [
        { data: recentMerchants },
        { data: recentPayments },
        { data: recentConnections },
        { data: expiringTrials }
    ] = await Promise.all([
        supabaseAdmin.from("merchants").select("id, business_name, subscription_plan, created_at").order("created_at", { ascending: false }).limit(5),
        supabaseAdmin.from("payments").select("id, amount, plan, approved_at").eq("status", "approved").order("approved_at", { ascending: false }).limit(5),
        supabaseAdmin.from("platform_connections").select("id, page_name, created_at").order("created_at", { ascending: false }).limit(5),
        supabaseAdmin.from("merchants").select("id, business_name, trial_ends_at").eq("subscription_status", "active").gt("trial_ends_at", new Date().toISOString()).lt("trial_ends_at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()).limit(5)
    ]);

    console.log("📊 Data Counts:");
    console.log("- Recent Merchants:", recentMerchants?.length || 0);
    console.log("- Recent Payments:", recentPayments?.length || 0);
    console.log("- Recent Connections:", recentConnections?.length || 0);
    console.log("- Expiring Trials:", expiringTrials?.length || 0);

    const systemActivity = [];

    recentMerchants?.forEach(m => {
        systemActivity.push({ type: 'signup', title: 'New Sign Up', desc: m.business_name, time: m.created_at });
    });

    recentPayments?.forEach(p => {
        systemActivity.push({ type: 'payment', title: 'Payment Received', desc: `${p.plan} (${p.amount})`, time: p.approved_at });
    });

    recentConnections?.forEach(c => {
        systemActivity.push({ type: 'connection', title: 'New Page Connected', desc: c.page_name, time: c.created_at });
    });

    expiringTrials?.forEach(m => {
        systemActivity.push({ type: 'trial_ending', title: 'Trial Ending', desc: m.business_name, time: m.trial_ends_at });
    });

    systemActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    console.log("\n📈 Combined Activity (Top 5):");
    console.log(JSON.stringify(systemActivity.slice(0, 5), null, 2));
}

verifyActivity();
