import { supabaseAdmin } from "../supabaseAdmin.js";

/**
 * Rule-based Conversation Engine
 * Supports: Online Live Sale Bot Flow & Cargo Bot Flow
 * Features: Button choices, branching, rich Burmese messages, auto order numbers
 */

// ─── Step Type Definitions ───────────────────────────────────────
interface FlowStep {
    field: string;
    question: string;
    validation?: (value: string) => boolean;
    transform?: (value: string) => any;
    skipIf?: (tempData: Record<string, any>) => boolean;  // conditional skip
    options?: { label: string; value: string }[];          // button choices
}

interface ConversationFlowDef {
    steps: FlowStep[];
    completionMessage: (tempData: Record<string, any>, orderNo: string) => string;
    incompleteMessage: string;
}

// ─── ONLINE SHOP FLOW (Live Sale Bot) ────────────────────────────
const ONLINE_SHOP_FLOW: ConversationFlowDef = {
    steps: [
        {
            field: "order_source",
            question:
                "ဘယ်လို ဝယ်တာလဲ? 🛍️\n\n" +
                "1️⃣ 📺 Live မှာ ကြည့်ပြီး ဝယ်တာ\n" +
                "2️⃣ 🖼️ Post/Story မှာ မြင်တာ\n" +
                "3️⃣ 🔗 Link မှ လာတာ",
            options: [
                { label: "Live", value: "Live" },
                { label: "Post", value: "Post" },
                { label: "Link", value: "Link" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 3) ||
                    ["live", "post", "link"].includes(v.toLowerCase().trim());
            },
            transform: (v) => {
                const n = parseInt(v);
                const map: Record<number, string> = { 1: "Live", 2: "Post", 3: "Link" };
                if (map[n]) return map[n];
                const lower = v.toLowerCase().trim();
                if (lower.includes("live")) return "Live";
                if (lower.includes("post") || lower.includes("story")) return "Post";
                if (lower.includes("link")) return "Link";
                return v;
            },
        },
        {
            field: "item_name",
            question:
                "ဝယ်ချင်သည့် ပစ္စည်းအမည် ရေးပေးပါ ✏️\n\n" +
                "ဥပမာ:\n" +
                '- "အနီရောင် အကျီ Size M × 2"\n' +
                '- "Item No.5 × 1"\n' +
                '- "Live မှာ ပြတဲ့ ဖိနပ် × 1"',
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "item_variant",
            question:
                "အရောင်နဲ့ အရွယ်အစား ရွေးပေးပါ 🎨\n\n" +
                '(မသိပါက "Admin ဆုံးဖြတ်ပါ" ဟု ရိုက်ပါ)',
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "quantity",
            question: "အရေအတွက် မည်မျှ လိုချင်လဲ? 🔢",
            validation: (v) => !isNaN(parseInt(v)) && parseInt(v) > 0,
            transform: (v) => parseInt(v),
        },
        {
            field: "delivery",
            question:
                "ပစ္စည်း ဘယ်လို ရချင်လဲ? 🚚\n\n" +
                "1️⃣ 🚚 Delivery (ပို့ပေးမယ်)\n" +
                "2️⃣ 🏪 Self Pickup (ကိုယ်တိုင်လာယူ)",
            options: [
                { label: "Delivery", value: "Delivery" },
                { label: "Pickup", value: "Pickup" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 2) ||
                    ["delivery", "pickup", "ပို့", "ယူ", "self"].some(k => v.toLowerCase().includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                if (n === 1) return "Delivery";
                if (n === 2) return "Pickup";
                const lower = v.toLowerCase();
                if (lower.includes("delivery") || lower.includes("ပို့")) return "Delivery";
                return "Pickup";
            },
        },
        {
            field: "address",
            question:
                "ပို့ပေးရမည့် လိပ်စာ ထည့်ပေးပါ 📍\n" +
                "(အိမ်အမှတ်၊ လမ်း၊ မြို့နယ်၊ တိုင်းဒေသကြီး)",
            validation: (v) => v.trim().length > 3,
            skipIf: (tempData) => tempData.delivery === "Pickup",
        },
        {
            field: "full_name",
            question: "သင်၏ အမည်အပြည့်အစုံ ထည့်ပေးပါ 👤",
            validation: (v) => v.trim().length > 1,
        },
        {
            field: "phone",
            question: "ဆက်သွယ်ရန် ဖုန်းနံပါတ် ထည့်ပေးပါ 📞",
            validation: (v) => v.replace(/[\s\-]/g, '').length >= 6,
        },
        {
            field: "payment",
            question:
                "ငွေပေးချေနည်း ရွေးပါ 💳\n\n" +
                "1️⃣ 📱 KPay\n" +
                "2️⃣ 📱 Wave Pay\n" +
                "3️⃣ 🏦 Bank Transfer\n" +
                "4️⃣ 💵 COD (လက်ခံပြီးမှပေး)",
            options: [
                { label: "KPay", value: "KPay" },
                { label: "WavePay", value: "WavePay" },
                { label: "Bank", value: "Bank Transfer" },
                { label: "COD", value: "COD" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 4) ||
                    ["kpay", "wave", "bank", "cod", "ငွေ", "လွှဲ"].some(k => v.toLowerCase().includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                const map: Record<number, string> = { 1: "KPay", 2: "WavePay", 3: "Bank Transfer", 4: "COD" };
                if (map[n]) return map[n];
                const lower = v.toLowerCase();
                if (lower.includes("kpay")) return "KPay";
                if (lower.includes("wave")) return "WavePay";
                if (lower.includes("bank") || lower.includes("ဘဏ်")) return "Bank Transfer";
                if (lower.includes("cod") || lower.includes("လက်ခံ")) return "COD";
                return v;
            },
        },
    ],
    completionMessage: (d, orderNo) => {
        const pickupMsg = d.delivery === "Pickup"
            ? "✅ Self Pickup ရွေးချယ်ထားပါသည်\n📍 ဆိုင်လိပ်စာ Admin မှ ဆက်သွယ်ပေးပါမည်"
            : `📍 လိပ်စာ      : ${d.address}`;

        let summary =
            "🎉 Order လက်ခံပြီးပါပြီ!\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            "🛍️ ORDER အချက်အလက်\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `📌 Order No    : #${orderNo}\n` +
            `📺 မှာယူမှုနည်း  : ${d.order_source}\n` +
            `📝 ပစ္စည်း      : ${d.item_name}\n` +
            `🎨 အရောင်/Size  : ${d.item_variant}\n` +
            `🔢 အရေအတွက်   : ${d.quantity}\n` +
            `🚚 ပို့ဆောင်မှု  : ${d.delivery}\n` +
            `${pickupMsg}\n` +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `👤 နာမည်       : ${d.full_name}\n` +
            `📞 ဖုန်း       : ${d.phone}\n` +
            `💳 ငွေပေးချေ   : ${d.payment}\n` +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `⏰ တုံ့ပြန်ချိန်: ၁-၂ နာရီ (ရုံးချိန်)\n`;

        if (d.payment === "COD") {
            summary +=
                "\n✅ COD Order အတည်ပြုပြီးပါပြီ\n" +
                "ပစ္စည်းရောက်မှ ငွေပေးဆောင်ပါ 💵\n" +
                "Delivery ကြေး သီးခြားပါမည်";
        } else {
            summary +=
                "\n💳 Admin မှ ငွေလွှဲရမည့် Account No\n" +
                "ဆက်သွယ်ပေးပါမည် 🙏\n" +
                "⚠️ ငွေလွှဲပြီးပါက Screenshot ပို့ပေးပါ";
        }

        return summary;
    },
    incompleteMessage: "📝 ဆက်ဖြေပေးပါ။ Please continue...",
};

// ─── CARGO FLOW ──────────────────────────────────────────────────
const CARGO_FLOW: ConversationFlowDef = {
    steps: [
        {
            field: "country",
            question:
                "ပစ္စည်း ဘယ်နိုင်ငံကနေ ပို့မှာလဲ? 🌏\n\n" +
                "1️⃣ 🇨🇳 တရုတ်\n" +
                "2️⃣ 🇹🇭 ထိုင်း\n" +
                "3️⃣ 🇯🇵 ဂျပန်\n" +
                "4️⃣ 🌍 အခြား",
            options: [
                { label: "တရုတ်", value: "တရုတ်" },
                { label: "ထိုင်း", value: "ထိုင်း" },
                { label: "ဂျပန်", value: "ဂျပန်" },
                { label: "အခြား", value: "အခြား" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 4) ||
                    ["တရုတ်", "ထိုင်း", "ဂျပန်", "china", "thai", "japan"].some(k => v.toLowerCase().includes(k)) ||
                    v.trim().length > 0;
            },
            transform: (v) => {
                const n = parseInt(v);
                const map: Record<number, string> = { 1: "တရုတ်", 2: "ထိုင်း", 3: "ဂျပန်", 4: "အခြား" };
                if (map[n]) return map[n];
                const lower = v.toLowerCase();
                if (lower.includes("တရုတ်") || lower.includes("china")) return "တရုတ်";
                if (lower.includes("ထိုင်း") || lower.includes("thai")) return "ထိုင်း";
                if (lower.includes("ဂျပန်") || lower.includes("japan")) return "ဂျပန်";
                return "အခြား";
            },
        },
        {
            field: "shipping",
            question:
                "ပို့ဆောင်မှု အမျိုးအစား ရွေးပါ ✈️🚢\n\n" +
                "1️⃣ ✈️ လေကြောင်း\n" +
                "2️⃣ 🚢 ရေကြောင်း\n" +
                "3️⃣ ⚡ Express",
            options: [
                { label: "လေကြောင်း", value: "လေကြောင်း" },
                { label: "ရေကြောင်း", value: "ရေကြောင်း" },
                { label: "Express", value: "Express" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 3) ||
                    ["လေ", "ရေ", "express", "air", "sea"].some(k => v.toLowerCase().includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                const map: Record<number, string> = { 1: "လေကြောင်း", 2: "ရေကြောင်း", 3: "Express" };
                if (map[n]) return map[n];
                const lower = v.toLowerCase();
                if (lower.includes("လေ") || lower.includes("air")) return "လေကြောင်း";
                if (lower.includes("ရေ") || lower.includes("sea")) return "ရေကြောင်း";
                if (lower.includes("express")) return "Express";
                return v;
            },
        },
        {
            field: "item_type",
            question:
                "ပစ္စည်းအမျိုးအစား ရွေးပေးပါ 📦\n\n" +
                "1️⃣ 📱 Electronics\n" +
                "2️⃣ 👗 အဝတ်အထည်\n" +
                "3️⃣ 🧴 Cosmetics\n" +
                "4️⃣ 🍜 အစားအသောက်\n" +
                "5️⃣ 🔧 စက်ပစ္စည်း\n" +
                "6️⃣ 📦 General",
            options: [
                { label: "Electronics", value: "Electronics" },
                { label: "အဝတ်အထည်", value: "အဝတ်အထည်" },
                { label: "Cosmetics", value: "Cosmetics" },
                { label: "အစားအသောက်", value: "အစားအသောက်" },
                { label: "စက်ပစ္စည်း", value: "စက်ပစ္စည်း" },
                { label: "General", value: "General" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 6) || v.trim().length > 0;
            },
            transform: (v) => {
                const n = parseInt(v);
                const map: Record<number, string> = {
                    1: "Electronics", 2: "အဝတ်အထည်", 3: "Cosmetics",
                    4: "အစားအသောက်", 5: "စက်ပစ္စည်း", 6: "General"
                };
                if (map[n]) return map[n];
                return v;
            },
        },
        {
            field: "item_name",
            question:
                "ပစ္စည်းအမည် ရေးပေးပါ ✏️\n" +
                "(ဥပမာ - iPhone 15 × 2, အကျီ × 10)",
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "weight",
            question:
                "ပစ္စည်းအလေးချိန် မည်မျှလဲ? ⚖️\n" +
                "(ဥပမာ - 2kg, 500g)\n" +
                'မသိသေးပါက "မသိ" ဟု ရိုက်ပါ',
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "item_value",
            question:
                "ပစ္စည်းတန်ဖိုး မည်မျှလဲ? 💰\n" +
                "(ဥပမာ - 50 USD / 1500 CNY)\n" +
                "ကြေညာရန် လိုအပ်ပါသည်",
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "full_name",
            question: "သင်၏ အမည်အပြည့်အစုံ ထည့်ပေးပါ 👤",
            validation: (v) => v.trim().length > 1,
        },
        {
            field: "phone",
            question:
                "ဆက်သွယ်ရန် ဖုန်းနံပါတ် ထည့်ပေးပါ 📞\n" +
                "(Viber ပါသော နံပါတ် ဖြစ်ပါက ပိုကောင်းပါသည်)",
            validation: (v) => v.replace(/[\s\-]/g, '').length >= 6,
        },
        {
            field: "address",
            question:
                "ပစ္စည်းရောက်ရှိမည့် လိပ်စာ ထည့်ပေးပါ 📍\n" +
                "(မြို့နယ် / တိုင်းဒေသကြီးပါ ထည့်ပေးပါ)",
            validation: (v) => v.trim().length > 3,
        },
    ],
    completionMessage: (d, refNo) => {
        return (
            "ကျေးဇူးတင်ပါတယ် 🙏\n" +
            "သင်၏ Cargo Request လက်ခံပြီးပါပြီ။\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            "📋 CARGO အချက်အလက်\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `📌 Ref No      : #${refNo}\n` +
            `🌏 နိုင်ငံ      : ${d.country}\n` +
            `🚢 ပို့ဆောင်မှု  : ${d.shipping}\n` +
            `📦 အမျိုးအစား  : ${d.item_type}\n` +
            `📝 ပစ္စည်း     : ${d.item_name}\n` +
            `⚖️ အလေးချိန်  : ${d.weight}\n` +
            `💰 တန်ဖိုး    : ${d.item_value}\n` +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `👤 နာမည်      : ${d.full_name}\n` +
            `📞 ဖုန်း      : ${d.phone}\n` +
            `📍 လိပ်စာ     : ${d.address}\n` +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `⏰ တုံ့ပြန်ချိန်  : ၁-၂ နာရီ (ရုံးချိန်အတွင်း)\n\n` +
            "Admin မှ Viber/Messenger ဖြင့်\nဆက်သွယ်ပေးပါမည်။ ကျေးဇူးတင်ပါသည် 😊"
        );
    },
    incompleteMessage: "📝 ဆက်ဖြေပေးပါ။ Please continue...",
};

// ─── DEFAULT TEMPLATE ────────────────────────────────────────────
const DEFAULT_FLOW: ConversationFlowDef = {
    steps: [
        {
            field: "message_content",
            question:
                "သင့်မက်ဆေ့ချ် လက်ခံပြီးပါပြီ။\n" +
                "Admin မှ မကြာခင် ပြန်လည်ဆက်သွယ်ပါမယ်။ 🙏",
            validation: () => true,
        },
    ],
    completionMessage: () => "✅ ကျေးဇူးတင်ပါတယ်။ Thank you! 🙏",
    incompleteMessage: "📝 ဆက်ဖြေပေးပါ။",
};

// ─── Flow Registry ───────────────────────────────────────────────
const CONVERSATION_FLOWS: Record<string, ConversationFlowDef> = {
    online_shop: ONLINE_SHOP_FLOW,
    cargo: CARGO_FLOW,
    default: DEFAULT_FLOW,
};

// ─── Welcome Messages ───────────────────────────────────────────
export function getWelcomeMessage(businessType: string, senderName?: string, pageName?: string): string {
    const greeting = senderName ? `မင်္ဂလာပါ ${senderName} ခင်ဗျာ 🙏` : "မင်္ဂလာပါခင်ဗျာ 🙏";
    const shop = pageName ? `${pageName} မှ ကြိုဆိုပါတယ်။` : "ကြိုဆိုပါတယ်။";

    if (businessType === "cargo") {
        return (
            `${greeting}\n` +
            `${shop}\n\n` +
            "✅ တရုတ် → မြန်မာ\n" +
            "✅ ထိုင်း → မြန်မာ\n" +
            "✅ ဂျပန် → မြန်မာ\n\n" +
            "Cargo အသစ် ပို့ရန် စတင်ပါမည် 📦"
        );
    }
    return (
        `${greeting}\n` +
        `${shop}\n\n` +
        "🛍️ Live Sale မှာ ဝယ်ယူသည့်အတွက်\n" +
        "ကျေးဇူးတင်ပါသည် 💖\n\n" +
        "Order စတင်ပါမည်..."
    );
}

// ─── Default Reply for unmatched messages ────────────────────────
export function getDefaultReply(): string {
    return (
        "ဝမ်းနည်းပါတယ်၊ သင့် Message ကို\n" +
        "နားမလည်ပါ 😅\n\n" +
        "ကျေးဇူးပြုပြီး trigger keyword\n" +
        "(ဥပမာ: order, buy, cargo)\n" +
        "ဖြင့် စတင်ပေးပါ 🙏"
    );
}

// ─── Generate Order / Reference Number ───────────────────────────
function generateOrderNumber(businessType: string): string {
    const random = Math.floor(100000 + Math.random() * 900000);
    if (businessType === "cargo") return `CG${random}`;
    return `LS${random}`;
}

// ─── Get Active Steps (respecting skipIf) ────────────────────────
function getActiveSteps(steps: FlowStep[], tempData: Record<string, any>): FlowStep[] {
    return steps.filter(step => {
        if (step.skipIf && step.skipIf(tempData)) return false;
        return true;
    });
}

// ─── Main Engine ─────────────────────────────────────────────────
export async function runConversationEngine(
    conversation: any,
    messageText: string,
    flow: any,
    isResuming: boolean = true
) {
    const tempData = conversation.temp_data || {};
    const businessType = flow.business_type || 'default';
    const flowDef = CONVERSATION_FLOWS[businessType] || DEFAULT_FLOW;

    // Get steps that are active (respect skipIf with current data)
    const activeSteps = getActiveSteps(flowDef.steps, tempData);

    // Find the current step (first step without data)
    let currentStepIndex = 0;
    for (let i = 0; i < activeSteps.length; i++) {
        if (!tempData[activeSteps[i].field]) {
            currentStepIndex = i;
            break;
        }
    }

    const currentStep = activeSteps[currentStepIndex];

    // If resuming (not a new trigger), validate and save the user's answer
    if (isResuming && currentStep && !tempData[currentStep.field]) {
        const isValid = currentStep.validation ? currentStep.validation(messageText) : true;

        if (!isValid) {
            const errorReply =
                "❌ မှားယွင်းနေပါသည်။ ပြန်လည်ရိုက်ပေးပါ။\n\n" +
                currentStep.question;

            await saveReplyMessage(conversation, flow, errorReply);

            return {
                reply: errorReply,
                temp_data: tempData,
                order_complete: false,
                business_type: businessType,
            };
        }

        // Transform and save
        const transformedValue = currentStep.transform
            ? currentStep.transform(messageText)
            : messageText;

        tempData[currentStep.field] = transformedValue;
    }

    // After saving, re-evaluate active steps (skipIf may change based on new data)
    const updatedActiveSteps = getActiveSteps(flowDef.steps, tempData);

    // Auto-skip steps that should be skipped and fill default values
    for (const step of flowDef.steps) {
        if (step.skipIf && step.skipIf(tempData) && !tempData[step.field]) {
            // Set a default value for skipped steps
            if (step.field === "address" && tempData.delivery === "Pickup") {
                tempData[step.field] = "Self Pickup";
            }
        }
    }

    // Save updated temp_data to DB
    await supabaseAdmin
        .from("conversations")
        .update({ temp_data: tempData })
        .eq("id", conversation.id);

    // Check if all active steps are completed
    const allComplete = updatedActiveSteps.every(step => tempData[step.field] !== undefined);

    let reply: string;
    let isComplete = false;

    if (allComplete) {
        // Generate order/reference number
        const orderNo = generateOrderNumber(businessType);

        reply = flowDef.completionMessage(tempData, orderNo);
        isComplete = true;

        // Store the order number in temp_data for downstream
        tempData._order_no = orderNo;

        await supabaseAdmin
            .from("conversations")
            .update({ temp_data: tempData })
            .eq("id", conversation.id);
    } else {
        // Find next unanswered step
        const nextStep = updatedActiveSteps.find(step => !tempData[step.field]);

        if (nextStep) {
            const completedCount = updatedActiveSteps.filter(s => tempData[s.field] !== undefined).length;
            const totalCount = updatedActiveSteps.length;
            const progress = `📊 ${completedCount}/${totalCount}`;

            reply = `${progress}\n\n${nextStep.question}`;
        } else {
            reply = flowDef.incompleteMessage;
        }
    }

    // Save assistant reply
    await saveReplyMessage(conversation, flow, reply);

    return {
        reply,
        temp_data: tempData,
        order_complete: isComplete,
        business_type: businessType,
    };
}

// ─── Helper: Save reply message ──────────────────────────────────
async function saveReplyMessage(conversation: any, flow: any, reply: string) {
    await supabaseAdmin.from("messages").insert({
        user_id: flow.merchant_id || conversation.merchant_id,
        sender_id: flow.merchant_id || conversation.merchant_id,
        sender_email: "AI-Assistant",
        sender_name: "Auto-Reply Bot",
        body: reply,
        channel: "facebook",
        status: "replied",
        created_at: new Date().toISOString(),
        conversation_id: conversation.id,
        metadata: { conversation_id: conversation.id },
    });
}
