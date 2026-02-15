import "dotenv/config";
import { supabaseAdmin } from "../supabaseAdmin.js";
async function run() {
    console.log("🔐 Update Admin Password");
    console.log("=======================\n");
    const adminEmail = process.argv[2];
    const newPassword = process.argv[3];
    if (!adminEmail || !newPassword) {
        console.log("Usage: npm run update-admin-password -- email@example.com newpassword");
        console.log("\nExample:");
        console.log("  npm run update-admin-password -- john@gmail.com MyNewPassword123!");
        process.exit(1);
    }
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔐 New Password: ${"*".repeat(newPassword.length)}\n`);
    // Get the user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) {
        console.error("❌ Error listing users:", userError);
        return;
    }
    const user = userData?.users.find(u => u.email === adminEmail);
    if (!user) {
        console.error(`❌ User not found: ${adminEmail}`);
        console.log("\nAvailable users:");
        userData?.users.forEach(u => console.log(`  - ${u.email}`));
        return;
    }
    console.log(`✅ Found user: ${user.id}`);
    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
    });
    if (updateError) {
        console.error("❌ Error updating password:", updateError.message);
        return;
    }
    console.log(`✅ Password updated successfully!`);
    console.log(`\n🎉 You can now login with:`);
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔐 Password: ${newPassword}`);
    console.log(`\n📍 Go to: http://localhost:3000/admin/login`);
}
run().catch(console.error);
