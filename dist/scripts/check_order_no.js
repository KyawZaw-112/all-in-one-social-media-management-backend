import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function checkOrderNoColumns() {
    const { supabaseAdmin } = await import("../supabaseAdmin.js");
    console.log("🔍 Checking 'orders' table structure...");
    const { data: ordersData, error: ordersError } = await supabaseAdmin.from('orders').select('*').limit(1);
    if (ordersError) {
        console.error("❌ Error fetching orders:", ordersError.message);
    }
    else {
        const columns = ordersData && ordersData.length > 0 ? Object.keys(ordersData[0]) : [];
        console.log("✅ Orders Columns:", columns);
        console.log("Has order_no:", columns.includes('order_no'));
    }
    console.log("\n🔍 Checking 'shipments' table structure...");
    const { data: shipmentsData, error: shipmentsError } = await supabaseAdmin.from('shipments').select('*').limit(1);
    if (shipmentsError) {
        console.error("❌ Error fetching shipments:", shipmentsError.message);
    }
    else {
        const columns = shipmentsData && shipmentsData.length > 0 ? Object.keys(shipmentsData[0]) : [];
        console.log("✅ Shipments Columns:", columns);
        console.log("Has order_no:", columns.includes('order_no'));
    }
}
checkOrderNoColumns().catch(err => console.error(err));
