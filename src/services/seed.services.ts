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
                name: "📦 New Shipment Flow",
                business_type: "cargo",
                trigger_keyword: "ship",
                description: "Collects information for new shipments",
                is_active: false,
                steps: [
                    { field: "country", question: "ပစ္စည်း ဘယ်နိုင်ငံကနေ ပို့မှာလဲ? 🌏", options: [{ label: "တရုတ်", value: "တရုတ်" }, { label: "ထိုင်း", value: "ထိုင်း" }, { label: "ဂျပန်", value: "ဂျပန်" }, { label: "အခြား", value: "အခြား" }] },
                    { field: "shipping", question: "ပို့ဆောင်မှု အမျိုးအစား ရွေးပါ ✈️🚢", options: [{ label: "လေကြောင်း", value: "လေကြောင်း" }, { label: "Express", value: "Express" }] },
                    { field: "item_type", question: "ပစ္စည်းအမျိုးအစား ရွေးပေးပါ 📦", options: [{ label: "Electronics", value: "Electronics" }, { label: "အဝတ်အထည်", value: "အဝတ်အထည်" }, { label: "Cosmetics", value: "Cosmetics" }, { label: "General", value: "General" }] },
                    { field: "item_name", question: "ပစ္စည်းအမည် ရေးပေးပါ ✏️" },
                    { field: "weight", question: "ပစ္စည်းအလေးချိန် မည်မျှလဲ? ⚖️" },
                    { field: "item_photos", type: "media", requiredCount: 5, question: "ပစ္စည်းရဲ့ ပုံ ၅ ပုံ ပို့ပေးပါခင်ဗျာ 📸" },
                    { field: "full_name", question: "သင်၏ အမည်အပြည့်အစုံ ထည့်ပေးပါ 👤" },
                    { field: "phone", question: "ဆက်သွယ်ရန် ဖုန်းနံပါတ် ထည့်ပေးပါ 📞" },
                    { field: "address", question: "ပစ္စည်းရောက်ရှိမည့် လိပ်စာ ထည့်ပေးပါ 📍" }
                ]
            });
        } else {
            // Online Shop: Product order flow + price inquiry
            await supabaseAdmin.from("automation_flows").insert([
                {
                    merchant_id: merchantId,
                    name: "🛍️ Product Order Flow",
                    business_type: "online_shop",
                    trigger_keyword: "order",
                    description: "Helps customers place product orders",
                    is_active: false,
                    steps: [
                        { field: "order_source", question: "ဘယ်လို ဝယ်တာလဲ? 🛍️", options: [{ label: "Live", value: "Live" }, { label: "Post", value: "Post" }, { label: "Link", value: "Link" }] },
                        { field: "item_name", question: "ဝယ်ချင်သည့် ပစ္စည်းအမည် ရေးပေးပါ ✏️" },
                        { field: "confirmation", question: "ပစ္စည်း အတည်ပြုပေးပါ ✅", options: [{ label: "ဝယ်မည်", value: "Yes" }, { label: "မှားနေသည် (ပြန်ရိုက်မည်)", value: "No" }] },
                        { field: "size", question: "အရွယ်အစား (Size) ရွေးပေးပါ 📏" },
                        { field: "color", question: "အရောင် (Color) ရွေးပေးပါ 🎨" },
                        { field: "quantity", question: "အရေအတွက် မည်မျှ လိုချင်လဲ? 🔢" },
                        { field: "delivery", question: "ပစ္စည်း ဘယ်လို ရချင်လဲ? 🚚", options: [{ label: "Delivery", value: "Delivery" }, { label: "Pickup", value: "Pickup" }] },
                        { field: "address", question: "ပို့ပေးရမည့် လိပ်စာ အပြည့်အစုံ ထည့်ပေးပါ 📍" },
                        { field: "full_name", question: "သင်၏ အမည်အပြည့်အစုံ ထည့်ပေးပါ 👤" },
                        { field: "phone", question: "ဆက်သွယ်ရန် ဖုန်းနံပါတ် ထည့်ပေးပါ 📞" },
                        { field: "notes", question: "Payment Note သို့မဟုတ် မှတ်ချက် ရေးပေးပါ" }
                    ]
                },
                {
                    merchant_id: merchantId,
                    name: "💰 Price Inquiry Flow",
                    business_type: "online_shop",
                    trigger_keyword: "price",
                    description: "Handles product pricing questions",
                    is_active: false,
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
