import { supabaseAdmin } from "./supabaseAdmin.js";
async function checkSchema() {
    console.log("🔍 Checking 'shipments' table columns...");
    // Try to select one row or just get the error if it fails
    const { data, error } = await supabaseAdmin.from("shipments").select("*").limit(1);
    if (error) {
        console.error("❌ Error selecting from shipments:", error);
    }
    else {
        console.log("✅ Successfully selected from shipments.");
        if (data && data.length > 0) {
            console.log("First row keys:", Object.keys(data[0]));
        }
        else {
            console.log("Table is empty, cannot see columns via data.");
            // Alternative: try to insert a dummy row with intentional error to see allowed columns
            // Actually, better to just try a select of common columns
        }
    }
    const { data: ordersData, error: ordersErr } = await supabaseAdmin.from("orders").select("*").limit(1);
    console.log("🔍 Checking 'orders' table...");
    if (ordersErr)
        console.error("❌ Error selecting from orders:", ordersErr);
    else if (ordersData && ordersData.length > 0)
        console.log("Orders columns:", Object.keys(ordersData[0]));
}
checkSchema();
