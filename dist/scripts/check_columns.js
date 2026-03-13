import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
    console.log("🔍 Checking 'merchants' table...");
    // Check one record to see columns
    const { data: merchants, error } = await supabase
        .from("merchants")
        .select("*")
        .limit(1);
    if (error) {
        console.error("❌ Error fetching merchants:", error.message);
        return;
    }
    if (merchants && merchants.length > 0) {
        console.log("✅ Columns found in 'merchants':", Object.keys(merchants[0]));
        console.log("📝 Sample Data:", merchants[0]);
    }
    else {
        console.log("⚠️ No merchants found to check columns.");
    }
}
check();
