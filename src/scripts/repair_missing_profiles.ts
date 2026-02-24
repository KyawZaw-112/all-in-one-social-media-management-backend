
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function repair() {
    console.log("🛠️ Starting Repair for Missing Profiles/Merchants...");

    // 1. Get all auth users
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    console.log(`👥 Total Auth Users: ${users.length}`);

    for (const user of users) {
        // Check profile
        const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("id", user.id).maybeSingle();
        // Check merchant
        const { data: merchant } = await supabaseAdmin.from("merchants").select("id").eq("id", user.id).maybeSingle();

        if (!profile) {
            console.log(`➕ Creating missing profile for ${user.email} (${user.id})`);
            await supabaseAdmin.from("profiles").insert({
                id: user.id,
                email: user.email,
                role: 'merchant',
                full_name: user.email?.split('@')[0] || 'Merchant'
            });
        }

        if (!merchant) {
            console.log(`➕ Creating missing merchant for ${user.email} (${user.id})`);
            await supabaseAdmin.from("merchants").insert({
                id: user.id,
                page_id: `pending-${user.id}`,
                business_name: `${user.email?.split('@')[0]}'s Business`,
                business_type: 'online_shop',
                subscription_plan: 'online_shop',
                subscription_status: 'active',
                trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
    }

    console.log("✅ Repair complete!");
}

repair();
