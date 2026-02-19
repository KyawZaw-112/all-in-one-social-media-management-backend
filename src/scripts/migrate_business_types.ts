import "dotenv/config";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function migrate() {
    console.log("🚀 Starting Global Business Type Migration...");

    // 1. Update merchants table
    console.log("📊 Updating merchants table...");
    const { data: mData, error: mError } = await supabaseAdmin
        .from("merchants")
        .update({ business_type: 'online_shop' })
        .eq("business_type", "shop")
        .select();

    if (mError) {
        console.error("❌ Merchant migration failed:", mError);
    } else {
        console.log(`✅ Updated ${mData?.length || 0} merchants from 'shop' to 'online_shop'`);
    }

    const { data: sData, error: sError } = await supabaseAdmin
        .from("merchants")
        .update({ subscription_plan: 'online_shop' })
        .eq("subscription_plan", "shop")
        .select();

    if (sError) {
        console.error("❌ Subscription Plan migration failed:", sError);
    } else {
        console.log(`✅ Updated ${sData?.length || 0} subscription plans from 'shop' to 'online_shop'`);
    }

    console.log("🏁 Migration finished!");
}

migrate().catch(console.error);
