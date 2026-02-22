import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkConnectedMerchants() {
    console.log("🔍 Merchants with non-null page_id:");
    const { data, error } = await supabaseAdmin
        .from("merchants")
        .select("id, business_name, page_id")
        .not("page_id", "is", null);

    if (error) console.error("❌ Error:", error);
    else {
        console.table(data);
    }
}

checkConnectedMerchants();
