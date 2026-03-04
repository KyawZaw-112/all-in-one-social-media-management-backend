import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
    try {
        // Note: The recent SDK versions might not have a direct listModels method on the genAI instance
        // depending on the version. Let's try the common way.
        console.log("🔍 Fetching model list...");
        // Actually, let's just try gemini-1.5-flash with models/ prefix
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("✅ Basic Test Success with gemini-1.5-flash");
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        console.log("Trying gemini-pro...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hello");
            console.log("✅ Basic Test Success with gemini-pro");
        } catch (err2) {
            console.error("❌ gemini-pro also failed:", err2.message);
        }
    }
}

listModels();
