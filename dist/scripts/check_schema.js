import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function checkSchema() {
    const { supabaseAdmin } = await import("../supabaseAdmin.js");
    console.log("🔍 Checking 'merchants' table structure...");
    const { data, error } = await supabaseAdmin
        .from('merchants')
        .select('*')
        .limit(1);
    if (error) {
        console.error("❌ Error fetching merchants:", error.message);
    }
    else {
        console.log("✅ Table exists. Columns in first row:", Object.keys(data[0] || {}));
    }
}
checkSchema().catch(err => console.error(err));
