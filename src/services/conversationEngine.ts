import { supabaseAdmin } from "../supabaseAdmin.js";

/**
 * Rule-based Conversation Engine (No AI Required!)
 * Uses predefined templates and step-by-step flows
 */

// Business type templates for step-by-step conversations
const CONVERSATION_FLOWS = {
    online_shop: {
        steps: [
            {
                field: "product_name",
                question: "ဘာပစ္စည်း မှာချင်ပါသလဲ? What product would you like to order?",
                validation: (value: string) => value.length > 0,
            },
            {
                field: "quantity",
                question: "ဘယ်နှစ်ခု လိုချင်ပါသလဲ? How many would you like?",
                validation: (value: string) => !isNaN(parseInt(value)) && parseInt(value) > 0,
                transform: (value: string) => parseInt(value),
            },
            {
                field: "delivery_address",
                question: "ပို့ဆောင်ရမည့် လိပ်စာကို ပေးပါ။ What's your delivery address?",
                validation: (value: string) => value.length > 5,
            },
            {
                field: "phone_number",
                question: "ဖုန်းနံပါတ် ပေးပါ။ Please provide your phone number.",
                validation: (value: string) => /^09\d{7,9}$/.test(value.replace(/\s/g, '')),
            },
            {
                field: "payment_method",
                question: "ငွေပေးချေမှု နည်းလမ်း ရွေးချယ်ပါ:\n1️⃣ COD (လက်ငင်းချေ)\n2️⃣ Bank Transfer (ဘဏ်လွှဲ)\n3️⃣ Mobile Money (KBZ/Wave)\n\nHow would you like to pay?",
                validation: (value: string) => {
                    const lower = value.toLowerCase();
                    return lower.includes('cod') || lower.includes('bank') ||
                        lower.includes('mobile') || lower.includes('kbz') ||
                        lower.includes('wave') || ['1', '2', '3'].includes(value);
                },
                transform: (value: string) => {
                    const lower = value.toLowerCase();
                    if (lower.includes('cod') || value === '1') return 'COD';
                    if (lower.includes('bank') || value === '2') return 'Bank Transfer';
                    if (lower.includes('mobile') || lower.includes('kbz') ||
                        lower.includes('wave') || value === '3') return 'Mobile Money';
                    return value;
                },
            },
        ],
        completionMessage: "✅ မှာယူမှု ပြီးပါပြီ! Your order is complete!\n\nအချက်အလက်:\n{summary}\n\nမကြာခင် ဆက်သွယ်ပါမယ်။ We'll contact you soon! 🎉",
        incompleteMessage: "📝 လက်ရှိ မှာယူမှု အချက်အလက်:\n{summary}\n\nဆက်ဖြေပေးပါ။ Please continue...",
    },
    cargo: {
        steps: [
            {
                field: "package_type",
                question: "ဘာအမျိုးအစား ပို့မှာလဲ?\n1️⃣ စာရွက်စာတမ်း (Document)\n2️⃣ ပါဆယ် (Parcel)\n3️⃣ သေတ္တာ (Box)\n\nWhat type of package?",
                validation: (value: string) => value.length > 0,
                transform: (value: string) => {
                    const lower = value.toLowerCase();
                    if (lower.includes('document') || value === '1') return 'Document';
                    if (lower.includes('parcel') || value === '2') return 'Parcel';
                    if (lower.includes('box') || value === '3') return 'Box';
                    return value;
                },
            },
            {
                field: "weight",
                question: "အလေးချိန် ဘယ်လောက်လဲ? (kg)\nWhat's the weight in kilograms?",
                validation: (value: string) => !isNaN(parseFloat(value)) && parseFloat(value) > 0,
                transform: (value: string) => parseFloat(value),
            },
            {
                field: "pickup_address",
                question: "ဘယ်က ယူရမလဲ? Where should we pick it up from?",
                validation: (value: string) => value.length > 5,
            },
            {
                field: "delivery_address",
                question: "ဘယ်ကို ပို့ရမလဲ? Where should we deliver to?",
                validation: (value: string) => value.length > 5,
            },
            {
                field: "phone_number",
                question: "ဆက်သွယ်ရန် ဖုန်းနံပါတ် ပေးပါ။ Contact phone number?",
                validation: (value: string) => /^09\d{7,9}$/.test(value.replace(/\s/g, '')),
            },
            {
                field: "delivery_urgency",
                question: "ဘယ်အမြန်ပို့မလဲ?\n1️⃣ ပုံမှန် (2-3 ရက်) - Standard\n2️⃣ အမြန် (1 ရက်) - Express\n\nDelivery speed?",
                validation: (value: string) => {
                    const lower = value.toLowerCase();
                    return lower.includes('standard') || lower.includes('express') ||
                        ['1', '2'].includes(value) || lower.includes('ပုံမှန်') ||
                        lower.includes('အမြန်');
                },
                transform: (value: string) => {
                    const lower = value.toLowerCase();
                    if (lower.includes('express') || lower.includes('အမြန်') || value === '2') return 'Express';
                    return 'Standard';
                },
            },
        ],
        completionMessage: "✅ ပို့ဆောင်မှု မှတ်တမ်းတင်ပြီးပါပြီ! Shipment booked!\n\nအချက်အလက်:\n{summary}\n\nTracking Number: SHIP{random}\n\nမကြာခင် ဆက်သွယ်ပါမယ်။ We'll contact you soon! 📦",
        incompleteMessage: "📝 လက်ရှိ ပို့ဆောင်မှု အချက်အလက်:\n{summary}\n\nဆက်ဖြေပေးပါ။ Please continue...",
    },
};

