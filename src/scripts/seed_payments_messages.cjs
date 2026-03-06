const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function randomDate(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    return d.toISOString();
}

async function seedPaymentsAndMessages() {
    console.log("🌱 Seeding payments and messages...\n");

    // Get existing merchants
    const { data: merchants, error: mErr } = await supabase.from("merchants").select("id, subscription_plan, subscription_status, business_name");
    if (mErr || !merchants) { console.error("Cannot fetch merchants:", mErr?.message); return; }

    // --- PAYMENTS (user_id, not merchant_id; method, not payment_method) ---
    console.log("💰 Seeding payment records...");
    let paymentCount = 0;
    for (const m of merchants) {
        if (m.subscription_status === "active" && Math.random() > 0.3) {
            const amount = m.subscription_plan === "cargo" ? 20000 : 15000;

            const { error } = await supabase.from("payments").insert({
                user_id: m.id,
                amount: amount,
                currency: "MMK",
                plan: m.subscription_plan,
                status: "approved",
                method: Math.random() > 0.5 ? "bank_transfer" : "kpay",
                payment_provider: Math.random() > 0.5 ? "KBZ Pay" : "Wave Pay",
                approved_at: randomDate(15),
                created_at: randomDate(20)
            });

            if (error) {
                console.error(`  ❌ Payment error for ${m.business_name}:`, error.message);
            } else {
                paymentCount++;
            }
        }
    }

    // Pending payments
    const activeM = merchants.filter(m => m.subscription_status === "active").slice(0, 4);
    for (const m of activeM) {
        const amount = m.subscription_plan === "cargo" ? 20000 : 15000;
        const { error } = await supabase.from("payments").insert({
            user_id: m.id,
            amount: amount,
            currency: "MMK",
            plan: m.subscription_plan,
            status: "pending",
            method: "bank_transfer",
            payment_provider: "KBZ Bank",
            created_at: randomDate(3)
        });
        if (!error) paymentCount++;
    }
    console.log(`  ✅ ${paymentCount} payment records created.`);

    // --- MESSAGES (no 'direction' column, use role instead; body/message_text) ---
    console.log("\n💬 Seeding message records...");
    let msgCount = 0;
    const customerMsgs = [
        "ဈေးဘယ်လောက်လဲ", "ပို့ဆောင်ခ ဘယ်လောက်လဲ",
        "Available ပါသလား", "Order တင်ချင်ပါတယ်",
        "Tracking number ပေးပါ", "COD ရပါသလား",
        "Size chart ပြပါ", "အရောင် ဘာတွေ ရှိလဲ",
        "ဘယ်နှစ်ရက်လောက် ကြာမလဲ", "Discount ရှိပါသလား"
    ];
    const botReplies = [
        "မင်္ဂလာပါ! ကျေးဇူးပြု၍ ပစ္စည်းအမည် ပြောပြပေးပါ",
        "သင့် order လက်ခံရရှိပါပြီ။ ကျေးဇူးတင်ပါတယ်",
        "ပို့ဆောင်ခ 3000Ks ဖြစ်ပါတယ်",
        "Available ပါ! Order တင်ချင်ရင် အမည်နှင့် ဖုန်းနံပါတ် ပေးပါ",
        "ကျေးဇူးပြု၍ ဖုန်းနံပါတ် ထည့်ပေးပါ"
    ];

    for (const m of merchants) {
        if (Math.random() > 0.3) {
            const numMessages = Math.floor(Math.random() * 40) + 10;
            const messages = [];
            for (let j = 0; j < numMessages; j++) {
                const isBot = Math.random() > 0.6;
                messages.push({
                    user_id: m.id,
                    sender_id: isBot ? "bot" : `fb_user_${Math.floor(Math.random() * 99999)}`,
                    sender_name: isBot ? m.business_name : `Customer ${Math.floor(Math.random() * 100)}`,
                    message_text: isBot
                        ? botReplies[Math.floor(Math.random() * botReplies.length)]
                        : customerMsgs[Math.floor(Math.random() * customerMsgs.length)],
                    role: isBot ? "assistant" : "user",
                    channel: "facebook",
                    status: "processed",
                    created_at: randomDate(14)
                });
            }
            const { error } = await supabase.from("messages").insert(messages);
            if (error) {
                console.error(`  ❌ Messages error for ${m.business_name}:`, error.message);
            } else {
                msgCount += numMessages;
            }
        }
    }
    console.log(`  ✅ ${msgCount} messages created.`);

    console.log("\n🎉 Payments & Messages seed complete!");
}

seedPaymentsAndMessages().catch(console.error);
