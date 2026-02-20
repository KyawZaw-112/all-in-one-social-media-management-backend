import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function checkSubscriptions() {
    const { supabaseAdmin } = await import("../supabaseAdmin.js");
    console.log("🔍 Checking 'subscriptions' table structure...");
    const { data, error } = await supabaseAdmin.from('subscriptions').select('*').limit(1);
    if (error) {
        console.error("❌ Error fetching subscriptions:", error.message);
    }
    else {
        console.log("✅ Table exists. Columns:", Object.keys(data[0] || {}));
    }
}
checkSubscriptions().catch(err => console.error(err));
