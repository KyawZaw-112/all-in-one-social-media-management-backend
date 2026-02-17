import { supabaseAdmin } from "../supabaseAdmin.js";

export async function runConversationEngine(
    conversation: any,
    messageText: string,
    merchant: any
) {
    const step = conversation.current_step;
    const temp = conversation.temp_data || {};
    const text = messageText.trim();

    switch (step) {

        case "ASK_PRODUCT":
            return {
                reply: "အရေအတွက် ဘယ်လောက်လိုပါသလဲ?",
                nextStep: "ASK_QTY",
                save: { product: text }
            };

        case "ASK_QTY":
            return {
                reply: "ပို့မည့် လိပ်စာရေးပေးပါ။",
                nextStep: "ASK_ADDRESS",
                save: { qty: text }
            };

        case "ASK_ADDRESS":

            // Cargo business skip payment
            if (merchant.business_type === "cargo") {
                return {
                    reply: "Order လက်ခံပြီးပါပြီ ✅",
                    nextStep: "DONE",
                    save: { address: text }
                };
            }

            return {
                reply: "ငွေလွှဲ / COD ဘယ်ဟာရွေးမလဲ?",
                nextStep: "ASK_PAYMENT",
                save: { address: text }
            };

        case "ASK_PAYMENT":
            return {
                reply: "Reference Number ပေးပါ။",
                nextStep: "ASK_REFERENCE",
                save: { payment_method: text }
            };

        case "ASK_REFERENCE":
            return {
                reply: "Reference လက်ခံပြီးပါပြီ။ စစ်ဆေးနေပါသည်။",
                nextStep: "DONE",
                save: { reference: text }
            };
        default:
            return {
                reply: "Product အမည် ပေးပါ။",
                nextStep: "ASK_PRODUCT",
                save: {}
            };

    }

}
