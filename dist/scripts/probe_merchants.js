import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";
async function probeMerchants() {
    console.log("🕵️ Probing 'merchants' columns...");
    const candidates = [
        "id", "user_id", "page_id", "business_name", "business_type",
        "subscription_status", "trial_ends_at", "subscription_plan",
        "last_payment_date", "created_at", "updated_at", "email", "phone"
    ];
    for (const col of candidates) {
        const { error } = await supabaseAdmin.from("merchants").select(col).limit(1);
        if (error && error.message.includes("column") && error.message.includes("does not exist")) {
            console.log(`❌ Column '${col}' DOES NOT exist.`);
        }
        else if (error) {
            console.log(`⚠️ Column '${col}' might exist but error: ${error.message}`);
        }
        else {
            console.log(`✅ Column '${col}' EXISTS.`);
        }
    }
}
probeMerchants().catch(console.error);
