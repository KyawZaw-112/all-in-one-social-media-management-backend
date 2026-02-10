import "dotenv/config";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function run() {
    // Adding admin user

    // First, get the user ID - you need to provide an email
    const adminEmail = process.argv[2] || "admin@example.com";


    // Get the user by email (using admin API)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
        return;
    }

    const user = userData?.users.find(u => u.email === adminEmail);

    if (!user) {
        // User not found

        // Create the user if it doesn't exist
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: "TempPassword123!",
            email_confirm: true,
        });

        if (createError || !newUser?.user) {
            return;
        }


        // Check if already in admin_users
        const { data: existingAdmin } = await supabaseAdmin
            .from("admin_users")
            .select("id")
            .eq("user_id", newUser.user.id)
            .single();

        if (existingAdmin) {
            // User already in admin_users table
        } else {
            // Try to insert without the id (let database auto-generate if it has a default)
            // If that fails, we'll use raw SQL
            const { error: adminError } = await supabaseAdmin
                .from("admin_users")
                .insert({
                    user_id: newUser.user.id,
                })
                .select();

            if (adminError) {
                // If insert fails, try using RPC or raw SQL

                // Try using upsert with just the user_id
                const { error: upsertError } = await supabaseAdmin
                    .from("admin_users")
                    .upsert({ user_id: newUser.user.id })
                    .select();

                if (upsertError) {
                    console.error("Error adding to admin_users:", upsertError.message);
                    console.error("Please add this user manually in Supabase:");
                    console.error(`INSERT INTO admin_users (user_id) VALUES ('${newUser.user.id}');`);
                    return;
                }
            }
        }

        console.log("✅ User added to admin_users table");

        console.log("✅ User added to admin_users table");
        console.log(`\n🎉 Admin user created!`);
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔐 Temporary Password: TempPassword123!`);
        console.log(`\n⚠️  IMPORTANT: Use this temporary password to login at http://localhost:3000/admin/login`);
        console.log(`   Then change your password in your account settings.`);
    } else {
        console.log(`✅ Found user: ${user.id}`);

        // Check if already admin
        const { data: admin } = await supabaseAdmin
            .from("admin_users")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (admin) {
            console.log("✅ User is already an admin");
            return;
        }

        // Add to admin_users table
        const { error: adminError } = await supabaseAdmin
            .from("admin_users")
            .insert({
                user_id: user.id,
            })
            .select();

        if (adminError) {
            console.error("Error adding to admin_users:", adminError.message);
            console.error("Please add this user manually in Supabase:");
            console.error(`INSERT INTO admin_users (user_id) VALUES ('${user.id}');`);
            return;
        }

        console.log("✅ User added to admin_users table");
    }
}

run().catch(console.error);

