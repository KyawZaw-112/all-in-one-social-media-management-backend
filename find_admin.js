
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findAdmin() {
    const adminEmail = "admin@autoreply.biz";
    console.log(`🔍 Finding admin with email: ${adminEmail}`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("❌ Error listing users:", error);
        return;
    }

    const admin = users.find(u => u.email === adminEmail);
    if (admin) {
        console.log(`✅ Admin Found: ID=${admin.id}`);
    } else {
        console.log("⚠️ Admin not found in auth. Listing first 5 users to help identify...");
        users.slice(0, 5).forEach(u => console.log(`- ${u.email} (${u.id})`));
    }
}

findAdmin();
