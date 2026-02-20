import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function resetPassword() {
    const { supabaseAdmin } = await import("../supabaseAdmin.js");
    const email = "admin@autoreply.biz";
    const password = "Admin123!@#";
    console.log("🔄 Force resetting Amin Password...");
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const admin = users.users.find(u => u.email === email);
    if (admin) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(admin.id, { password });
        if (error)
            console.error("❌ Reset Error:", error.message);
        else
            console.log("✅ Password successfully reset to: Admin123!@#");
    }
    else {
        console.log("❌ Admin not found.");
    }
}
resetPassword().catch(err => console.error(err));
