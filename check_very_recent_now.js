
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkVeryRecentMerchants() {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    console.log(`🔍 Checking merchants created since ${tenMinsAgo}...`);

    const { data: merchants, error } = await supabase
        .from("merchants")
        .select("*")
        .gt("created_at", tenMinsAgo);

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`📊 Found ${merchants.length} merchants.`);
    merchants.forEach(m => console.log(`- ID: ${m.id}, Name: ${m.business_name}`));
}

checkVeryRecentMerchants();
