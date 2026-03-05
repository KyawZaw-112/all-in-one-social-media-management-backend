const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const email = "admin@autoreply.biz";
const password = "Admin123!@#";

async function setupAdmin() {
    console.log("🚀 Setting up admin...");

    // 1. Create or get user
    let userId;
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error("❌ Error listing users:", userError.message);
        return;
    }

    let user = userData.users.find(u => u.email === email);

    if (!user) {
        console.log("Creating new auth user...");
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: "System Admin", role: "admin" }
        });

        if (createError) {
            console.error("❌ Error creating user:", createError.message);
            return;
        }
        user = newUser.user;
        console.log("✅ User created.");
    } else {
        console.log("✅ User already exists.");
        // Update password just in case
        await supabase.auth.admin.updateUserById(user.id, { password });
    }
    userId = user.id;

    // 2. Add to merchants table (required for dashboard)
    const { error: merchantError } = await supabase
        .from("merchants")
        .upsert({
            id: userId,
            business_name: "SaaS Admin",
            subscription_plan: "cargo",
            subscription_status: "active",
            trial_ends_at: new Date("2099-12-31").toISOString(),
        }, { onConflict: "id" });

    if (merchantError) {
        console.error("❌ Error upserting merchant:", merchantError.message);
    } else {
        console.log("✅ Merchant record ready.");
    }

    // 3. Add to admin_users table (required for admin panel)
    const { error: adminError } = await supabase
        .from("admin_users")
        .upsert({
            user_id: userId,
            role: 'admin',
            is_active: true
        }, { onConflict: "user_id" });

    if (adminError) {
        console.error("❌ Error upserting admin_user:", adminError.message);
    } else {
        console.log("✅ Admin access granted.");
    }

    console.log(`\n🎉 Admin setup complete!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}`);
}

setupAdmin().catch(console.error);
