import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Seed default automation flows for Online Shop and Cargo businesses
 * Run this script once to create pre-configured flows
 */

const DEFAULT_FLOWS = {
    online_shop: [
        {
            name: '🛍️ Product Order Flow',
            trigger_keyword: 'order',
            business_type: 'online_shop',
            description: 'Helps customers place product orders',
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
            name: '💰 Price Inquiry Flow',
            trigger_keyword: 'price',
            business_type: 'online_shop',
            description: 'Handles product pricing questions',
            is_active: false,
            steps: [
                { field: "item_name", question: "ဈေးနှုန်းသိလိုသည့် ပစ္စည်းအမည် ရေးပေးပါ ✏️" }
            ]
        }
    ],
    cargo: [
        {
            name: '📦 New Shipment Flow',
            trigger_keyword: 'ship',
            business_type: 'cargo',
            description: 'Collects information for new shipments',
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
        }
    ]
};

async function seedDefaultFlows(merchantId: string) {
    console.log(`🌱 Seeding default automation flows for merchant: ${merchantId}`);

    const allFlows = [...DEFAULT_FLOWS.online_shop, ...DEFAULT_FLOWS.cargo];

    for (const flowTemplate of allFlows) {
        const { data, error } = await supabaseAdmin
            .from('automation_flows')
            .insert({
                merchant_id: merchantId,
                name: flowTemplate.name,
                trigger_keyword: flowTemplate.trigger_keyword,
                business_type: flowTemplate.business_type,
                description: flowTemplate.description,
                is_active: flowTemplate.is_active,
                steps: flowTemplate.steps,
                ai_prompt: null,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error(`❌ Error creating flow "${flowTemplate.name}": ${error.message}`);
        } else {
            console.log(`✅ Created flow: ${flowTemplate.name}`);
        }
    }

    console.log('✨ Seeding complete!');
}

// Export for use in other scripts
export { seedDefaultFlows, DEFAULT_FLOWS };

// Allow running directly from command line
// Usage: node seed_default_flows.js <merchant_id>
if (process.argv[2]) {
    const merchantId = process.argv[2];
    seedDefaultFlows(merchantId)
        .then(() => {
            console.log('🎉 Done!');
            process.exit(0);
        })
        .catch((err) => {
            console.error('💥 Error:', err);
            process.exit(1);
        });
}
