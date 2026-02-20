import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function verifyColumns() {
    try {
        const { supabaseAdmin } = await import("../supabaseAdmin.js");
        console.log("🔍 Checking columns for 'shipments' table...");
        const { data, error } = await supabaseAdmin
            .from('shipments')
            .select('*')
            .limit(1);
        if (error) {
            console.error("❌ Error fetching shipments:", error.message);
        }
        else if (data && data.length > 0) {
            console.log("✅ Columns found in shipments:", Object.keys(data[0]));
        }
        else {
            console.log("ℹ️ shipments table is empty. Attempting dummy insert to verify columns...");
            const checkFields = ['item_photos', 'page_id', 'order_no'];
            for (const field of checkFields) {
                const { error: insertErr } = await supabaseAdmin
                    .from('shipments')
                    .insert({ [field]: 'test_val', merchant_id: '00000000-0000-0000-0000-000000000000' })
                    .select();
                if (insertErr && insertErr.message.includes(`column "${field}" of relation "shipments" does not exist`)) {
                    console.log(`❌ Column '${field}' DOES NOT exist.`);
                }
                else if (insertErr && insertErr.message.includes('uuid')) {
                    // Probably exists but type mismatch or RLS/FK error
                    console.log(`✅ Column '${field}' probably exists (Error: ${insertErr.message})`);
                }
                else {
                    console.log(`✅ Column '${field}' exists or gave unexpected error: ${insertErr?.message}`);
                }
            }
        }
    }
    catch (e) {
        console.error("Execution error:", e);
    }
}
verifyColumns();
