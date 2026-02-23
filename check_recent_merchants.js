
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRecentMerchants() {
    console.log("🔍 Checking 5 most recent merchants...");
    const { data: merchants, error } = await supabase
        .from("merchants")
        .select("id, business_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error fetching merchants:", error);
        return;
    }

    console.log("✅ Recent Merchants:");
    merchants.forEach(m => console.log(`- ID: ${m.id}, Name: ${m.business_name}, Created: ${m.created_at}`));

    console.log("\n🔍 Checking 5 most recent auth users...");
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("❌ Error fetching auth users:", authError);
        return;
    }

    const recentUsers = users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    recentUsers.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}`));
}

checkRecentMerchants();
