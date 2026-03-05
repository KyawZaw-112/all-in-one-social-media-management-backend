import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
const getGenAI = () => {
    const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
    if (!key)
        console.warn("⚠️ GEMINI_API_KEY is missing!");
    return new GoogleGenerativeAI(key);
};
export async function generateGeminiResponse(prompt, messageHistory) {
    try {
        const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
        if (!key)
            throw new Error("GEMINI_API_KEY not found in environment");
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const chat = model.startChat({
            history: messageHistory,
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 1024,
                responseMimeType: "application/json",
            },
        });
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();
        try {
            return JSON.parse(text);
        }
        catch (parseError) {
            console.error("❌ Gemini JSON Parse Error:", text);
            return {
                reply: text,
                data: {},
                order_complete: false
            };
        }
    }
    catch (error) {
        console.error("❌ Gemini API Error:", error.message);
        throw error;
    }
}
export async function generateResponse(prompt) {
    try {
        const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
        if (!key)
            throw new Error("GEMINI_API_KEY not found in environment");
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
    catch (error) {
        console.error("❌ Gemini Response Error:", error.message);
        return "";
    }
}
export const geminiService = {
    generateGeminiResponse,
    generateResponse,
};
export default geminiService;
