import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkConnections() {
    console.log("🔍 Checking platform connections...");
    const { data, error } = await supabaseAdmin
        .from("platform_connections")
        .select("*");

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("ℹ️ No connections found.");
    } else {
        console.log(`✅ Found ${data.length} connections:`);
        data.forEach(c => {
            console.log(`- Page: ${c.page_name} (ID: ${c.page_id}) | User: ${c.user_id || c.merchant_id}`);
        });
    }
}

checkConnections().catch(console.error);
