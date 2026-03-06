const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Realistic Myanmar business names
const shopNames = [
    "Yadanar Online Shop", "Golden Star Fashion", "Mingalar Cosmetics",
    "Shwe Myint Mo Beauty", "Pyae Sone Electronics", "Kaung Myat Phone Shop",
    "Thiri Hnin Si Clothing", "Aung Myat Thu Accessories", "Nay Chi Lin Store",
    "Su Myat Noe Boutique", "Htet Aung Mobile", "Mya Nandar Gems"
];

const cargoNames = [
    "Shwe Pyi Taw Express", "Golden Arrow Logistics", "Myanmar Speed Cargo",
    "Ayeyarwaddy Shipping", "Mandalay Express Delivery", "Zay Cho Express",
    "Pathein Cargo Services", "Bagan Fast Delivery"
];

const emails = [
    "yadanar.shop@gmail.com", "golden.star@gmail.com", "mingalar.cos@gmail.com",
    "shwemyintmo@gmail.com", "pyaesone.elec@gmail.com", "kaungmyat.phone@gmail.com",
    "thiri.clothing@gmail.com", "aungmyatthu@gmail.com", "naychil.store@gmail.com",
    "sumyatnoe@gmail.com", "htetaung.mobile@gmail.com", "mya.gems@gmail.com",
    "shwepyitaw.exp@gmail.com", "goldenarrow.log@gmail.com", "mmspeed.cargo@gmail.com",
    "ayeyar.ship@gmail.com", "mandalay.exp@gmail.com", "zaycho.exp@gmail.com",
    "pathein.cargo@gmail.com", "bagan.delivery@gmail.com"
];

function randomDate(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    return d.toISOString();
}

function futureDate(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString();
}

async function seed() {
    console.log("🌱 Seeding realistic admin data...\n");

    // 1. Create auth users + merchant records
    const createdUsers = [];

    const allNames = [...shopNames, ...cargoNames];
    for (let i = 0; i < allNames.length; i++) {
        const name = allNames[i];
        const email = emails[i];
        const isCargo = i >= shopNames.length;
        const plan = isCargo ? "cargo" : "online_shop";
        const bType = isCargo ? "cargo" : "online_shop";

        // Random status distribution: 70% active, 20% expired, 10% pending
        const rand = Math.random();
        let status, trialEnd;
        if (rand < 0.7) {
            status = "active";
            trialEnd = futureDate(Math.floor(Math.random() * 25) + 5);
        } else if (rand < 0.9) {
            status = "expired";
            trialEnd = randomDate(10);
        } else {
            status = "active";
            trialEnd = futureDate(3); // about to expire
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: "Demo123!@#",
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        if (authError) {
            // User might already exist, try to find them
            const { data: users } = await supabase.auth.admin.listUsers();
            const existing = users?.users?.find(u => u.email === email);
            if (existing) {
                createdUsers.push({ id: existing.id, name, email, plan, bType, status, trialEnd });
                console.log(`  ⏭️ ${name} already exists, reusing.`);
            } else {
                console.error(`  ❌ Failed to create ${email}:`, authError.message);
            }
            continue;
        }

        createdUsers.push({ id: authData.user.id, name, email, plan, bType, status, trialEnd });
        console.log(`  ✅ Created user: ${name} (${email})`);
    }

    // 2. Upsert merchant records
    console.log("\n📦 Upserting merchant records...");
    for (const u of createdUsers) {
        const { error } = await supabase.from("merchants").upsert({
            id: u.id,
            page_id: `page-${u.id.slice(0, 8)}`,
            business_name: u.name,
            business_type: u.bType,
            subscription_plan: u.plan,
            subscription_status: u.status,
            trial_ends_at: u.trialEnd,
            created_at: randomDate(30)
        }, { onConflict: "id" });

        if (error) {
            console.error(`  ❌ Merchant error for ${u.name}:`, error.message);
        }
    }
    console.log(`  ✅ ${createdUsers.length} merchant records upserted.`);

    // 3. Seed payments (approved + pending)
    console.log("\n💰 Seeding payment records...");
    let paymentCount = 0;
    for (const u of createdUsers) {
        if (u.status === "active" && Math.random() > 0.3) {
            const amount = u.plan === "cargo" ? 20000 : 15000;

            // Approved payment
            const { error } = await supabase.from("payments").insert({
                merchant_id: u.id,
                amount: amount,
                plan: u.plan,
                status: "approved",
                payment_method: Math.random() > 0.5 ? "bank_transfer" : "kpay",
                approved_at: randomDate(15),
                created_at: randomDate(20)
            });

            if (error) {
                console.error(`  ❌ Payment error:`, error.message);
            } else {
                paymentCount++;
            }
        }
    }

    // Add a few pending payments
    const pendingUsers = createdUsers.filter(u => u.status === "active").slice(0, 3);
    for (const u of pendingUsers) {
        const amount = u.plan === "cargo" ? 20000 : 15000;
        await supabase.from("payments").insert({
            merchant_id: u.id,
            amount: amount,
            plan: u.plan,
            status: "pending",
            payment_method: "bank_transfer",
            created_at: randomDate(3)
        });
        paymentCount++;
    }
    console.log(`  ✅ ${paymentCount} payment records created.`);

    // 4. Seed messages (simulate conversation history)
    console.log("\n💬 Seeding message records...");
    let msgCount = 0;
    for (const u of createdUsers) {
        if (Math.random() > 0.4) {
            const numMessages = Math.floor(Math.random() * 30) + 5;
            const messages = [];
            for (let j = 0; j < numMessages; j++) {
                messages.push({
                    page_id: `page-${u.id.slice(0, 8)}`,
                    sender_id: `user_${Math.floor(Math.random() * 99999)}`,
                    message_text: ["ဈေးဘယ်လောက်လဲ", "ပို့ဆောင်ခ ဘယ်လောက်လဲ", "Available ပါသလား", "Order တင်ချင်ပါတယ်", "Tracking number ပေးပါ", "COD ရပါသလား"][Math.floor(Math.random() * 6)],
                    direction: Math.random() > 0.5 ? "incoming" : "outgoing",
                    created_at: randomDate(14)
                });
            }
            const { error } = await supabase.from("messages").insert(messages);
            if (error) {
                console.error(`  ❌ Messages error:`, error.message);
            } else {
                msgCount += numMessages;
            }
        }
    }
    console.log(`  ✅ ${msgCount} messages created.`);

    // 5. Seed platform connections
    console.log("\n🔗 Seeding platform connections...");
    let connCount = 0;
    for (const u of createdUsers) {
        if (u.status === "active" && Math.random() > 0.3) {
            const { error } = await supabase.from("platform_connections").upsert({
                user_id: u.id,
                platform: "facebook",
                page_id: `page-${u.id.slice(0, 8)}`,
                page_name: u.name,
                page_access_token: "demo_token_" + u.id.slice(0, 8),
                created_at: randomDate(20)
            }, { onConflict: "user_id,page_id" });

            if (error) {
                console.error(`  ❌ Connection error:`, error.message);
            } else {
                connCount++;
            }
        }
    }
    console.log(`  ✅ ${connCount} platform connections created.`);

    console.log("\n🎉 Seed complete!");
    console.log(`   📊 ${createdUsers.length} merchants`);
    console.log(`   💰 ${paymentCount} payments`);
    console.log(`   💬 ${msgCount} messages`);
    console.log(`   🔗 ${connCount} connected pages`);
}

seed().catch(console.error);
