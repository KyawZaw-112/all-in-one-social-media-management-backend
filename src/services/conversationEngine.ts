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
    type?: "text" | "media";
    requiredCount?: number;
    validation?: (value: string, attachments?: any[]) => boolean;
    transform?: (value: string, attachments?: any[]) => any;
    skipIf?: (tempData: Record<string, any>) => boolean;  // conditional skip
    options?: { label: string; value: string }[];          // button choices
}

interface ConversationFlowDef {
    steps: FlowStep[];
    welcomeMessage?: (senderName?: string, pageName?: string) => string;
    completionMessage: (tempData: Record<string, any>, orderNo: string) => string;
    incompleteMessage: string;
}

// ─── ONLINE SHOP FLOW (Live Sale Bot) ────────────────────────────
export const ONLINE_SHOP_FLOW: ConversationFlowDef = {
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
                "ဝယ်ချင်သည့် ပစ္စည်းအမည် ရေးပေးပါ ✏️\n\n",
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "item_variant",
            question:
                "အရောင်နဲ့ အရွယ်အစား ရွေးပေးပါ 🎨",
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
                "ပို့ပေးရမည့် လိပ်စာ အပြည့်အစုံ ထည့်ပေးပါ 📍",
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
            field: "notes",
            question: "KPay, Wave Money တို့ဖြင့် ငွေလွှဲမည်ဆိုပါက Payment Note ရေးပေးပါ",
            validation: (v) => v.trim().length > 0,
        },
    ],
    welcomeMessage: (senderName, pageName) => {
        const greeting = senderName ? `မင်္ဂလာပါ ${senderName} ခင်ဗျာ 🙏` : "မင်္ဂလာပါခင်ဗျာ 🙏";
        const shop = pageName ? `${pageName} မှ ကြိုဆိုပါတယ်။` : "ကြိုဆိုပါတယ်။";
        return (
            `${greeting}\n` +
            `${shop}\n\n` +
            "🛍️ Live Sale မှာ ဝယ်ယူသည့်အတွက်\n" +
            "ကျေးဇူးတင်ပါသည် 💖\n\n" +
            "Order စတင်ပါမည်..."
        );
    },
    completionMessage: (d, orderNo) => {
        const pickupMsg = d.delivery === "Pickup"
            ? "✅ Self Pickup ရွေးချယ်ထားပါသည်\n📍 ဆိုင်လိပ်စာ Admin မှ ဆက်သွယ်ပေးပါမည်"
            : `📍 လိပ်စာ      : ${d.address || "-"}`;

        return (
            "🎉 Order လက်ခံပြီးပါပြီ!\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            "🛍️ ORDER အချက်အလက်\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `📌 Order No    :\n` +
            `#${orderNo}\n` +
            `📺 မှာယူမှုနည်း  : \n` +
            `${d.order_source || "-"}\n` +
            `📝 ပစ္စည်း      : \n` +
            `${d.item_name || "-"}\n` +
            `🎨 အရောင်/Size  : \n` +
            `${d.item_variant || "-"}\n` +
            `🔢 အရေအတွက်   : \n` +
            `${d.quantity || "-"}\n` +
            `🚚 ပို့ဆောင်မှု  : \n` +
            `${d.delivery || "-"}\n` +
            `${pickupMsg}\n` +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `👤 နာမည်       : \n` +
            `${d.full_name || "-"}\n` +
            `📞 ဖုန်း       : \n` +
            `${d.phone || "-"}\n` +
            `📝 Note/KPay  : \n` +
            `${d.notes || "-"}\n` +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `⏰ တုံ့ပြန်ချိန်: ၁-၂ နာရီ (ရုံးချိန်)\n\n` +
            "Admin မှ Viber/Messenger ဖြင့်\nဆက်သွယ်ပေးပါမည်။ ကျေးဇူးတင်ပါသည် 🙏"
        );
    },
    incompleteMessage: "📝 ဆက်ဖြေပေးပါ။ Please continue...",
};

