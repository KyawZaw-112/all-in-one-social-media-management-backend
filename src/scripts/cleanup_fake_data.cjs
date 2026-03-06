const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// These are the fake emails I just seeded
const fakeEmails = [
    "yadanar.shop@gmail.com", "golden.star@gmail.com", "mingalar.cos@gmail.com",
    "shwemyintmo@gmail.com", "pyaesone.elec@gmail.com", "kaungmyat.phone@gmail.com",
    "thiri.clothing@gmail.com", "aungmyatthu@gmail.com", "naychil.store@gmail.com",
    "sumyatnoe@gmail.com", "htetaung.mobile@gmail.com", "mya.gems@gmail.com",
    "shwepyitaw.exp@gmail.com", "goldenarrow.log@gmail.com", "mmspeed.cargo@gmail.com",
    "ayeyar.ship@gmail.com", "mandalay.exp@gmail.com", "zaycho.exp@gmail.com",
    "pathein.cargo@gmail.com", "bagan.delivery@gmail.com"
];

async function cleanup() {
    console.log("🧹 Cleaning up fake seeded data...\n");

    // 1. Get all auth users to find fake ones
    const { data: userData } = await supabase.auth.admin.listUsers();
    const fakeUsers = userData.users.filter(u => fakeEmails.includes(u.email));
    const fakeIds = fakeUsers.map(u => u.id);

    console.log(`Found ${fakeUsers.length} fake users to remove.`);

    // 2. Delete fake platform connections
    for (const id of fakeIds) {
        await supabase.from("platform_connections").delete().eq("user_id", id);
    }
    console.log("  ✅ Removed fake platform connections");

    // 3. Delete fake payments
    for (const id of fakeIds) {
        await supabase.from("payments").delete().eq("user_id", id);
    }
    console.log("  ✅ Removed fake payments");

    // 4. Delete fake messages
    for (const id of fakeIds) {
        await supabase.from("messages").delete().eq("user_id", id);
    }
    console.log("  ✅ Removed fake messages");

    // 5. Delete fake merchants
    for (const id of fakeIds) {
        await supabase.from("merchants").delete().eq("id", id);
    }
    console.log("  ✅ Removed fake merchant records");

    // 6. Delete fake auth users
    for (const user of fakeUsers) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) console.error(`  ❌ Error deleting ${user.email}:`, error.message);
    }
    console.log("  ✅ Removed fake auth users");

    // 7. Show remaining real data
    const { data: realMerchants } = await supabase.from("merchants").select("id, business_name, subscription_plan, subscription_status");
    const { data: realPayments } = await supabase.from("payments").select("id, status");
    const { data: realMessages, count: msgCount } = await supabase.from("messages").select("id", { count: "exact", head: true });
    const { data: realConns } = await supabase.from("platform_connections").select("id, page_name");

    console.log("\n📊 Remaining REAL data:");
    console.log(`  🏪 Merchants: ${realMerchants?.length || 0}`);
    realMerchants?.forEach(m => console.log(`     - ${m.business_name} (${m.subscription_plan}, ${m.subscription_status})`));
    console.log(`  💰 Payments: ${realPayments?.length || 0}`);
    console.log(`  💬 Messages: ${msgCount || 0}`);
    console.log(`  🔗 Connections: ${realConns?.length || 0}`);
    realConns?.forEach(c => console.log(`     - ${c.page_name}`));
}

cleanup().catch(console.error);
