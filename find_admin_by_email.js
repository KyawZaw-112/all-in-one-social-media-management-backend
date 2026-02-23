
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findAdminByEmail() {
    const email = "admin@autoreply.biz";
    console.log(`🔍 Searching for profile with email: ${email}`);
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    if (profile) {
        console.log(`✅ Admin Profile Found: ID=${profile.id}, Role=${profile.role}`);
    } else {
        console.log("⚠️ No profile found for that email.");
        // List all emails in profiles
        const { data: all } = await supabase.from("profiles").select("email, id, role").limit(20);
        console.log("Current profiles:");
        all?.forEach(p => console.log(`- ${p.email} (${p.id}) [${p.role}]`));
    }
}

findAdminByEmail();
