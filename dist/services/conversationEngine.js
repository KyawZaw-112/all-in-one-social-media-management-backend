import { supabaseAdmin } from "../supabaseAdmin.js";
// ─── Language Detection Helpers ───────────────────────────────────
export function detectLanguage(text) {
    if (!text)
        return "my"; // Default to Burmese for this project
    if (/[\u1000-\u109F]/.test(text))
        return "my";
    if (/[\u0E00-\u0E7F]/.test(text))
        return "th";
    return "en";
}
function getTranslation(content, lang) {
    if (!content)
        return "";
    if (typeof content === "string")
        return content;
    if (typeof content === "object") {
        return content[lang] || content["my"] || content["en"] || Object.values(content)[0];
    }
    return "";
}
// ─── ONLINE SHOP FLOW (Live Sale Bot) ────────────────────────────
export const ONLINE_SHOP_FLOW = {
    steps: [
        {
            field: "order_source",
            question: {
                my: "ဘယ်လို ဝယ်တာလဲ? 🛍️\n\n1️⃣ 📺 Live မှာ ကြည့်ပြီး ဝယ်တာ\n2️⃣ 🖼️ Post/Story မှာ မြင်တာ\n3️⃣ 🔗 Link မှ လာတာ",
                en: "How did you find us? 🛍️\n\n1️⃣ 📺 From Live Sale\n2️⃣ 🖼️ From Post/Story\n3️⃣ 🔗 From Link",
                th: "คุณพบเราได้อย่างไร? 🛍️\n\n1️⃣ 📺 จากไลฟ์สด\n2️⃣ 🖼️ จากโพสต์/สตอรี่\n3️⃣ 🔗 จากลิงก์"
            },
            options: [
                { label: { my: "Live", en: "Live", th: "ไลฟ์สด" }, value: "Live" },
                { label: { my: "Post", en: "Post", th: "โพสต์" }, value: "Post" },
                { label: { my: "Link", en: "Link", th: "ลิงก์" }, value: "Link" },
            ],
            validation: (v) => {
                const lower = v.toLowerCase().trim();
                const n = parseInt(v);
                return (n >= 1 && n <= 3) ||
                    ["live", "post", "link", "story"].some(k => lower.includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                const map = { 1: "Live", 2: "Post", 3: "Link" };
                if (map[n])
                    return map[n];
                const lower = v.toLowerCase().trim();
                if (lower.includes("live"))
                    return "Live";
                if (lower.includes("post") || lower.includes("story"))
                    return "Post";
                if (lower.includes("link"))
                    return "Link";
                return v;
            },
        },
        {
            field: "item_name",
            question: {
                my: "ဝယ်ချင်သည့် ပစ္စည်းအမည် ရေးပေးပါ ✏️",
                en: "Please enter the item name ✏️",
                th: "กรุณาพิมพ์ชื่อสินค้า ✏️"
            },
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "confirmation",
            question: {
                my: "ပစ္စည်း အတည်ပြုပေးပါ ✅",
                en: "Please confirm the item ✅",
                th: "กรุณายืนยันสินค้า ✅"
            },
            options: [
                { label: { my: "ဝယ်မည်", en: "Confirm", th: "ยืนยัน" }, value: "Yes" },
                { label: { my: "မှားနေသည် (ပြန်ရိုက်မည်)", en: "Try again", th: "พิมพ์ใหม่" }, value: "No" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 2) || ["yes", "no", "confirm", "ဝယ်", "မှား", "confirm", "ยืนยัน"].some(k => v.toLowerCase().includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                if (n === 1 || v.toLowerCase().includes("yes") || v.toLowerCase().includes("confirm") || v.includes("ဝယ်") || v.includes("ยืนยัน"))
                    return "Yes";
                return "No";
            }
        },
        {
            field: "size",
            question: {
                my: "အရွယ်အစား (Size) ရွေးပေးပါ 📏",
                en: "Please select/type the Size 📏",
                th: "กรุณาเลือก/พิมพ์ขนาด (Size) 📏"
            },
            options: [
                { label: "S", value: "S" },
                { label: "M", value: "M" },
                { label: "L", value: "L" },
                { label: "XL", value: "XL" },
                { label: { my: "မရှိပါ", en: "N/A", th: "ไม่มี" }, value: "-" },
            ],
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "color",
            question: {
                my: "အရောင် (Color) ရွေးပေးပါ 🎨",
                en: "Please select/type the Color 🎨",
                th: "กรุณาเลือก/พิมพ์สี (Color) 🎨"
            },
            options: [
                { label: { my: "အဖြူ", en: "White", th: "ขาว" }, value: "White" },
                { label: { my: "အမည်း", en: "Black", th: "ดำ" }, value: "Black" },
                { label: { my: "အနီ", en: "Red", th: "แดง" }, value: "Red" },
                { label: { my: "အပြာ", en: "Blue", th: "น้ำเงิน" }, value: "Blue" },
                { label: { my: "မရှိပါ", en: "N/A", th: "ไม่มี" }, value: "-" },
            ],
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "payment_method",
            question: {
                my: "ငွေပေးချေမည့် နည်းလမ်း ရွေးပေးပါ 💳",
                en: "Please select payment method 💳",
                th: "กรุณာเลือกวิธีการชำระเงิน 💳"
            },
            options: [
                { label: "KPay", value: "KPay" },
                { label: "WavePay", value: "WavePay" },
                { label: "Mobile Banking", value: "Mobile Banking" },
                { label: { my: "အခြား", en: "Other", th: "อื่นๆ" }, value: "Other" },
            ],
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "quantity",
            question: {
                my: "အရေအတွက် မည်မျှ လိုချင်လဲ? 🔢",
                en: "How many items do you want? 🔢",
                th: "คุณต้องการจำนวนกี่ชิ้น? 🔢"
            },
            validation: (v) => !isNaN(parseInt(v)) && parseInt(v) > 0,
            transform: (v) => parseInt(v),
        },
        {
            field: "delivery",
            question: {
                my: "ပစ္စည်း ဘယ်လို ရချင်လဲ? 🚚\n\n1️⃣ 🚚 Delivery (ပို့ပေးမယ်)\n2️⃣ 🏪 Self Pickup (ကိုယ်တိုင်လာယူ)",
                en: "How would you like to receive the item? 🚚\n\n1️⃣ 🚚 Delivery\n2️⃣ 🏪 Self Pickup",
                th: "คุณต้องการรับสินค้าอย่างไร? 🚚\n\n1️⃣ 🚚 บริการจัดส่ง (Delivery)\n2️⃣ 🏪 มารับเอง (Self Pickup)"
            },
            options: [
                { label: { my: "Delivery", en: "Delivery", th: "จัดส่ง" }, value: "Delivery" },
                { label: { my: "Pickup", en: "Pickup", th: "มารับเอง" }, value: "Pickup" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 2) ||
                    ["delivery", "pickup", "ပို့", "ယူ", "self", "ส่ง"].some(k => v.toLowerCase().includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                if (n === 1 || v.toLowerCase().includes("delivery") || v.includes("ပို့") || v.includes("ส่ง"))
                    return "Delivery";
                if (n === 2 || v.toLowerCase().includes("pickup") || v.includes("ယူ"))
                    return "Pickup";
                return v;
            }
        },
        {
            field: "address",
            question: {
                my: "ပို့ပေးရမည့် လိပ်စာ အပြည့်အစုံ ထည့်ပေးပါ 📍",
                en: "Please enter your full delivery address 📍",
                th: "กรุณากรอกที่อยู่ในการจัดส่งอย่างละเอียด 📍"
            },
            validation: (v) => v.trim().length > 3,
            skipIf: (tempData) => tempData.delivery === "Pickup",
        },
        {
            field: "full_name",
            question: {
                my: "သင့်အမည် ထည့်ပေးပါ 👤",
                en: "Please enter your name 👤",
                th: "กรุณากรอกชื่อของคุณ 👤"
            },
            validation: (v) => v.trim().length > 1,
        },
        {
            field: "phone",
            question: {
                my: "ဆက်သွယ်ရန် ဖုန်းနံပါတ် ထည့်ပေးပါ 📞",
                en: "Please enter your contact phone number 📞",
                th: "กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อ 📞"
            },
            validation: (v) => v.replace(/[\s\-]/g, '').length >= 6,
        },
        {
            field: "notes",
            question: {
                my: "KPay, Wave Money တို့ဖြင့် ငွေလွှဲမည်ဆိုပါက Payment Note ရေးပေးပါ",
                en: "Please provide a Payment Note if paying via KPay, Wave, or Bank Transfer",
                th: "กรุณาระบุบันทึกการชำระเงิน หากชำระผ่านธนาคารหรือแอปพลิเคชัน"
            },
            validation: (v) => v.trim().length > 0,
        },
    ],
    welcomeMessage: (senderName, pageName) => {
        return {
            my: `${senderName ? `မင်္ဂလာပါ ${senderName} ခင်ဗျာ 🙏` : "မင်္ဂလာပါခင်ဗျာ 🙏"}\n${pageName ? `${pageName} မှ ကြိုဆိုပါတယ်။` : "ကြိုဆိုပါတယ်။"}\n\n🛍️ Live Sale မှာ ဝယ်ယူသည့်အတွက်\nကျေးဇူးတင်ပါသည် 💖\n\nOrder စတင်ပါမည်...`,
            en: `${senderName ? `Hello ${senderName} 🙏` : "Hello 🙏"}\n${pageName ? `Welcome to ${pageName}.` : "Welcome."}\n\n🛍️ Thank you for your purchase from our Live Sale 💖\n\nStarting your order flow...`,
            th: `${senderName ? `สวัสดีคุณ ${senderName} 🙏` : "สวัสดีครับ 🙏"}\n${pageName ? `ยินดีต้อนรับสู่ ${pageName}` : "ยินดีต้อนรับครับ"}\n\n🛍️ ขอบคุณที่เลือกซื้อสินค้าจากไลฟ์สดของเรา 💖\n\nกำลังเริ่มขั้นตอนการสั่งซื้อ...`
        };
    },
    completionMessage: (d, orderNo) => {
        return {
            my: `🎉 Order လက်ခံပြီးပါပြီ!\n\n━━━━━━━━━━━━━━━━━━━━\n🛍️ ORDER အချက်အလက်\n━━━━━━━━━━━━━━━━━━━━\n📌 Order No : #${orderNo}\n ပစ္စည်း : ${d.product_name || d.item_name || "-"}\n📏 Size : ${d.size || "-"}\n🎨 Color : ${d.color || "-"}\n🔢 အရေအတွက် : ${d.quantity || "-"}\n🚚 ပို့ဆောင်မှု : ${d.delivery || "-"}\n👤 နာမည် : ${d.full_name || "-"}\n📞 ဖုန်း : ${d.phone || "-"}\n━━━━━━━━━━━━━━━━━━━━\nAdmin မှ မကြာခင် ပြန်လည်ဆက်သွယ်ပေးပါမည်။ ကျေးဇူးတင်ပါသည် 🙏`,
            en: `🎉 Order Received!\n\n━━━━━━━━━━━━━━━━━━━━\n🛍️ ORDER DETAILS\n━━━━━━━━━━━━━━━━━━━━\n📌 Order No : #${orderNo}\n📝 Item : ${d.product_name || d.item_name || "-"}\n📏 Size : ${d.size || "-"}\n🎨 Color : ${d.color || "-"}\n🔢 Qty : ${d.quantity || "-"}\n🚚 Delivery : ${d.delivery || "-"}\n👤 Name : ${d.full_name || "-"}\n📞 Phone : ${d.phone || "-"}\n━━━━━━━━━━━━━━━━━━━━\nAdmin will contact you shortly. Thank you! 🙏`,
            th: `🎉 ได้รับคำสั่งซื้อแล้ว!\n\n━━━━━━━━━━━━━━━━━━━━\n🛍️ รายละเอียดคำสั่งซื้อ\n━━━━━━━━━━━━━━━━━━━━\n📌 เลขที่สั่งซื้อ : #${orderNo}\n📝 สินค้า : ${d.product_name || d.item_name || "-"}\n📏 ขนาด : ${d.size || "-"}\n🎨 สี : ${d.color || "-"}\n🔢 จำนวน : ${d.quantity || "-"}\n🚚 การจัดส่ง : ${d.delivery || "-"}\n👤 ชื่อ : ${d.full_name || "-"}\n📞 โทร : ${d.phone || "-"}\n━━━━━━━━━━━━━━━━━━━━\nเจ้าหน้าที่จะติดต่อกลับหาคุณโดยเร็วที่สุด ขอบคุณครับ 🙏`
        };
    },
    incompleteMessage: {
        my: "📝 ဆက်ဖြေပေးပါ။",
        en: "📝 Please continue with the next step.",
        th: "📝 กรุณาดำเนินการต่อในขั้นตอนถัดไป"
    },
};
// ─── CARGO FLOW ──────────────────────────────────────────────────
export const CARGO_FLOW = {
    steps: [
        // ... (remaining steps unchanged)
        {
            field: "country",
            question: {
                my: "ဘယ်လမ်းကြောင်း ပို့ချင်တာလဲ? 🌏\n\n1️⃣ 🇹🇭 ထိုင်း -> မြန်မာ 🇲🇲\n2️⃣ 🇨🇳 တရုတ် -> မြန်မာ 🇲🇲\n3️⃣ 🇰🇷 ကိုရီးယား -> မြန်မာ 🇲🇲\n4️⃣ 🇯🇵 ဂျပန် -> မြန်မာ 🇲🇲\n5️⃣ 🌍 အခြား (Other)",
                en: "Which shipping route? 🌏\n\n1️⃣ 🇹🇭 Thailand -> Myanmar 🇲🇲\n2️⃣ 🇨🇳 China -> Myanmar 🇲🇲\n3️⃣ 🇰🇷 Korea -> Myanmar 🇲🇲\n4️⃣ 🇯🇵 Japan -> Myanmar 🇲🇲\n5️⃣ 🌍 Other",
                th: "ต้องการส่งเส้นทางไหนครับ? 🌏\n\n1️⃣ 🇹🇭 ไทย -> พม่า 🇲🇲\n2️⃣ 🇨🇳 จีน -> พม่า 🇲🇲\n3️⃣ 🇰🇷 เกาหลี -> พม่า 🇲🇲\n4️⃣ 🇯🇵 ญี่ปุ่น -> พม่า 🇲🇲\n5️⃣ 🌍 อื่นๆ (Other)"
            },
            options: [
                { label: "Thailand -> Myanmar", value: "Thailand -> Myanmar" },
                { label: "China -> Myanmar", value: "China -> Myanmar" },
                { label: "Korea -> Myanmar", value: "Korea -> Myanmar" },
                { label: "Japan -> Myanmar", value: "Japan -> Myanmar" },
                { label: { my: "အခြား", en: "Other", th: "อื่นๆ" }, value: "Other" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                if (n >= 1 && n <= 5)
                    return true;
                const lower = v.toLowerCase().trim();
                return ["ထိုင်း", "တရုတ်", "ကိုရီးယား", "ဂျပန်", "china", "thai", "japan", "korea", "myanmar", "->"].some(k => lower.includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                const map = {
                    1: "Thailand -> Myanmar",
                    2: "China -> Myanmar",
                    3: "Korea -> Myanmar",
                    4: "Japan -> Myanmar",
                    5: "Other"
                };
                if (map[n])
                    return map[n];
                const lower = v.toLowerCase();
                if (lower.includes("ထိုင်း") || lower.includes("thai"))
                    return "Thailand -> Myanmar";
                if (lower.includes("တရုတ်") || lower.includes("china"))
                    return "China -> Myanmar";
                if (lower.includes("ကိုရီးယား") || lower.includes("korea"))
                    return "Korea -> Myanmar";
                if (lower.includes("ဂျပန်") || lower.includes("japan"))
                    return "Japan -> Myanmar";
                return "Other";
            },
        },
        {
            field: "shipping",
            question: {
                my: "ဘယ်လို ပို့မှာလဲ? 🚢\n\n1️⃣ ✈️ Air (လေကြောင်း)\n2️⃣ 🚢 Sea (ရေကြောင်း)",
                en: "Shipping method? 🚢\n\n1️⃣ ✈️ Air\n2️⃣ 🚢 Sea",
                th: "การส่งสินค้า? 🚢\n\n1️⃣ ✈️ ทางอากาศ (Air)\n2️⃣ 🚢 ทางเรือ (Sea)"
            },
            options: [
                { label: { my: "Air", en: "Air", th: "แอร์" }, value: "Air" },
                { label: { my: "Sea", en: "Sea", th: "เรือ" }, value: "Sea" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 2) || ["air", "sea", "ပို့", "လေ", "ရေ", "เครื่องบิน", "เรือ"].some(k => v.toLowerCase().includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                if (n === 1 || v.toLowerCase().includes("air") || v.includes("လေ") || v.includes("เครื่องบิน"))
                    return "Air";
                return "Sea";
            }
        },
        {
            field: "item_type",
            question: {
                my: "ပစ္စည်းအမျိုးအစား ရွေးပေးပါ 📦\n\n1️⃣ 👕 အထည်အလိပ် / ဖိနပ် (Clothing)\n2️⃣ 💄 အလှကုန် / ဆေးဝါး (Cosmetics)\n3️⃣ 🔌 လျှပ်စစ်ပစ္စည်း (Electronics)\n4️⃣ 🍲 အစားအသောက် (Food)\n5️⃣ 🌍 အထွေထွေ (General)",
                en: "Select Item Category 📦\n\n1️⃣ 👕 Clothing / Shoes\n2️⃣ 💄 Cosmetics / Medicine\n3️⃣ 🔌 Electronics\n4️⃣ 🍲 Food\n5️⃣ 🌍 General",
                th: "เลือกประเภทสินค้า 📦\n\n1️⃣ 👕 เสื้อผ้า / รองเท้า\n2️⃣ 💄 เครื่องสำอาง / ยา\n3️⃣ 🔌 เครื่องใช้ไฟฟ้า\n4️⃣ 🍲 อาหาร\n5️⃣ 🌍 ทั่วไป"
            },
            options: [
                { label: { my: "Clothing", en: "Clothing", th: "เสื้อผ้า" }, value: "Clothing" },
                { label: { my: "Cosmetics", en: "Cosmetics", th: "เครื่องสำอาง" }, value: "Cosmetics" },
                { label: { my: "Electronics", en: "Electronics", th: "ไฟฟ้า" }, value: "Electronics" },
                { label: { my: "Food", en: "Food", th: "อาหาร" }, value: "Food" },
                { label: { my: "General", en: "General", th: "ทั่วไป" }, value: "General" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                return (n >= 1 && n <= 5) || v.trim().length > 1;
            },
            transform: (v) => {
                const n = parseInt(v);
                const map = { 1: "Clothing", 2: "Cosmetics", 3: "Electronics", 4: "Food", 5: "General" };
                return map[n] || v;
            }
        },
        {
            field: "shipping",
            question: {
                my: "ပို့ဆောင်မှု အမျိုးအစား ရွေးပါ ✈️🚢\n\n1️⃣ ✈️ လေကြောင်း (Air)\n2️⃣ ⚡ Express",
                en: "Please select shipping type ✈️🚢\n\n1️⃣ ✈️ Air Cargo\n2️⃣ ⚡ Express",
                th: "กรุณาเลือกประเภทการขนส่ง ✈️🚢\n\n1️⃣ ✈️ ทางอากาศ (Air)\n2️⃣ ⚡ ส่งด่วน (Express)"
            },
            options: [
                { label: { my: "လေကြောင်း", en: "Air Cargo", th: "ทางอากาศ" }, value: "လေကြောင်း" },
                { label: { my: "Express", en: "Express", th: "ส่งด่วน" }, value: "Express" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                if (n >= 1 && n <= 2)
                    return true;
                const lower = v.toLowerCase().trim();
                return ["လေ", "express", "air"].some(k => lower.includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                const map = { 1: "လေကြောင်း", 2: "Express" };
                if (map[n])
                    return map[n];
                const lower = v.toLowerCase();
                if (lower.includes("လေ") || lower.includes("air"))
                    return "လေကြောင်း";
                if (lower.includes("express"))
                    return "Express";
                return v;
            },
        },
        {
            field: "item_type",
            question: {
                my: "ပစ္စည်းအမျိုးအစား ရွေးပေးပါ 📦\n\n1️⃣ 📱 Electronics\n2️⃣ 👗 အဝတ်အထည်\n3️⃣ 🧴 Cosmetics\n4️⃣ 🍜 အစားအသောက်\n5️⃣ 🔧 စက်ပစ္စည်း\n6️⃣ 📦 General",
                en: "Please select item category 📦\n\n1️⃣ 📱 Electronics\n2️⃣ 👗 Clothing\n3️⃣ 🧴 Cosmetics\n4️⃣ 🍜 Food\n5️⃣ 🔧 Tools/Machinery\n6️⃣ 📦 General",
                th: "กรุณาเลือกประเภทสินค้า 📦\n\n1️⃣ 📱 อิเล็กทรอนิกส์\n2️⃣ 👗 เสื้อผ้า\n3️⃣ 🧴 เครื่องสำอาง\n4️⃣ 🍜 อาหาร\n5️⃣ 🔧 เครื่องมือ/เครื่องจักร\n6️⃣ 📦 ทั่วไป (General)"
            },
            options: [
                { label: { my: "Electronics", en: "Electronics", th: "อิเล็กทรอนิกส์" }, value: "Electronics" },
                { label: { my: "အဝတ်အထည်", en: "Clothing", th: "เสื้อผ้า" }, value: "အဝတ်အထည်" },
                { label: { my: "Cosmetics", en: "Cosmetics", th: "เครื่องสำอาง" }, value: "Cosmetics" },
                { label: { my: "အစားအသောက်", en: "Food", th: "อาหาร" }, value: "အစားအသောက်" },
                { label: { my: "စက်ပစ္စည်း", en: "Tools", th: "เครื่องมือ" }, value: "စက်ပစ္စည်း" },
                { label: { my: "General", en: "General", th: "ทั่วไป" }, value: "General" },
            ],
            validation: (v) => {
                const n = parseInt(v);
                if (n >= 1 && n <= 6)
                    return true;
                const lower = v.toLowerCase().trim();
                return ["elec", "အဝတ်", "အထည်", "cosm", "အစား", "သောက်", "စက်", "gen"].some(k => lower.includes(k));
            },
            transform: (v) => {
                const n = parseInt(v);
                const map = {
                    1: "Electronics", 2: "အဝတ်အထည်", 3: "Cosmetics",
                    4: "အစားအသောက်", 5: "စက်ပစ္စည်း", 6: "General"
                };
                if (map[n])
                    return map[n];
                const lower = v.toLowerCase();
                if (lower.includes("elec"))
                    return "Electronics";
                if (lower.includes("အဝတ်") || lower.includes("အထည်"))
                    return "အဝတ်အထည်";
                if (lower.includes("cosm"))
                    return "Cosmetics";
                if (lower.includes("အစား") || lower.includes("သောက်"))
                    return "အစားအသောက်";
                if (lower.includes("စက်"))
                    return "စက်ပစ္စည်း";
                return "General";
            },
        },
        {
            field: "item_name",
            question: {
                my: "ပစ္စည်းအမည် ရေးပေးပါ ✏️\n(ဥပမာ - iPhone 15 × 2, အကျီ × 10)",
                en: "Please enter the item name(s) ✏️\n(e.g., iPhone 15 x 2, Shirt x 10)",
                th: "กรุณาพิมพ์ชื่อสินค้า ✏️\n(เช่น iPhone 15 x 2, เสื้อยืด x 10)"
            },
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "weight",
            question: {
                my: "ပစ္စည်းအလေးချိန် မည်မျှလဲ? ⚖️\n(ဥပမာ - 2kg, 500g)\nမသိသေးပါက \"မသိ\" ဟု ရိုက်ပါ",
                en: "What is the weight? ⚖️\n(e.g., 2kg, 500g)\nType \"unknown\" if not sure",
                th: "น้ำหนักประมาณเท่าไหร่? ⚖️\n(เช่น 2kg, 500g)\nหากยังไม่ทราบให้พิมพ์ว่า \"ไม่ทราบ\""
            },
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "item_photos",
            type: "media",
            requiredCount: 5,
            question: {
                my: "ပစ္စည်းရဲ့ ပုံ ၅ ပုံ ပို့ပေးပါခင်ဗျာ 📸 (၅ ပုံ ပြည့်အောင် ပို့ပေးရပါမယ်)",
                en: "Please send 5 photos of the items 📸 (Must send 5 photos)",
                th: "กรุณาส่งรูปภาพสินค้า 5 รูปครับ 📸 (ต้องครบ 5 รูป)"
            }
        },
        {
            field: "item_value",
            question: {
                my: "ပစ္စည်းတန်ဖိုး မည်မျှလဲ? 💰\n(ဥပမာ - 50 USD / 1500 CNY)\nကြေညာရန် လိုအပ်ပါသည်",
                en: "What is the total value? 💰\n(e.g., 50 USD / 1500 CNY)\nRequired for declaration",
                th: "มูลค่าสินค้าประมาณเท่าไหร่? 💰\n(เช่น 50 USD / 1500 CNY)\nจำเป็นต้องระบุสำหรับการสำแดง"
            },
            validation: (v) => v.trim().length > 0,
        },
        {
            field: "full_name",
            question: {
                my: "သင်၏ အမည်အပြည့်အစုံ ထည့်ပေးပါ 👤",
                en: "Please enter your full name 👤",
                th: "กรุณากรอกชื่อ-นามสกุลของคุณ 👤"
            },
            validation: (v) => v.trim().length > 1,
        },
        {
            field: "phone",
            question: {
                my: "ဆက်သွယ်ရန် ဖုန်းနံပါတ် ထည့်ပေးပါ 📞\n(Viber ပါသော နံပါတ် ဖြစ်ပါက ပိုကောင်းပါသည်)",
                en: "Please enter your contact phone number 📞\n(Preferably with Viber)",
                th: "กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อ 📞\n(หากเป็นเบอร์ที่มี Viber จะดีมากครับ)"
            },
            validation: (v) => v.replace(/[\s\-]/g, '').length >= 6,
        },
    ],
    welcomeMessage: (senderName, pageName) => {
        return {
            my: `${senderName ? `မင်္ဂလာပါ ${senderName} ခင်ဗျာ 🙏` : "မင်္ဂလာပါခင်ဗျာ 🙏"}\n${pageName ? `${pageName} မှ ကြိုဆိုပါတယ်။` : "ကြိုဆိုပါတယ်။"}\n\n✅ တရုတ် → မြန်မာ\n✅ ထိုင်း → မြန်မာ\n✅ ဂျပန် → မြန်မာ\n\nCargo အသစ် ပို့ရန် စတင်ပါမည် 📦`,
            en: `${senderName ? `Hello ${senderName} 🙏` : "Hello 🙏"}\n${pageName ? `Welcome to ${pageName}.` : "Welcome."}\n\n✅ China → Myanmar\n✅ Thailand → Myanmar\n✅ Japan → Myanmar\n\nStarting a new cargo request 📦`,
            th: `${senderName ? `สวัสดีคุณ ${senderName} 🙏` : "สวัสดีครับ 🙏"}\n${pageName ? `ยินดีต้อนรับสู่ ${pageName}` : "ยินดีต้อนรับครับ"}\n\n✅ จีน → พม่า\n✅ ไทย → พม่า\n✅ ญี่ปุ่น → พม่า\n\nกำลังเริ่มขั้นตอนการส่งสินค้า 📦`
        };
    },
    completionMessage: (d, refNo) => {
        return {
            my: `ကျေးဇူးတင်ပါတယ် 🙏\nသင်၏ Cargo Request လက်ခံပြီးပါပြီ။\n\n━━━━━━━━━━━━━━━━━━━━\n📋 CARGO အချက်အလက်\n━━━━━━━━━━━━━━━━━━━━\n📌 Ref No: #${refNo}\n🌏 နိုင်ငံ: ${d.country || "-"}\n🚢 ပို့ဆောင်မှု: ${d.shipping || "-"}\n📦 အမျိုးအစား: ${d.item_type || "-"}\n📝 ပစ္စည်း: ${d.item_name || "-"}\n⚖️ အလေးချိန်: ${d.weight || "-"}\n💰 တန်ဖိုး: ${d.item_value || "-"}\n━━━━━━━━━━━━━━━━━━━━\n👤 နာမည်: ${d.full_name || "-"}\n📞 ဖုန်း: ${d.phone || "-"}\n📍 လိပ်စာ: ${d.address || "-"}\n━━━━━━━━━━━━━━━━━━━━\nAdmin မှ မကြာခင် ပြန်လည်ဆက်သွယ်ပေးပါမည်။ ကျေးဇူးတင်ပါသည် 😊`,
            en: `Thank you! 🙏\nYour Cargo Request has been received.\n\n━━━━━━━━━━━━━━━━━━━━\n📋 CARGO DETAILS\n━━━━━━━━━━━━━━━━━━━━\n📌 Ref No: #${refNo}\n🌏 Country: ${d.country || "-"}\n🚢 Shipping: ${d.shipping || "-"}\n📦 Category: ${d.item_type || "-"}\n📝 Item: ${d.item_name || "-"}\n⚖️ Weight: ${d.weight || "-"}\n💰 Value: ${d.item_value || "-"}\n━━━━━━━━━━━━━━━━━━━━\n👤 Name: ${d.full_name || "-"}\n📞 Phone: ${d.phone || "-"}\n📍 Address: ${d.address || "-"}\n━━━━━━━━━━━━━━━━━━━━\nAdmin will contact you shortly. Thank you! 😊`,
            th: `ขอบคุณครับ 🙏\nได้รับแจ้งรายการส่งสินค้า (Cargo Request) แล้วครับ\n\n━━━━━━━━━━━━━━━━━━━━\n📋 รายละเอียดการจัดส่ง\n━━━━━━━━━━━━━━━━━━━━\n📌 เลขอ้างอิง: #${refNo}\n🌏 ประเทศ: ${d.country || "-"}\n🚢 การส่ง: ${d.shipping || "-"}\n📦 ประเภท: ${d.item_type || "-"}\n📝 สินค้า: ${d.item_name || "-"}\n⚖️ น้ำหนัก: ${d.weight || "-"}\n💰 มูลค่า: ${d.item_value || "-"}\n━━━━━━━━━━━━━━━━━━━━\n👤 ชื่อ: ${d.full_name || "-"}\n📞 โทร: ${d.phone || "-"}\n📍 ที่อยู่: ${d.address || "-"}\n━━━━━━━━━━━━━━━━━━━━\nเจ้าหน้าที่จะติดต่อกลับหาคุณโดยเร็วที่สุดครับ ขอบคุณครับ 😊`
        };
    },
    incompleteMessage: {
        my: "📝 ဆက်ဖြေပေးပါ။",
        en: "📝 Please continue.",
        th: "📝 กรุณาดำเนินการต่อ"
    },
};
// ─── DEFAULT TEMPLATE ────────────────────────────────────────────
const DEFAULT_FLOW = {
    steps: [
        {
            field: "message_content",
            question: {
                my: "သင့်မက်ဆေ့ချ် လက်ခံပြီးပါပြီ။\nAdmin မှ မကြာခင် ပြန်လည်ဆက်သွယ်ပါမယ်။ 🙏",
                en: "Your message has been received.\nAdmin will contact you shortly. 🙏",
                th: "ได้รับข้อความของคุณแล้ว\nเจ้าหน้าที่จะติดต่อกลับหาคุณในไม่ช้า 🙏"
            },
            validation: () => true,
        },
    ],
    completionMessage: () => ({
        my: "✅ ကျေးဇူးတင်ပါတယ်။ 🙏",
        en: "✅ Thank you! 🙏",
        th: "✅ ขอบคุณครับ! 🙏"
    }),
    incompleteMessage: {
        my: "📝 ဆက်ဖြေပေးပါ။",
        en: "📝 Please continue.",
        th: "📝 กรุณาดำเนินการต่อ"
    },
};
// ─── Flow Registry ───────────────────────────────────────────────
const CONVERSATION_FLOWS = {
    online_shop: ONLINE_SHOP_FLOW,
    cargo: CARGO_FLOW,
    default: DEFAULT_FLOW,
};
// ─── Welcome Messages ───────────────────────────────────────────
export function getWelcomeMessage(businessType, senderName, pageName, flowMetadata, lang = "my") {
    // If user has customized welcome message in metadata, use it
    if (flowMetadata?.welcome_message) {
        let msg = flowMetadata.welcome_message;
        if (senderName)
            msg = msg.replace("{{senderName}}", senderName);
        if (pageName)
            msg = msg.replace("{{pageName}}", pageName);
        return msg;
    }
    const flowDef = CONVERSATION_FLOWS[businessType] || DEFAULT_FLOW;
    if (flowDef.welcomeMessage) {
        const content = (typeof flowDef.welcomeMessage === 'function')
            ? flowDef.welcomeMessage(senderName, pageName)
            : flowDef.welcomeMessage;
        return getTranslation(content, lang);
    }
    const greetings = {
        my: `${senderName ? `မင်္ဂလာပါ ${senderName} ခင်ဗျာ 🙏` : "မင်္ဂလာပါခင်ဗျာ 🙏"}\n${pageName ? `${pageName} မှ ကြိုဆိုပါတယ်။` : "ကြိုဆိုပါတယ်။"}`,
        en: `${senderName ? `Hello ${senderName} 🙏` : "Hello 🙏"}\n${pageName ? `Welcome to ${pageName}.` : "Welcome."}`,
        th: `${senderName ? `สวัสดีคุณ ${senderName} 🙏` : "สวัสดีครับ 🙏"}\n${pageName ? `ยินดีต้อนรับสู่ ${pageName}` : "ยินดีต้อนรับครับ"}`
    };
    const currentGreeting = getTranslation(greetings, lang);
    if (businessType === "cargo") {
        const cargoStart = {
            my: `\n\nCargo အသစ် ပို့ရန် "order"လို့ ရိုက်ပို့ပြီး စတင်ပါမည် 📦`,
            en: `\n\nType "order" to start a new cargo shipment 📦`,
            th: `\n\nพิมพ์ "order" เพื่อเริ่มการจัดส่งสินค้าใหม่ 📦`
        };
        return currentGreeting + getTranslation(cargoStart, lang);
    }
    const shopStart = {
        my: `\n\n🛍️ ဝယ်ယူသည့်အတွက် ကျေးဇူးတင်ပါသည် 💖\n\nOrder စတင်ပါမည်...`,
        en: `\n\n🛍️ Thank you for your purchase 💖\n\nStarting your order flow...`,
        th: `\n\n🛍️ ขอบคุณที่เลือกซื้อสินค้ากับเรา 💖\n\nกำลังเริ่มขั้นตอนการสั่งซื้อ...`
    };
    return currentGreeting + getTranslation(shopStart, lang);
}
// ─── Default Reply for unmatched messages ────────────────────────
export function getDefaultReply(lang = "my") {
    const defaultReplies = {
        my: "ဝမ်းနည်းပါတယ်၊ သင့် Message ကို\nနားမလည်ပါ 😅\n\nကျေးဇူးပြုပြီး trigger keyword\n(ဥပမာ: order, cargo)\nဖြင့် စတင်ပေးပါ 🙏",
        en: "Sorry, I didn't understand your message 😅\n\nPlease start with a trigger keyword\n(e.g., order, cargo) 🙏",
        th: "ขออภัย ฉันไม่เข้าใจข้อความของคุณ 😅\n\nกรุณาเริ่มต้นด้วยคีย์เวิร์ด\n(เช่น order หรือ cargo) 🙏"
    };
    return getTranslation(defaultReplies, lang);
}
// ─── Generate Order / Reference Number ───────────────────────────
function generateOrderNumber(businessType) {
    const random = Math.floor(100000 + Math.random() * 900000);
    if (businessType === "cargo")
        return `CG${random}`;
    return `LS${random}`;
}
// ─── Fetch Merchant Products ───────────────────────────────────
async function fetchMerchantProducts(merchantId) {
    try {
        const { data, error } = await supabaseAdmin
            .from("products")
            .select("*")
            .eq("merchant_id", merchantId)
            .eq("is_active", true)
            .order("created_at", { ascending: true });
        if (error)
            throw error;
        return data || [];
    }
    catch (err) {
        console.error("Failed to fetch products for engine:", err);
        return [];
    }
}
// ─── Fetch Merchant Shipping Rates ──────────────────────────────
async function fetchMerchantRates(merchantId) {
    try {
        const { data, error } = await supabaseAdmin
            .from("shipping_rates")
            .select("*")
            .eq("merchant_id", merchantId)
            .eq("is_active", true);
        if (error)
            throw error;
        return data || [];
    }
    catch (err) {
        console.error("Failed to fetch rates for engine:", err);
        return [];
    }
}
// ─── Get Active Steps (respecting skipIf) ────────────────────────
function getActiveSteps(steps, tempData) {
    return steps.filter(step => {
        if (step.skipIf && step.skipIf(tempData))
            return false;
        return true;
    });
}
// ─── Main Engine ─────────────────────────────────────────────────
export async function runConversationEngine(conversation, messageText, flow, attachments = [], isResuming = true) {
    const tempData = conversation.temp_data || {};
    const metadata = flow.metadata || {};
    // 🌐 Language Detection
    // If flow metadata has a fixed language, use it.
    // Otherwise, check if we have a saved language in temp_data or detect from current message.
    if (metadata.language) {
        tempData._lang = metadata.language;
    }
    else if (!tempData._lang) {
        tempData._lang = detectLanguage(messageText);
    }
    else {
        // Optional: Re-detect if it's a new trigger or message seems to be in a different language
        const newDetected = detectLanguage(messageText);
        if (newDetected !== "en") { // Only override if it's clearly MM or TH
            tempData._lang = newDetected;
        }
    }
    const currentLang = tempData._lang;
    // Get business types
    const businessType = flow.business_type || 'default';
    const flowDef = CONVERSATION_FLOWS[businessType] || DEFAULT_FLOW;
    // 1️⃣ Fetch data if applicable
    const merchantId = flow.merchant_id || conversation.merchant_id;
    let products = [];
    let rates = [];
    if (businessType === 'online_shop') {
        products = await fetchMerchantProducts(merchantId);
    }
    else if (businessType === 'cargo') {
        rates = await fetchMerchantRates(merchantId);
    }
    // Merge hardcoded steps with metadata overrides and flow.steps
    const baseSteps = (flow.steps && Array.isArray(flow.steps) && flow.steps.length > 0)
        ? flow.steps
        : flowDef.steps;
    const mergedSteps = baseSteps
        .map((step) => {
        const override = metadata.steps?.[step.field];
        // 🧠 Re-hydrate standard logic for known fields
        // This ensures logic like "Live Link Post" button support works even for DB steps
        const hardcodedStep = flowDef.steps.find((s) => s.field === step.field);
        if (hardcodedStep) {
            // Borrow validation, transform, and skipIf if the DB step doesn't have them
            if (hardcodedStep.validation && !step.validation)
                step.validation = hardcodedStep.validation;
            if (hardcodedStep.transform && !step.transform)
                step.transform = hardcodedStep.transform;
            if (hardcodedStep.skipIf && !step.skipIf)
                step.skipIf = hardcodedStep.skipIf;
        }
        // Online Shop Product Logic
        if (step.field === 'item_name') {
            // 🛍️ If merchant has products, show numbered menu
            if (products.length > 0) {
                const emojiNums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
                const menuLines = products.map((p, i) => {
                    const num = emojiNums[i] || `${i + 1}.`;
                    const desc = p.description ? `\n   📝 ${p.description}` : '';
                    const price = p.price ? `\n   💰 ${Number(p.price).toLocaleString()} ${p.currency || 'MMK'}` : '';
                    const stock = p.stock != null ? `  📦 ${p.stock} ခု` : '';
                    return `${num} ${p.name}${desc}${price}${stock}`;
                });
                const menuText = menuLines.join('\n\n');
                const menuQuestion = {
                    my: `ဝယ်ချင်သည့် ပစ္စည်း ရွေးပေးပါ 🛍️\n━━━━━━━━━━━━━\n\n${menuText}\n\n━━━━━━━━━━━━━\n(နံပါတ် သို့ ပစ္စည်းအမည် ရိုက်ပါ)`,
                    en: `Please select an item 🛍️\n━━━━━━━━━━━━━\n\n${menuText}\n\n━━━━━━━━━━━━━\n(Type the number or item name)`,
                    th: `กรุณาเลือกสินค้า 🛍️\n━━━━━━━━━━━━━\n\n${menuText}\n\n━━━━━━━━━━━━━\n(พิมพ์หมายเลข หรือชื่อสินค้า)`
                };
                const menuOptions = products.map((p, i) => ({
                    label: p.name.substring(0, 20),
                    value: `${i + 1}`
                }));
                return {
                    ...step,
                    question: menuQuestion,
                    options: menuOptions,
                    validation: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= products.length)
                            return true;
                        // Also allow typing product name
                        const lowerV = v.toLowerCase().trim();
                        return products.some((p) => p.name.toLowerCase().includes(lowerV) ||
                            lowerV.includes(p.name.toLowerCase()));
                    },
                    transform: (v) => {
                        let match = null;
                        const n = parseInt(v);
                        if (n >= 1 && n <= products.length) {
                            match = products[n - 1];
                        }
                        else {
                            const lowerV = v.toLowerCase().trim();
                            match = products.find((p) => p.name.toLowerCase().includes(lowerV) ||
                                lowerV.includes(p.name.toLowerCase()));
                        }
                        if (match) {
                            tempData.item_id = match.id;
                            tempData.product_name = match.name;
                            tempData.item_price = match.price;
                            tempData.currency = match.currency;
                            tempData.item_image = match.image_url;
                            tempData.item_desc = match.description;
                            tempData.item_variants = match.variants;
                            tempData._stock = match.stock;
                            return match.name;
                        }
                        return v;
                    }
                };
            }
            // No products — free text entry with matching
            return {
                ...step,
                transform: (v) => {
                    const lowerV = v.toLowerCase().trim();
                    const match = products.find((p) => p.name.toLowerCase().includes(lowerV) ||
                        lowerV.includes(p.name.toLowerCase()));
                    if (match) {
                        tempData.item_id = match.id;
                        tempData.product_name = match.name;
                        tempData.item_price = match.price;
                        tempData.currency = match.currency;
                        tempData.item_image = match.image_url;
                        tempData.item_desc = match.description;
                        tempData.item_variants = match.variants;
                        tempData._stock = match.stock;
                    }
                    else {
                        delete tempData.item_id;
                        delete tempData.product_name;
                        delete tempData.item_price;
                        delete tempData.item_image;
                        delete tempData.item_desc;
                        delete tempData.item_variants;
                        delete tempData._stock;
                    }
                    return v;
                }
            };
        }
        // Stock-aware quantity validation
        if (step.field === 'quantity' && tempData._stock != null) {
            const availableStock = tempData._stock;
            return {
                ...step,
                question: `အရေအတွက် မည်မျှ လိုချင်လဲ? 🔢\n\n📦 Stock ကျန်: ${availableStock} ခု`,
                validation: (v) => {
                    const n = parseInt(v);
                    return !isNaN(n) && n > 0;
                },
                transform: (v) => {
                    const n = parseInt(v);
                    if (n > availableStock) {
                        tempData._qty_exceeds_stock = true;
                        return n;
                    }
                    delete tempData._qty_exceeds_stock;
                    return n;
                }
            };
        }
        if (step.field === 'confirmation') {
            if (tempData.item_id) {
                const price = (tempData.item_price || 0).toLocaleString();
                const currency = tempData.currency || 'MMK';
                const desc = tempData.item_desc ? `\n📝 ${tempData.item_desc}` : '';
                const image = "";
                return {
                    ...step,
                    question: `ဒီပစ္စည်းကို ဆိုလိုတာပါသလား? ✅\n\n📌 ${tempData.product_name}\n💰 ဈေးနှုန်း: ${price} ${currency}${desc}${image}\n\n(1) ဝယ်မည်\n(2) မှားနေသည် (ပြန်ရိုက်မည်)`
                };
            }
            else {
                // If no product found, we can skip confirmation or show a "Manual Entry" confirmation
                return {
                    ...step,
                    question: `ပစ္စည်းအမည် "${tempData.item_name}" အမှန်ပဲလား? ✅\n\n(1) အမှန်\n(2) မှားနေသည် (ပြန်ရိုက်မည်)`
                };
            }
        }
        if (step.field === 'size' || step.field === 'color') {
            if (tempData.item_id && tempData.item_variants) {
                return {
                    ...step,
                    question: `${step.question}\n\n(သတ်မှတ်ထားသော variants: ${tempData.item_variants})`
                };
            }
        }
        // Cargo Rates Logic
        if (businessType === 'cargo' && rates.length > 0) {
            if (step.field === 'country') {
                const countries = Array.from(new Set(rates.map(r => r.country))).sort();
                const countryList = countries.map((c, i) => `${i + 1}️⃣ ${c}`).join('\n');
                return {
                    ...step,
                    question: `ပစ္စည်း ဘယ်နိုင်ငံကနေ ပို့မှာလဲ? 🌏\n\n${countryList}\n\n(နံပါတ် သို့မဟုတ် နိုင်ငံအမည် ရိုက်ပါ)`,
                    validation: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= countries.length)
                            return true;
                        return countries.some(c => v.includes(c));
                    },
                    transform: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= countries.length)
                            return countries[n - 1];
                        return countries.find(c => v.includes(c)) || v;
                    }
                };
            }
            if (step.field === 'shipping' && tempData.country) {
                const countryRates = rates.filter(r => r.country === tempData.country);
                const types = Array.from(new Set(countryRates.map(r => r.shipping_type))).sort();
                const typeList = types.map((t, i) => `${i + 1}️⃣ ${t}`).join('\n');
                return {
                    ...step,
                    question: `ပို့ဆောင်မှု အမျိုးအစား ရွေးပါ ✈️🚢\n\n${typeList}\n\n(နံပါတ် သို့မဟုတ် အမျိုးအစား ရိုက်ပါ)`,
                    validation: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= types.length)
                            return true;
                        return types.some(t => v.includes(t));
                    },
                    transform: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= types.length)
                            return types[n - 1];
                        return types.find(t => v.includes(t)) || v;
                    }
                };
            }
            if (step.field === 'item_type' && tempData.country && tempData.shipping) {
                const filteredRates = rates.filter(r => r.country === tempData.country && r.shipping_type === tempData.shipping);
                const categories = Array.from(new Set(filteredRates.map(r => r.item_category)));
                if (categories.length > 0) {
                    const catList = categories.map((c, i) => `${i + 1}️⃣ ${c}`).join('\n');
                    return {
                        ...step,
                        question: `ပစ္စည်းအမျိုးအစား ရွေးပေးပါ 📦\n\n${catList}\n\n(နံပါတ် သို့မဟုတ် အမျိုးအစား ရိုက်ပေးပါ)`,
                        validation: (v) => {
                            const n = parseInt(v);
                            if (n >= 1 && n <= categories.length)
                                return true;
                            return categories.some(c => v.toLowerCase().includes(c.toLowerCase()));
                        },
                        transform: (v) => {
                            const n = parseInt(v);
                            const selectedCat = (n >= 1 && n <= categories.length)
                                ? categories[n - 1]
                                : categories.find(c => v.toLowerCase().includes(c.toLowerCase()));
                            if (selectedCat) {
                                const matchingRate = filteredRates.find(r => r.item_category === selectedCat);
                                if (matchingRate) {
                                    tempData.rate_per_kg = matchingRate.rate_per_kg;
                                    tempData.currency = matchingRate.currency;
                                }
                                return selectedCat;
                            }
                            return v;
                        }
                    };
                }
            }
        }
        if (!override)
            return step;
        return {
            ...step,
            question: override.question || step.question,
            options: override.options || step.options,
            enabled: override.enabled !== undefined ? override.enabled : true
        };
    })
        .filter((step) => step.enabled !== false);
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
        }
        else if (!tempData[activeSteps[i].field]) {
            currentStepIndex = i;
            break;
        }
    }
    const currentStep = activeSteps[currentStepIndex];
    // 🔥 Fix: If it's the very first run (no data in tempData), it means the trigger message 
    // was just received. We should NOT validate it as an answer to the first step.
    // We check for _trigger_processed flag to skip validation ONLY for the initial trigger.
    const isNewTrigger = isResuming && Object.keys(tempData).filter(k => !k.startsWith('_')).length === 0 && !tempData._trigger_processed;
    // If resuming (not a new trigger), validate and save the user's answer
    if (isResuming && currentStep && !isNewTrigger) {
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
            }
            else if (!messageText) {
                // Ignore if no text and no photos (shouldn't happen with relaxed guard but safe)
            }
            else {
                // User sent text instead of photo - set a warn flag to show tip
                tempData[`_warn_${currentStep.field}`] = true;
            }
        }
        else if (!tempData[currentStep.field]) {
            const isValid = currentStep.validation ? currentStep.validation(messageText, attachments) : true;
            if (!isValid) {
                const errorMsg = getTranslation({
                    my: "❌ မှားယွင်းနေပါသည်။ ပြန်လည်ရိုက်ပေးပါ။",
                    en: "❌ Invalid input. Please try again.",
                    th: "❌ ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
                }, currentLang);
                const errorReply = `${errorMsg}\n\n${getTranslation(currentStep.question, currentLang)}`;
                await saveReplyMessage(conversation, flow, errorReply);
                // Helper for generating interactive message in early returns
                const getErrorInteractive = () => {
                    if (currentStep.options && currentStep.options.length > 0) {
                        return {
                            text: errorReply,
                            quick_replies: currentStep.options.slice(0, 13).map((opt) => ({
                                content_type: "text",
                                title: getTranslation(opt.label, currentLang).substring(0, 20),
                                payload: opt.value
                            }))
                        };
                    }
                    return null;
                };
                return {
                    reply: errorReply,
                    interactive_message: getErrorInteractive(),
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
            // Stock validation: reject quantity exceeding stock
            if (currentStep.field === 'quantity' && tempData._qty_exceeds_stock) {
                const stock = tempData._stock || 0;
                delete tempData.quantity;
                delete tempData._qty_exceeds_stock;
                const stockErrorReply = `❌ Stock မလုံလောက်ပါ!\n\n` +
                    `📦 လက်ကျန် Stock: ${stock} ခု\n` +
                    `သင်တောင်းဆိုသော အရေအတွက်: ${transformedValue} ခု\n\n` +
                    `${stock} ခု သို့မဟုတ် ထို့အောက် ပြန်ရိုက်ပေးပါ 🔢`;
                await saveReplyMessage(conversation, flow, stockErrorReply);
                return {
                    reply: stockErrorReply,
                    interactive_message: null, // Quantity usually doesn't have buttons
                    temp_data: tempData,
                    order_complete: false,
                    business_type: businessType,
                };
            }
            // Handle branching for confirmation "No"
            if (currentStep.field === 'confirmation' && transformedValue === 'No') {
                delete tempData.item_name;
                delete tempData.product_name;
                delete tempData.item_id;
                delete tempData.confirmation;
                // We'll let the next step selection logic pick item_name again
            }
        }
    }
    // 🔥 Mark trigger as processed after the first run (moved outside the validation block)
    if (isNewTrigger) {
        tempData._trigger_processed = true;
    }
    // After saving, re-evaluate active steps (skipIf may change based on new data)
    // After saving, strictly re-evaluate mergedSteps so dynamic question strings (like confirmation)
    // use the LATEST data we just saved.
    const finalMergedSteps = baseSteps
        .map((step) => {
        const override = metadata.steps?.[step.field];
        // Online Shop Product Logic
        if (step.field === 'item_name') {
            // 🛍️ If merchant has products, show numbered menu
            if (products.length > 0) {
                const emojiNums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
                const menuLines = products.map((p, i) => {
                    const num = emojiNums[i] || `${i + 1}.`;
                    const desc = p.description ? `\n   📝 ${p.description}` : '';
                    const price = p.price ? `\n   💰 ${Number(p.price).toLocaleString()} ${p.currency || 'MMK'}` : '';
                    const stock = p.stock != null ? `  📦 ${p.stock} ခု` : '';
                    return `${num} ${p.name}${desc}${price}${stock}`;
                });
                const menuText = menuLines.join('\n\n');
                const menuQuestion = {
                    my: `ဝယ်ချင်သည့် ပစ္စည်း ရွေးပေးပါ 🛍️\n━━━━━━━━━━━━━\n\n${menuText}\n\n━━━━━━━━━━━━━\n(နံပါတ် သို့ ပစ္စည်းအမည် ရိုက်ပါ)`,
                    en: `Please select an item 🛍️\n━━━━━━━━━━━━━\n\n${menuText}\n\n━━━━━━━━━━━━━\n(Type the number or item name)`,
                    th: `กรุณาเลือกสินค้า 🛍️\n━━━━━━━━━━━━━\n\n${menuText}\n\n━━━━━━━━━━━━━\n(พิมพ์หมายเลข หรือชื่อสินค้า)`
                };
                const menuOptions = products.map((p, i) => ({
                    label: p.name.substring(0, 20),
                    value: `${i + 1}`
                }));
                return {
                    ...step,
                    question: menuQuestion,
                    options: menuOptions,
                    validation: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= products.length)
                            return true;
                        const lowerV = v.toLowerCase().trim();
                        return products.some((p) => p.name.toLowerCase().includes(lowerV) ||
                            lowerV.includes(p.name.toLowerCase()));
                    },
                    transform: (v) => {
                        let match = null;
                        const n = parseInt(v);
                        if (n >= 1 && n <= products.length) {
                            match = products[n - 1];
                        }
                        else {
                            const lowerV = v.toLowerCase().trim();
                            match = products.find((p) => p.name.toLowerCase().includes(lowerV) ||
                                lowerV.includes(p.name.toLowerCase()));
                        }
                        if (match) {
                            tempData.item_id = match.id;
                            tempData.product_name = match.name;
                            tempData.item_price = match.price;
                            tempData.currency = match.currency;
                            tempData.item_image = match.image_url;
                            tempData.item_desc = match.description;
                            tempData.item_variants = match.variants;
                            tempData._stock = match.stock;
                            return match.name;
                        }
                        return v;
                    }
                };
            }
            // No products — free text entry with matching
            return {
                ...step,
                transform: (v) => {
                    const lowerV = v.toLowerCase().trim();
                    const match = products.find((p) => p.name.toLowerCase().includes(lowerV) ||
                        lowerV.includes(p.name.toLowerCase()));
                    if (match) {
                        tempData.item_id = match.id;
                        tempData.product_name = match.name;
                        tempData.item_price = match.price;
                        tempData.currency = match.currency;
                        tempData.item_image = match.image_url;
                        tempData.item_desc = match.description;
                        tempData.item_variants = match.variants;
                        tempData._stock = match.stock;
                    }
                    else {
                        delete tempData.item_id;
                        delete tempData.product_name;
                        delete tempData.item_price;
                        delete tempData.item_image;
                        delete tempData.item_desc;
                        delete tempData.item_variants;
                        delete tempData._stock;
                    }
                    return v;
                }
            };
        }
        // Stock-aware quantity validation (second pass)
        if (step.field === 'quantity' && tempData._stock != null) {
            const availableStock = tempData._stock;
            return {
                ...step,
                question: `အရေအတွက် မည်မျှ လိုချင်လဲ? 🔢\n\n📦 Stock ကျန်: ${availableStock} ခု`,
                validation: (v) => {
                    const n = parseInt(v);
                    return !isNaN(n) && n > 0;
                },
                transform: (v) => {
                    const n = parseInt(v);
                    if (n > availableStock) {
                        tempData._qty_exceeds_stock = true;
                        return n;
                    }
                    delete tempData._qty_exceeds_stock;
                    return n;
                }
            };
        }
        if (step.field === 'confirmation') {
            if (tempData.item_id) {
                const price = (tempData.item_price || 0).toLocaleString();
                const currency = tempData.currency || 'MMK';
                const desc = tempData.item_desc ? `\n📝 ${tempData.item_desc}` : '';
                const image = tempData.item_image ? `\n🖼️ [Product Image]` : '';
                return {
                    ...step,
                    question: `ဒီပစ္စည်းကို ဆိုလိုတာပါသလား? ✅\n\n📌 ${tempData.product_name}\n💰 ဈေးနှုန်း: ${price} ${currency}${desc}${image}\n\n(1) ဝယ်မည်\n(2) မှားနေသည် (ပြန်ရိုက်မည်)`
                };
            }
            else {
                return {
                    ...step,
                    question: `ပစ္စည်းအမည် "${tempData.item_name}" အမှန်ပဲလား? ✅\n\n(1) အမှန်\n(2) မှားနေသည် (ပြန်ရိုက်မည်)`
                };
            }
        }
        if (step.field === 'size' || step.field === 'color') {
            if (tempData.item_id && tempData.item_variants) {
                return {
                    ...step,
                    question: `${step.question}\n\n(သတ်မှတ်ထားသော variants: ${tempData.item_variants})`
                };
            }
        }
        // Cargo Rates Logic
        if (businessType === 'cargo' && rates.length > 0) {
            if (step.field === 'country') {
                const countries = Array.from(new Set(rates.map(r => r.country))).sort();
                const countryList = countries.map((c, i) => `${i + 1}️⃣ ${c}`).join('\n');
                return {
                    ...step,
                    question: `ပစ္စည်း ဘယ်နိုင်ငံကနေ ပို့မှာလဲ? 🌏\n\n${countryList}\n\n(နံပါတ် သို့မဟုတ် နိုင်ငံအမည် ရိုက်ပါ)`,
                    validation: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= countries.length)
                            return true;
                        return countries.some(c => v.includes(c));
                    },
                    transform: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= countries.length)
                            return countries[n - 1];
                        return countries.find(c => v.includes(c)) || v;
                    }
                };
            }
            if (step.field === 'shipping' && tempData.country) {
                const countryRates = rates.filter(r => r.country === tempData.country);
                const types = Array.from(new Set(countryRates.map(r => r.shipping_type))).sort();
                const typeList = types.map((t, i) => `${i + 1}️⃣ ${t}`).join('\n');
                return {
                    ...step,
                    question: `ပို့ဆောင်မှု အမျိုးအစား ရွေးပါ ✈️🚢\n\n${typeList}\n\n(နံပါတ် သို့မဟုတ် အမျိုးအစား ရိုက်ပါ)`,
                    validation: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= types.length)
                            return true;
                        return types.some(t => v.includes(t));
                    },
                    transform: (v) => {
                        const n = parseInt(v);
                        if (n >= 1 && n <= types.length)
                            return types[n - 1];
                        return types.find(t => v.includes(t)) || v;
                    }
                };
            }
            if (step.field === 'item_type' && tempData.country && tempData.shipping) {
                const filteredRates = rates.filter(r => r.country === tempData.country && r.shipping_type === tempData.shipping);
                const categories = Array.from(new Set(filteredRates.map(r => r.item_category)));
                if (categories.length > 0) {
                    const catList = categories.map((c, i) => `${i + 1}️⃣ ${c}`).join('\n');
                    return {
                        ...step,
                        question: `ပစ္စည်းအမျိုးအစား ရွေးပေးပါ 📦\n\n${catList}\n\n(နံပါတ် သို့မဟုတ် အမျိုးအစား ရိုက်ပေးပါ)`,
                        validation: (v) => {
                            const n = parseInt(v);
                            if (n >= 1 && n <= categories.length)
                                return true;
                            return categories.some(c => v.toLowerCase().includes(c.toLowerCase()));
                        },
                        transform: (v) => {
                            const n = parseInt(v);
                            const selectedCat = (n >= 1 && n <= categories.length)
                                ? categories[n - 1]
                                : categories.find(c => v.toLowerCase().includes(c.toLowerCase()));
                            if (selectedCat) {
                                const matchingRate = filteredRates.find(r => r.item_category === selectedCat);
                                if (matchingRate) {
                                    tempData.rate_per_kg = matchingRate.rate_per_kg;
                                    tempData.currency = matchingRate.currency;
                                }
                                return selectedCat;
                            }
                            return v;
                        }
                    };
                }
            }
        }
        if (!override)
            return step;
        return {
            ...step,
            question: override.question || step.question,
            options: override.options || step.options,
            enabled: override.enabled !== undefined ? override.enabled : true
        };
    })
        .filter((step) => step.enabled !== false);
    const updatedActiveSteps = getActiveSteps(finalMergedSteps, tempData);
    // Auto-skip steps that should be skipped and fill default values
    for (const step of finalMergedSteps) {
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
    const allComplete = updatedActiveSteps.every((step) => {
        if (step.type === 'media' && step.requiredCount) {
            return (tempData[step.field] || []).length >= step.requiredCount;
        }
        return tempData[step.field] !== undefined;
    });
    let reply;
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
        }
        else {
            reply = getTranslation(flowDef.completionMessage(tempData, orderNo), currentLang);
        }
        isComplete = true;
        // Store the order number in temp_data for downstream
        // Renamed from _order_no to order_no to ensure it's saved in DB
        tempData.order_no = orderNo;
        await supabaseAdmin
            .from("conversations")
            .update({ temp_data: tempData })
            .eq("id", conversation.id);
    }
    else {
        // Find next unanswered or incomplete step
        const nextStep = updatedActiveSteps.find((step) => {
            if (step.type === 'media' && step.requiredCount) {
                return (tempData[step.field] || []).length < step.requiredCount;
            }
            return !tempData[step.field];
        });
        if (nextStep) {
            const completedCount = updatedActiveSteps.filter((s) => {
                if (s.type === 'media' && s.requiredCount) {
                    return (tempData[s.field] || []).length >= s.requiredCount;
                }
                return tempData[s.field] !== undefined;
            }).length;
            const totalCount = updatedActiveSteps.length;
            const flowProgress = `📊 ${completedCount + 1}/${totalCount}`;
            if (nextStep.type === 'media' && nextStep.requiredCount) {
                const currentMediaCount = (tempData[nextStep.field] || []).length;
                const mediaProgress = currentLang === 'my' ? `📸 ${currentMediaCount}/${nextStep.requiredCount} ပုံ ရရှိပြီးပါပြီ` :
                    currentLang === 'th' ? `📸 ได้รับรูปภาพแล้ว ${currentMediaCount}/${nextStep.requiredCount} รูป` :
                        `📸 Received ${currentMediaCount}/${nextStep.requiredCount} media`;
                const warnTipMM = "⚠️ (စာမဟုတ်ဘဲ ပစ္စည်းပုံ သီးသန့် ပို့ပေးပါခင်ဗျာ)\n\n";
                const warnTipEN = "⚠️ (Please send only item photos, no text)\n\n";
                const warnTipTH = "⚠️ (กรุณาส่งเฉพาะรูปภาพสินค้าเท่านั้น ไม่ต้องส่งข้อความ)\n\n";
                const warnTip = tempData[`_warn_${nextStep.field}`] ? (currentLang === 'my' ? warnTipMM : currentLang === 'th' ? warnTipTH : warnTipEN) : "";
                reply = `${flowProgress}\n\n${mediaProgress}\n\n${warnTip}${getTranslation(nextStep.question, currentLang)}`;
            }
            else {
                let nextQuestion = getTranslation(nextStep.question, currentLang);
                reply = `${flowProgress}\n\n${nextQuestion}`;
            }
        }
        else {
            reply = getTranslation(flowDef.incompleteMessage, currentLang);
        }
    }
    // Save assistant reply
    await saveReplyMessage(conversation, flow, reply);
    // Generate Interactive Message if there are options
    let interactiveMessage = null;
    const nextStep = updatedActiveSteps.find((step) => {
        if (step.type === 'media' && step.requiredCount) {
            return (tempData[step.field] || []).length < step.requiredCount;
        }
        return !tempData[step.field];
    });
    if (nextStep && nextStep.options && nextStep.options.length > 0) {
        // We use Quick Replies for step options as it's more mobile-friendly
        interactiveMessage = {
            text: reply,
            quick_replies: nextStep.options.slice(0, 13).map((opt) => ({
                content_type: "text",
                title: getTranslation(opt.label, currentLang).substring(0, 20),
                payload: opt.value
            }))
        };
    }
    return {
        reply,
        interactive_message: interactiveMessage,
        temp_data: tempData,
        order_complete: isComplete,
        business_type: businessType,
        image_url: tempData.item_image || null,
    };
}
// ─── Helper: Save reply message ──────────────────────────────────
async function saveReplyMessage(conversation, flow, reply) {
    try {
        await supabaseAdmin.from("messages").insert({
            user_id: flow.merchant_id || conversation.merchant_id,
            sender_id: flow.merchant_id || conversation.merchant_id,
            sender_email: "AI-Assistant",
            sender_name: "Auto-Reply Bot",
            body: reply,
            // content: reply, 
            channel: "facebook",
            status: "replied",
            created_at: new Date().toISOString(),
            // conversation_id: conversation.id,
            metadata: { conversation_id: conversation.id },
        });
    }
    catch (err) {
        console.warn("⚠️ Failed to save reply message log", err);
    }
}
