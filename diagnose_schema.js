import dotenv from "dotenv";
dotenv.config();
import { supabaseAdmin } from "./src/supabaseAdmin.js";

async function diagnose() {
    console.log("🔍 Diagnosing Database Schema...");

    // Check merchants table first
    const { data: merchants, error: mErr } = await supabaseAdmin.from("merchants").select("*").limit(1);
    if (mErr) console.error("❌ Merchants Table Error:", mErr);
    else console.log("✅ Merchants Row Keys:", merchants[0] ? Object.keys(merchants[0]) : "Empty Table");

    console.log("\n--- ORDERS TABLE ---");
    // Try to get one row to see columns
    const { data: order, error: orderErr } = await supabaseAdmin.from("orders").select("*").limit(1);
    if (orderErr) {
        console.error("❌ Orders Select Error:", orderErr);
        // Try getting schema info via RPC if available or just testing user_id
        console.log("Testing user_id column...");
        const { error: testErr } = await supabaseAdmin.from("orders").select("user_id").limit(1);
        if (testErr) console.log("   ❌ user_id also doesn't exist");
        else console.log("   ✅ user_id EXISTS in orders");
    } else {
        console.log("✅ Orders Row Keys:", order[0] ? Object.keys(order[0]) : "Empty Table");
    }

    console.log("\n--- SHIPMENTS TABLE ---");
    const { data: shipment, error: shipmentErr } = await supabaseAdmin.from("shipments").select("*").limit(1);
    if (shipmentErr) console.error("❌ Shipments Select Error:", shipmentErr);
    else console.log("✅ Shipments Row Keys:", shipment[0] ? Object.keys(shipment[0]) : "Empty Table");
}

diagnose();
