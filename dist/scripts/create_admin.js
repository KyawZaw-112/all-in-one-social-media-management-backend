import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function createAdmin() {
    const { supabaseAdmin } = await import("../supabaseAdmin.js");
    const email = "admin@autoreply.biz";
    const password = "Admin123!@#";
    console.log("🚀 Ensuring Admin Account is properly set up...");
    // 1. Find existing user if any
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
        console.error("❌ Error listing users:", listError.message);
        return;
    }
    let existingUser = users.users.find(u => u.email === email);
    let userId;
    if (existingUser) {
        console.log("ℹ️ User exists. Resetting password and merchant record...");
        userId = existingUser.id;
        // Update user to ensure password
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    }
    else {
        console.log("ℹ️ Creating new user...");
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        if (authError || !authData.user) {
            console.error("❌ Creation Error:", authError?.message);
            return;
        }
        userId = authData.user.id;
    }
    // 2. Create/Update Merchant Record
    const { error: merchantError } = await supabaseAdmin
        .from("merchants")
        .upsert({
        id: userId,
        page_id: "admin_page_placeholder", // satisfy NOT NULL constraint
        business_name: "Boss Admin Panel",
        subscription_plan: "cargo",
        subscription_status: "active",
        trial_ends_at: new Date("2099-12-31").toISOString(),
    }, { onConflict: "id" });
    if (merchantError) {
        console.error("❌ Merchant Error:", merchantError.message);
    }
    else {
        console.log("✅ Admin System Ready!");
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
    }
}
createAdmin().catch(err => console.error(err));
