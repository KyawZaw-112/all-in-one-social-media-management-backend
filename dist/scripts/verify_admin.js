import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function verifyAdmin() {
    const { supabaseAdmin } = await import("../supabaseAdmin.js");
    const email = "admin@autoreply.biz";
    console.log("🔍 Verifying Admin User Existence...");
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error("❌ Error listing users:", error.message);
        return;
    }
    const admin = users.users.find(u => u.email === email);
    if (admin) {
        console.log("✅ Admin exists with ID:", admin.id);
        // Also check merchant record
        const { data: merchant } = await supabaseAdmin.from("merchants").select("*").eq("id", admin.id).maybeSingle();
        if (merchant) {
            console.log("✅ Merchant record exists for Admin.");
        }
        else {
            console.log("❌ Merchant record MISSING for Admin.");
        }
    }
    else {
        console.log("❌ Admin User DOES NOT exist in Auth.");
    }
}
verifyAdmin().catch(err => console.error(err));
