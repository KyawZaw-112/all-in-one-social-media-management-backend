const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrdersAndStock() {
    // 1. Total orders count
    const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
    console.log(`Total Orders: ${orderCount}`);

    // 2. Total shipments count
    const { count: shipmentCount } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true });
    console.log(`Total Shipments: ${shipmentCount}`);

    // 3. All orders with details
    console.log("\n=== ALL ORDERS ===");
    const { data: orders, error: ordErr } = await supabase
        .from('orders')
        .select('id, order_no, item_name, quantity, full_name, status, created_at')
        .order('created_at', { ascending: false });

    if (ordErr) {
        console.error("Error:", ordErr.message);
    } else {
        let totalQty = 0;
        orders.forEach((o, i) => {
            const qty = o.quantity || 1;
            totalQty += qty;
            console.log(`  ${i + 1}. ${o.order_no} | ${o.item_name} | qty=${qty} | ${o.full_name} | ${o.status} | ${o.created_at}`);
        });
        console.log(`\n  Total order rows: ${orders.length}`);
        console.log(`  Total quantity (sum): ${totalQty}`);
    }

    // 4. Check if products table exists and has stock info
    console.log("\n=== PRODUCTS / STOCK ===");
    const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('*');

    if (prodErr) {
        console.error("Products table error:", prodErr.message);
    } else if (products && products.length > 0) {
        console.log(`Found ${products.length} products:`);
        products.forEach(p => {
            console.log(`  ${p.name || p.item_name} | stock=${p.stock ?? p.quantity ?? 'N/A'} | price=${p.price || 'N/A'} | active=${p.is_active}`);
            console.log(`    Full record: ${JSON.stringify(p)}`);
        });
    } else {
        console.log("No products found or table empty.");
    }

    // 5. Check for any stock/inventory table
    console.log("\n=== CHECKING FOR INVENTORY/STOCK TABLES ===");
    const stockTables = ['stock', 'inventory', 'product_stock', 'warehouse', 'warehouses'];
    for (const t of stockTables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (!error) {
            console.log(`  ✅ Table '${t}' exists`);
            const { data, count } = await supabase.from(t).select('*', { count: 'exact' });
            console.log(`    Rows: ${count}, Data: ${JSON.stringify(data, null, 2)}`);
        }
    }
}

checkOrdersAndStock();
