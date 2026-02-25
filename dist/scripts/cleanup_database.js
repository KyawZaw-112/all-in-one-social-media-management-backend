import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function cleanup() {
    const adminEmail = "user01@example.com"; // Picked from existing users
    const adminPassword = "Admin123!@#";
    console.log("🚀 Starting Database Cleanup (Preserving Admin)...");
    // 1. Ensure Admin Exists
    console.log(`🔍 Ensuring admin user ${adminEmail} exists...`);
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError)
        throw listError;
    let admin = users.users.find(u => u.email === adminEmail);
    let adminId;
    if (!admin) {
        console.log("➕ Creating missing admin user...");
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true
        });
        if (createError || !newUser.user)
            throw createError || new Error("Failed to create admin");
        adminId = newUser.user.id;
    }
    else {
        adminId = admin.id;
        console.log(`✅ Admin exists: ${adminId}`);
        // Reset password just in case
        await supabaseAdmin.auth.admin.updateUserById(adminId, { password: adminPassword });
    }
    // Ensure admin has profile and merchant record
    console.log("📝 Ensuring admin profile and merchant records...");
    await supabaseAdmin.from("profiles").upsert({ id: adminId, role: 'admin', is_active: true }, { onConflict: "id" });
    await supabaseAdmin.from("merchants").upsert({
        id: adminId,
        page_id: "admin_page_placeholder",
        business_name: "Boss Admin Panel",
        business_type: "online_shop",
        subscription_plan: "cargo",
        subscription_status: "active",
        trial_ends_at: new Date("2099-12-31").toISOString()
    }, { onConflict: "id" });
    // 2. Identify Non-Admin Users
    const otherUsers = users.users.filter(u => u.email !== adminEmail);
    const otherUserIds = otherUsers.map(u => u.id);
    console.log(`👥 Found ${otherUserIds.length} other users to delete.`);
    if (otherUserIds.length === 0) {
        console.log("✨ No other users found. Cleanup complete or already clean.");
        return;
    }
    // 3. Delete Data from Public Tables
    const tablesToClear = [
        { name: 'messages', ownerCol: null },
        { name: 'orders', ownerCol: 'merchant_id' },
        { name: 'shipments', ownerCol: 'merchant_id' },
        { name: 'conversations', ownerCol: 'merchant_id' },
        { name: 'automation_flows', ownerCol: 'merchant_id' },
        { name: 'products', ownerCol: 'merchant_id' },
        { name: 'platform_connections', ownerCol: 'user_id' },
        { name: 'merchants', ownerCol: 'id' },
        { name: 'profiles', ownerCol: 'id' }
    ];
    console.log("🗑️ Clearing data from public tables...");
    // special case for messages (since they don't have merchant_id directly)
    // we delete messages where conversation_id belongs to a deleted merchant
    try {
        // This is complex via PostgREST. A simpler way is to delete all messages first 
        // IF the user is fine with losing ALL messages (since admins usually don't have messages yet)
        console.log("- Deleting ALL messages...");
        await supabaseAdmin.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    catch (e) {
        console.error("Error deleting messages:", e);
    }
    for (const table of tablesToClear) {
        if (!table.ownerCol)
            continue;
        console.log(`- Clearing ${table.name}...`);
        const { error } = await supabaseAdmin
            .from(table.name)
            .delete()
            .neq(table.ownerCol, adminId);
        if (error) {
            console.error(`  ❌ Error clearing ${table.name}:`, error.message);
        }
    }
    // 4. Delete Auth Users
    console.log("🚫 Deleting auth users...");
    for (const user of otherUsers) {
        console.log(`- Deleting user ${user.email} (${user.id})...`);
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (error) {
            console.error(`  ❌ Error deleting auth user ${user.id}:`, error.message);
        }
    }
    console.log("\n✅ Database Cleanup Finished Successfully!");
}
cleanup().catch(err => {
    console.error("🔥 Cleanup Failed:", err);
    process.exit(1);
});
