import { supabaseAdmin } from "../supabaseAdmin.js";
/**
 * Seed default automation flows based on business type
 * Only seeds flows that match the merchant's business type
 */
export async function seedDefaultFlows(merchantId, businessType) {
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
            // Cargo: Single Shipment booking flow
            await supabaseAdmin.from("automation_flows").insert({
                merchant_id: merchantId,
                name: "📦 Cargo Booking Flow",
                business_type: "cargo",
                trigger_keyword: "cargo, order, booking",
                description: "Cargo ပစ္စည်း ပို့ဆောင်မှုများကို အလိုအလျောက် ကိုင်တွယ်ပေးမည့် flow",
                is_active: true,
                steps: [], // Use code-based premium defaults
                metadata: {
                    welcome_message: "မင်္ဂလာပါ {{senderName}}၊ {{pageName}} မှ ကြိုဆိုပါတယ်ခင်ဗျာ။ Cargo အသစ် ပို့ဆောင်ရန်အတွက် အောက်ပါအတိုင်း ဖြည့်စွက်ပေးပါရန် မေတ္တာရပ်ခံအပ်ပါသည်။ 🙏",
                    completion_message: "ကျေးဇူးတင်ပါတယ်ခင်ဗျာ။ လူကြီးမင်း၏ Cargo ပစ္စည်းမှာယူမှု အမှတ်မှာ {{orderNo}} ဖြစ်ပါတယ်။ မကြာခင် ကျွန်တော်တို့ဘက်မှ အကြောင်းပြန်ပေးပါမည်။ 🙏"
                }
            });
        }
        else {
            // Online Shop: Single Product order flow that handles everything
            await supabaseAdmin.from("automation_flows").insert([
                {
                    merchant_id: merchantId,
                    name: "🛍️ Product Order Flow",
                    business_type: "online_shop",
                    trigger_keyword: "order, buy, price, ဈေးနှုန်း",
                    description: "Product မှာယူမှုများကို အလိုအလျောက် ကိုင်တွယ်ပေးမည့် flow",
                    is_active: true,
                    steps: [], // Use code-based premium defaults
                    metadata: {
                        welcome_message: "မင်္ဂလာပါ {{senderName}}၊ {{pageName}} မှ ကြိုဆိုပါတယ်ခင်ဗျာ။ လူကြီးမင်း ဝယ်ယူလိုသည့် ပစ္စည်းလေးများရှိလျှင် အောက်ပါအတိုင်း ဖြည့်စွက်ပေးပါရန် မေတ္တာရပ်ခံအပ်ပါသည်။ 🙏",
                        completion_message: "ကျေးဇူးတင်ပါတယ်ခင်ဗျာ။ လူကြီးမင်းမှာယူမှု အမှတ်မှာ {{orderNo}} ဖြစ်ပါတယ်။ အော်ဒါတင်ခြင်း အောင်မြင်သွားပါပြီ။ လူကြီးမင်းရဲ့ အချက်အလက်များ - {{full_name}}, {{phone}}, {{address}} ကို မှတ်သားထားပြီး ဖြစ်ပါတယ်။ ခဏနေလျှင် ကျွန်တော်တို့ဘက်မှ အကြောင်းပြန်ပေးပါမည်။ 🙏"
                    }
                }
            ]);
        }
        console.log(`✅ Default flows seeded successfully for ${merchantId} (${businessType})`);
    }
    catch (error) {
        console.error("❌ Error seeding default flows:", error);
        // Don't throw - we don't want to break the whole registration if seeding fails
    }
}
