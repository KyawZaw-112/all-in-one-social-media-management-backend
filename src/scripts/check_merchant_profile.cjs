const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "d:/all in one/backend/.env" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(email) {
    console.log(`🔍 Checking user: ${email}`);

    // 1. Find user in auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error("❌ Auth search error:", authError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log("❌ User not found in auth.users");
        return;
    }

    console.log(`✅ User found: ${user.id}`);

    // 2. Check in merchants table
    const { data: merchant, error: merchantError } = await supabase
        .from("merchants")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (merchantError) {
        console.error("❌ Merchant table search error:", merchantError);
        return;
    }

    if (merchant) {
        console.log("✅ Merchant profile exists:");
        console.log(JSON.stringify(merchant, null, 2));
    } else {
        console.log("❌ Merchant profile does NOT exist for this user.");
    }
}

const emailToCheck = "holeokyawzawwin@gmail.com";
checkUser(emailToCheck);
