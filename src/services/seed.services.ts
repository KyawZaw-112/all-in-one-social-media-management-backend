import { supabaseAdmin } from "../supabaseAdmin.js";

/**
 * Seed default automation flows based on business type
 * Only seeds flows that match the merchant's business type
 */
export async function seedDefaultFlows(merchantId: string, businessType: string) {
    try {
        console.log(`🌱 Seeding default flows for merchant ${merchantId} (${businessType})`);

        // Check if merchant already has flows
        const { count } = await supabaseAdmin
            .from("automation_flows")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", merchantId);

        if (count && count > 0) {
            console.log(`ℹ️ Merchant ${merchantId} already has flows, skipping seed.`);
            return;
        }

        if (businessType === 'cargo') {
            // Cargo: Shipment booking flow
            await supabaseAdmin.from("automation_flows").insert({
                merchant_id: merchantId,
                name: "📦 Cargo Booking Flow",
                business_type: "cargo",
                trigger_keyword: "cargo, order, booking",
                description: "Default flow for cargo booking and shipment tracking.",
                is_active: true,
                steps: [
                    {
                        field: "country",
                        question: "ဘယ်လမ်းကြောင်း ပို့ချင်တာလဲ? 🌏\n\n1️⃣ 🇹🇭 ထိုင်း -> မြန်မာ 🇲🇲\n2️⃣ 🇨🇳 တရုတ် -> မြန်မာ 🇲🇲\n3️⃣ 🇰🇷 ကိုရီးယား -> မြန်မာ 🇲🇲\n4️⃣ ဂျပန် -> မြန်မာ 🇲🇲\n5️⃣ 🌍 အခြား (Other)",
                        options: [
                            { label: "Thailand -> Myanmar", value: "Thailand -> Myanmar" },
                            { label: "China -> Myanmar", value: "China -> Myanmar" },
                            { label: "Korea -> Myanmar", value: "Korea -> Myanmar" },
                            { label: "Japan -> Myanmar", value: "Japan -> Myanmar" },
                            { label: "Other", value: "Other" }
                        ]
                    },
                    {
                        field: "shipping",
                        question: "ဘယ်လို ပို့မှာလဲ? 🚢\n\n1️⃣ ✈️ Air (လေကြောင်း)\n2️⃣ 🚢 Sea (ရေကြောင်း)",
                        options: [
                            { label: "Air", value: "Air" },
                            { label: "Sea", value: "Sea" }
                        ]
                    },
                    {
                        field: "item_type",
                        question: "ပစ္စည်းအမျိုးအစား ရွေးပေးပါ 📦\n\n1️⃣ 👕 အထည်အလိပ် / ဖိနပ်\n2️⃣ 💄 အလှကုန် / ဆေးဝါး\n3️⃣ 🔌 လျှပ်စစ်ပစ္စည်း\n4️⃣ 🍲 အစားအသောက်\n5️⃣ 🌍 အထွေထွေ (General)",
                        options: [
                            { label: "Clothing", value: "Clothing" },
                            { label: "Cosmetics", value: "Cosmetics" },
                            { label: "Electronics", value: "Electronics" },
                            { label: "Food", value: "Food" },
                            { label: "General", value: "General" }
                        ]
                    },
                    { field: "item_name", question: "ပစ္စည်းအမည် ရေးပေးပါ ✏️\n(ဥပမာ - iPhone 15 × 2, အကျီ × 10)" },
                    { field: "weight", question: "ပစ္စည်းအလေးချိန် မည်မျှလဲ? ⚖️\n(ဥပမာ - 2kg, 500g)\nမသိသေးပါက \"မသိ\" ဟု ရိုက်ပါ" },
                    { field: "item_photos", type: "media", requiredCount: 5, question: "ပစ္စည်းရဲ့ ပုံ ၅ ပုံ ပို့ပေးပါခင်ဗျာ 📸" },
                    { field: "full_name", question: "သင်၏ အမည်အပြည့်အစုံ ထည့်ပေးပါ 👤" },
                    { field: "phone", question: "ဆက်သွယ်ရန် ဖုန်းနံပါတ် ထည့်ပေးပါ 📞" }
                ]
            });
        } else {
            // Online Shop: Product order flow + price inquiry
            await supabaseAdmin.from("automation_flows").insert([
                {
                    merchant_id: merchantId,
                    name: "🛍️ Product Order Flow",
                    business_type: "online_shop",
                    trigger_keyword: "order, buy, price",
                    description: "Default flow for product inquiries and order collection.",
                    is_active: true,
                    steps: [
                        {
                            field: "order_source",
                            question: "ဘယ်လို ဝယ်တာလဲ? 🛍️\n\n1️⃣ 📺 Live မှာ ကြည့်ပြီး ဝယ်တာ\n2️⃣ 🖼️ Post/Story မှာ မြင်တာ\n3️⃣ 🔗 Link မှ လာတာ",
                            options: [
                                { label: "Live", value: "Live" },
                                { label: "Post", value: "Post" },
                                { label: "Link", value: "Link" }
                            ]
                        },
                        { field: "item_name", question: "ဝယ်ချင်သည့် ပစ္စည်းအမည် ရေးပေးပါ ✏️" },
                        {
                            field: "confirmation",
                            question: "ပစ္စည်း အတည်ပြုပေးပါ ✅",
                            options: [
                                { label: "ဝယ်မည်", value: "Yes" },
                                { label: "မှားနေသည် (ပြန်ရိုက်မည်)", value: "No" }
                            ]
                        },
                        {
                            field: "size",
                            question: "အရွယ်အစား (Size) ရွေးပေးပါ 📏",
                            options: [
                                { label: "S", value: "S" },
                                { label: "M", value: "M" },
                                { label: "L", value: "L" },
                                { label: "XL", value: "XL" },
                                { label: "မရှိပါ", value: "-" }
                            ]
                        },
                        {
                            field: "color",
                            question: "အရောင် (Color) ရွေးပေးပါ 🎨",
                            options: [
                                { label: "အဖြူ", value: "White" },
                                { label: "အမည်း", value: "Black" },
                                { label: "အနီ", value: "Red" },
                                { label: "အပြာ", value: "Blue" },
                                { label: "မရှိပါ", value: "-" }
                            ]
                        },
                        { field: "quantity", question: "အရေအတွက် မည်မျှ လိုချင်လဲ? 🔢" },
                        {
                            field: "delivery",
                            question: "ပစ္စည်း ဘယ်လို ရချင်လဲ? 🚚\n\n1️⃣ 🚚 Delivery (ပို့ပေးမယ်)\n2️⃣ 🏪 Self Pickup (ကိုယ်တိုင်လာယူ)",
                            options: [
                                { label: "Delivery", value: "Delivery" },
                                { label: "Pickup", value: "Pickup" }
                            ]
                        },
                        { field: "address", question: "ပို့ပေးရမည့် လိပ်စာ အပြည့်အစုံ ထည့်ပေးပါ 📍" },
                        { field: "full_name", question: "သင်၏ အမည်အပြည့်အစုံ ထည့်ပေးပါ 👤" },
                        { field: "phone", question: "ဆက်သွယ်ရန် ဖုန်းနံပါတ် ထည့်ပေးပါ 📞" },
                        { field: "notes", question: "KPay, Wave Money တို့ဖြင့် ငွေလွှဲမည်ဆိုပါက Payment Note ရေးပေးပါ" }
                    ]
                },
                {
                    merchant_id: merchantId,
                    name: "💰 Price Inquiry Flow",
                    business_type: "online_shop",
                    trigger_keyword: "price",
                    description: "Handles product pricing questions",
                    is_active: true,
                    steps: [
                        { field: "item_name", question: "ဈေးနှုန်းသိလိုသည့် ပစ္စည်းအမည် ရေးပေးပါ ✏️" }
                    ]
                }
            ]);
        }

        console.log(`✅ Default flows seeded successfully for ${merchantId} (${businessType})`);
    } catch (error) {
        console.error("❌ Error seeding default flows:", error);
        // Don't throw - we don't want to break the whole registration if seeding fails
    }
}
