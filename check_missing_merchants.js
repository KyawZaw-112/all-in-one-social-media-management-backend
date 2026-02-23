
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMissingMerchants() {
    console.log("🔍 Comparing auth users and merchants...");

    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("❌ Auth list error:", authError);
        return;
    }

    const { data: merchants, error: merchError } = await supabase.from("merchants").select("id");
    if (merchError) {
        console.error("❌ Merchants list error:", merchError);
        return;
    }

    const merchantIds = new Set(merchants.map(m => m.id));
    const missing = users.filter(u => !merchantIds.has(u.id));

    console.log(`📊 Stats: ${users.length} users, ${merchants.length} merchants.`);
    if (missing.length > 0) {
        console.log(`⚠️ Found ${missing.length} users WITHOUT merchant profiles:`);
        missing.slice(0, 10).forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}`));
    } else {
        console.log("✅ All auth users have merchant profiles.");
    }
}

checkMissingMerchants();
