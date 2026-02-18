import dotenv from "dotenv";
dotenv.config();
import { supabaseAdmin } from "./src/supabaseAdmin.js";

async function checkUser() {
    const email = "kyawzawwin.cs.2001@gmail.com";
    console.log(`🔍 Checking user ${email}...`);

    // 1. Get User ID from email
    const { data: users, error: userErr } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();

    if (userErr) {
        console.error("❌ Profile check error:", userErr);
        return;
    }

    if (!users) {
        console.log("❌ User profile not found in 'profiles' table.");
        // Try getting from auth
        const { data: { users: authUsers }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = authUsers?.find(u => u.email === email);
        if (authUser) {
            console.log("✅ Found in Auth but NOT in 'profiles' table. ID:", authUser.id);
            await checkMerchant(authUser.id);
        } else {
            console.log("❌ User not found in Auth system either.");
        }
    } else {
        console.log("✅ Found in 'profiles' table. ID:", users.id);
        await checkMerchant(users.id);
    }
}

async function checkMerchant(userId) {
    console.log(`\n🔍 Checking merchant profile for ${userId}...`);
    const { data: merchant, error: mErr } = await supabaseAdmin
        .from("merchants")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (mErr) {
        console.error("❌ Merchant check error:", mErr);
    } else if (merchant) {
        console.log("✅ Merchant profile EXISTS:", JSON.stringify(merchant, null, 2));
    } else {
        console.log("❌ Merchant profile MISSING.");
    }
}

checkUser();
