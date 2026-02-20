import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function checkLatestOrders() {
    try {
        const { supabaseAdmin } = await import("../supabaseAdmin.js");
        console.log("Fetching latest 3 orders...");
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select('id, created_at, order_no, full_name, item_name')
            .order('created_at', { ascending: false })
            .limit(3);
        if (error) {
            console.error("Error:", error.message);
        }
        else {
            console.log("Latest Orders:", JSON.stringify(orders, null, 2));
        }
        console.log("\nFetching latest 3 shipments...");
        const { data: shipments, error: shipError } = await supabaseAdmin
            .from('shipments')
            .select('id, created_at, order_no, full_name, item_name')
            .order('created_at', { ascending: false })
            .limit(3);
        if (shipError) {
            console.error("Error:", shipError.message);
        }
        else {
            console.log("Latest Shipments:", JSON.stringify(shipments, null, 2));
        }
    }
    catch (e) {
        console.error("Execution error:", e);
    }
}
checkLatestOrders();
