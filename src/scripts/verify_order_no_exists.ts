import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function verifyColumn() {
    console.log("Checking columns for 'orders' table...");
    try {
        const { supabaseAdmin } = await import("../supabaseAdmin.js");

        // Check for order_no in orders
        const { data: orders, error: ordersErr } = await supabaseAdmin.from('orders').select('*').limit(1);
        if (ordersErr) {
            console.error("Orders Error:", ordersErr.message);
        } else if (orders && orders.length > 0) {
            console.log("Orders columns:", Object.keys(orders[0]));
            console.log("Has 'order_no' in orders:", Object.keys(orders[0]).includes('order_no'));
        } else {
            // Table empty, try to select the column specifically
            const { error: colErr } = await supabaseAdmin.from('orders').select('order_no').limit(1);
            console.log("Has 'order_no' in orders (specific select):", !colErr);
        }

        // Check for order_no in shipments
        const { data: shipments, error: shipsErr } = await supabaseAdmin.from('shipments').select('*').limit(1);
        if (shipsErr) {
            console.error("Shipments Error:", shipsErr.message);
        } else if (shipments && shipments.length > 0) {
            console.log("Shipments columns:", Object.keys(shipments[0]));
            console.log("Has 'order_no' in shipments:", Object.keys(shipments[0]).includes('order_no'));
        } else {
            const { error: colErr } = await supabaseAdmin.from('shipments').select('order_no').limit(1);
            console.log("Has 'order_no' in shipments (specific select):", !colErr);
        }

    } catch (e) {
        console.error("Execution error:", e);
    }
}

verifyColumn();