// Default templates for unknown business types
const DEFAULT_TEMPLATE = {
    steps: [
        {
            field: "message_content",
            question: "သင့်မက်ဆေ့ချ် ပို့လိုက်ပါပြီ။ ကျွန်တော်တို့ မကြာခင် ပြန်လည်ဆက်သွယ်ပါမယ်။\n\nYour message has been received. We'll get back to you soon!",
            validation: () => true,
        },
    ],
    completionMessage: "✅ အောင်မြင်ပါတယ်! ကျေးဇူးတင်ပါတယ်။ Thank you! 🙏",
    incompleteMessage: "📝 ဆက်ဖြေပေးပါ။ Please continue...",
};

export async function runConversationEngine(
    conversation: any,
    messageText: string,
    flow: any,
    isResuming: boolean = true
) {
    // Save user message - MATCH PRODUCTION SCHEMA
    // 💡 DEPRECATED: Now handled in webhook controller to catch non-matched messages
    /*
    await supabaseAdmin.from("messages").insert({
        user_id: flow.merchant_id || conversation.merchant_id,
        sender_id: conversation.user_psid,
        sender_email: conversation.user_psid,
        sender_name: "Facebook User",
        body: messageText,
        channel: "facebook",
        status: "received",
        created_at: new Date().toISOString(),
    });
    */

    // Get conversation data
    const tempData = conversation.temp_data || {};
    const businessType = flow.business_type || 'default';
    const conversationFlow = CONVERSATION_FLOWS[businessType as keyof typeof CONVERSATION_FLOWS] || DEFAULT_TEMPLATE;

    // Find current step
    let currentStepIndex = 0;
    for (let i = 0; i < conversationFlow.steps.length; i++) {
        const step = conversationFlow.steps[i];
        if (!tempData[step.field]) {
            currentStepIndex = i;
            break;
        }
    }

    const currentStep = conversationFlow.steps[currentStepIndex];

    // If this is not the first message (it's an answer), validate and save it
    if (isResuming) {
        if (currentStep && !tempData[currentStep.field]) {
            // Validate the message against current step
            const isValid = currentStep.validation ? currentStep.validation(messageText) : true;

            if (!isValid) {
                const errorReply = `❌ မှားယွင်းနေပါသည်။ Invalid input.\n\n${currentStep.question}`;

                await supabaseAdmin.from("messages").insert({
                    user_id: flow.merchant_id || conversation.merchant_id,
                    sender_id: flow.merchant_id || conversation.merchant_id,
                    body: errorReply,
                    channel: "facebook",
                    status: "replied",
                    metadata: { conversation_id: conversation.id, role: "assistant", type: "error" }
                });

                return {
                    reply: errorReply,
                    temp_data: tempData,
                    order_complete: false,
                    business_type: businessType,
                };
            }

            // Transform and save the value
            const transformedValue = currentStep.transform
                ? currentStep.transform(messageText)
                : messageText;

            tempData[currentStep.field] = transformedValue;
        }
    }

    // Update conversation data
    await supabaseAdmin
        .from("conversations")
        .update({ temp_data: tempData })
        .eq("id", conversation.id);

    // Check if all steps are completed
    const allStepsComplete = conversationFlow.steps.every(
        (step) => tempData[step.field] !== undefined
    );

    let reply: string;
    let isComplete = false;

    if (allStepsComplete) {
        // Generate summary
        const summary = conversationFlow.steps
            .map((step) => `• ${step.field}: ${tempData[step.field]}`)
            .join("\n");

        // Generate random tracking number for cargo
        const random = Math.floor(100000 + Math.random() * 900000);

        reply = conversationFlow.completionMessage
            .replace("{summary}", summary)
            .replace("{random}", random.toString());

        isComplete = true;
    } else {
        // Ask next question
        const nextStepIndex = currentStepIndex + (tempData[currentStep?.field] ? 1 : 0);
        const nextStep = conversationFlow.steps[nextStepIndex];

        if (nextStep) {
            // Show progress
            const completedFields = Object.keys(tempData).length;
            const totalFields = conversationFlow.steps.length;
            const progress = `📊 ${completedFields}/${totalFields}`;

            reply = `${progress}\n\n${nextStep.question}`;
        } else {
            reply = conversationFlow.incompleteMessage.replace(
                "{summary}",
                Object.entries(tempData)
                    .map(([key, value]) => `• ${key}: ${value}`)
                    .join("\n")
            );
        }
    }

    // Save assistant reply - MATCH PRODUCTION SCHEMA
    await supabaseAdmin.from("messages").insert({
        user_id: flow.merchant_id || conversation.merchant_id,
        sender_id: flow.merchant_id || conversation.merchant_id,
        sender_email: "AI-Assistant",
        sender_name: "Auto-Reply Bot",
        body: reply,
        channel: "facebook",
        status: "replied",
        created_at: new Date().toISOString(),
        metadata: { conversation_id: conversation.id } // 👈 Store in metadata 
    });

    return {
        reply,
        temp_data: tempData,
        order_complete: isComplete,
        business_type: businessType,
    };
}
