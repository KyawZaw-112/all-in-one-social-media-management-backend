
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findAdminProfile() {
    console.log("🔍 Searching for profiles with role='admin'...");
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin");

    if (error) {
        console.error("❌ Error fetching profiles:", error);
        return;
    }

    if (profiles && profiles.length > 0) {
        console.log("✅ Admin Profile(s) Found:");
        profiles.forEach(p => console.log(`- ID: ${p.id}, Role: ${p.role}`));
    } else {
        console.log("⚠️ No admin profiles found.");
        const { data: allProfiles } = await supabase.from("profiles").select("*").limit(5);
        console.log("Sample profiles:");
        allProfiles.forEach(p => console.log(`- ${p.id} (Role: ${p.role})`));
    }
}

findAdminProfile();
