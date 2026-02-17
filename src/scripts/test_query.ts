import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function testQuery() {
    const { supabaseAdmin } = await import("../supabaseAdmin.js");

    console.log("🔍 Testing /api/admin/merchants query...");

    const { data, error } = await supabaseAdmin
        .from("merchants")
        .select(`
            *,
            user:id (email)
        `);

    if (error) {
        console.error("❌ Query Error:", error);
    } else {
        console.log("✅ Success! Data sample:", JSON.stringify(data[0], null, 2));
    }
}

testQuery().catch(err => console.error(err));
