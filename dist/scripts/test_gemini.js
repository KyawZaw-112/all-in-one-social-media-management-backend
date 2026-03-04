import { generateGeminiResponse } from "../services/gemini.service.js";
import dotenv from "dotenv";
dotenv.config();
async function testGemini() {
    console.log("🧪 Testing Gemini Integration...");
    const prompt = `You are an online shop assistant. Extract info: product_name, quantity. Return JSON.`;
    const history = [
        { role: "user", parts: [{ text: "မင်္ဂလာပါ၊ ကော်ဖီ ၃ ထုပ် လိုချင်ပါတယ်" }] }
    ];
    try {
        const result = await generateGeminiResponse(prompt, history);
        console.log("✅ Gemini Response:", JSON.stringify(result, null, 2));
        if (result.data && result.data.quantity) {
            console.log("🚀 Extraction Success!");
        }
        else {
            console.log("⚠️ Extraction failed to find data, but connection worked.");
        }
    }
    catch (error) {
        console.error("❌ Gemini Test Failed:", error.message);
    }
}
testGemini();