// ─── CARGO FLOW ──────────────────────────────────────────────────
export const CARGO_FLOW: ConversationFlowDef = {
    steps: [
        // ... (remaining steps unchanged)
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
                "2️⃣ ⚡ Express",
            options: [
                { label: "လေကြောင်း", value: "လေကြောင်း" },
                { label: "Express", value: "Express" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 2) ||
                    ["လေ", "ရေ", "express", "air", "sea"].some(k => v.toLowerCase().includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                const map: Record<number, string> = { 1: "လေကြောင်း", 2: "Express" };
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
            field: "item_photos",
            type: "media",
            requiredCount: 5,
            question: "ပစ္စည်းရဲ့ ပုံ ၅ ပုံ ပို့ပေးပါခင်ဗျာ 📸 (၅ ပုံ ပြည့်အောင် ပို့ပေးရပါမယ်)"
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
    welcomeMessage: (senderName, pageName) => {
        const greeting = senderName ? `မင်္ဂလာပါ ${senderName} ခင်ဗျာ 🙏` : "မင်္ဂလာပါခင်ဗျာ 🙏";
        const shop = pageName ? `${pageName} မှ ကြိုဆိုပါတယ်။` : "ကြိုဆိုပါတယ်။";
        return (
            `${greeting}\n` +
            `${shop}\n\n` +
            "✅ တရုတ် → မြန်မာ\n" +
            "✅ ထိုင်း → မြန်မာ\n" +
            "✅ ဂျပန် → မြန်မာ\n\n" +
            "Cargo အသစ် ပို့ရန် စတင်ပါမည် 📦"
        );
    },
    completionMessage: (d, refNo) => {
        return (
            "ကျေးဇူးတင်ပါတယ် 🙏\n" +
            "သင်၏ Cargo Request လက်ခံပြီးပါပြီ။\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            "📋 CARGO အချက်အလက်\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `📌 Ref No: \n` +
            `#${refNo}\n` +
            `🌏 နိုင်ငံ: \n` +
            `${d.country || "-"}\n` +
            `🚢 ပို့ဆောင်မှု: \n` +
            `${d.shipping || "-"}\n` +
            `📦 အမျိုးအစား: \n` +
            `${d.item_type || "-"}\n` +
            `📝 ပစ္စည်း: \n` +
            `${d.item_name || "-"}\n` +
            `⚖️ အလေးချိန်: \n` +
            `${d.weight || "-"}\n` +
            `💰 တန်ဖိုး: \n` +
            `${d.item_value || "-"}\n` +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `👤 နာမည်: \n` +
            `${d.full_name || "-"}\n` +
            `📞 ဖုန်း: \n` +
            `${d.phone || "-"}\n` +
            `📍 လိပ်စာ: \n` +
            `${d.address || "-"}\n` +
            "━━━━━━━━━━━━━━━━━━━━━━\n" +
            `⏰ တုံ့ပြန်ချိန်: ၁-၂ နာရီ (ရုံးချိန်အတွင်း)\n\n` +
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
export function getWelcomeMessage(businessType: string, senderName?: string, pageName?: string, flowMetadata?: any): string {
    // If user has customized welcome message in metadata, use it
    if (flowMetadata?.welcome_message) {
        let msg = flowMetadata.welcome_message;
        if (senderName) msg = msg.replace("{{senderName}}", senderName);
        if (pageName) msg = msg.replace("{{pageName}}", pageName);
        return msg;
    }

    const flowDef = CONVERSATION_FLOWS[businessType] || DEFAULT_FLOW;
    if (flowDef.welcomeMessage) {
        return flowDef.welcomeMessage(senderName, pageName);
    }

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
    attachments: any[] = [],
    isResuming: boolean = true
) {
    const tempData = conversation.temp_data || {};
    // Get metadata and merge steps
    const metadata = flow.metadata || {};
    const businessType = flow.business_type || 'default';
    const flowDef = CONVERSATION_FLOWS[businessType] || DEFAULT_FLOW;

    // Merge hardcoded steps with metadata overrides and filters
    const baseSteps = flowDef.steps;
    const mergedSteps = baseSteps
        .map((step: any) => {
            const override = metadata.steps?.[step.field];
            if (!override) return step;

            return {
                ...step,
                question: override.question || step.question,
                enabled: override.enabled !== undefined ? override.enabled : true
            };
        })
        .filter((step: any) => step.enabled !== false);

    // Get steps that are active (respect skipIf with current data)
    const activeSteps = getActiveSteps(mergedSteps, tempData);

    // Find the current step (first step without data)
    let currentStepIndex = 0;
    for (let i = 0; i < activeSteps.length; i++) {
        const step = activeSteps[i];
        if (step.type === 'media' && step.requiredCount) {
            const currentCount = (tempData[step.field] || []).length;
            if (currentCount < step.requiredCount) {
                currentStepIndex = i;
                break;
            }
        } else if (!tempData[activeSteps[i].field]) {
            currentStepIndex = i;
            break;
        }
    }

    const currentStep = activeSteps[currentStepIndex] as any;

    // If resuming (not a new trigger), validate and save the user's answer
    if (isResuming && currentStep) {
        if (currentStep.type === 'media') {
            // Handle Media/Attachments
            const incomingPhotos = (attachments || []).filter(a => a.type === 'image');

            if (incomingPhotos.length > 0) {
                const existingPhotos = tempData[currentStep.field] || [];
                // Filter out URLs that are already in existingPhotos to prevent double-counting
                const newPhotoUrls = incomingPhotos.map(p => p.payload?.url || p.url).filter(url => !existingPhotos.includes(url));
                const updatedPhotos = [...existingPhotos, ...newPhotoUrls];
                tempData[currentStep.field] = updatedPhotos;
                delete tempData[`_warn_${currentStep.field}`];
            } else if (!messageText) {
                // Ignore if no text and no photos (shouldn't happen with relaxed guard but safe)
            } else {
                // User sent text instead of photo - set a warn flag to show tip
                tempData[`_warn_${currentStep.field}`] = true;
            }
        } else if (!tempData[currentStep.field]) {
            const isValid = currentStep.validation ? currentStep.validation(messageText, attachments) : true;

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
                ? currentStep.transform(messageText, attachments)
                : messageText;

            tempData[currentStep.field] = transformedValue;
        }
    }

    // After saving, re-evaluate active steps (skipIf may change based on new data)
    const updatedActiveSteps = getActiveSteps(mergedSteps, tempData);

    // Auto-skip steps that should be skipped and fill default values
    for (const step of mergedSteps) {
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
    const allComplete = updatedActiveSteps.every((step: any) => {
        if (step.type === 'media' && step.requiredCount) {
            return (tempData[step.field] || []).length >= step.requiredCount;
        }
        return tempData[step.field] !== undefined;
    });

    let reply: string;
    let isComplete = false;

    if (allComplete) {
        // ... (existing completion logic)
        // Generate order/reference number
        const orderNo = generateOrderNumber(businessType);

        // Custom Completion Message from Metadata?
        if (metadata.completion_message) {
            let msg = metadata.completion_message;
            msg = msg.replace("{{orderNo}}", orderNo);
            msg = msg.replace("{{refNo}}", orderNo);
            // Replace other dynamic fields from tempData
            Object.keys(tempData).forEach(key => {
                if (!key.startsWith('_')) {
                    const value = tempData[key] !== undefined ? tempData[key] : "-";
                    msg = msg.replace(new RegExp(`{{${key}}}`, 'g'), value);
                }
            });
            reply = msg;
        } else {
            reply = flowDef.completionMessage(tempData, orderNo);
        }

        isComplete = true;

        // Store the order number in temp_data for downstream
        // Renamed from _order_no to order_no to ensure it's saved in DB
        tempData.order_no = orderNo;

        await supabaseAdmin
            .from("conversations")
            .update({ temp_data: tempData })
            .eq("id", conversation.id);
    } else {
        // Find next unanswered or incomplete step
        const nextStep = updatedActiveSteps.find((step: any) => {
            if (step.type === 'media' && step.requiredCount) {
                return (tempData[step.field] || []).length < step.requiredCount;
            }
            return !tempData[step.field];
        }) as any;

        if (nextStep) {
            const completedCount = updatedActiveSteps.filter((s: any) => {
                if (s.type === 'media' && s.requiredCount) {
                    return (tempData[s.field] || []).length >= s.requiredCount;
                }
                return tempData[s.field] !== undefined;
            }).length;
            const totalCount = updatedActiveSteps.length;
            const flowProgress = `📊 ${completedCount}/${totalCount}`;

            if (nextStep.type === 'media' && nextStep.requiredCount) {
                const currentMediaCount = (tempData[nextStep.field] || []).length;
                const mediaProgress = `📸 ${currentMediaCount}/${nextStep.requiredCount} ပုံ ရရှိပြီးပါပြီ`;
                const warnTip = tempData[`_warn_${nextStep.field}`] ? "⚠️ (စာမဟုတ်ဘဲ ပစ္စည်းပုံ သီးသန့် ပို့ပေးပါခင်ဗျာ)\n\n" : "";
                reply = `${flowProgress}\n\n${mediaProgress}\n\n${warnTip}${nextStep.question}`;
            } else {
                reply = `${flowProgress}\n\n${nextStep.question}`;
            }
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
        content: reply, // Added for compatibility with updated schema
        channel: "facebook",
        status: "replied",
        created_at: new Date().toISOString(),
        conversation_id: conversation.id,
        metadata: { conversation_id: conversation.id },
    });
}
