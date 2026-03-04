import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    console.log(`🔍 Listing models for key starting with: ${key?.substring(0, 7)}`);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        if (data.models) {
            console.log("✅ Models found in v1beta:");
            data.models.forEach((m) => console.log(` - ${m.name}`));
        }
        else {
            console.log("❌ No models in v1beta or error:", JSON.stringify(data));
        }
        const responseV1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
        const dataV1 = await responseV1.json();
        if (dataV1.models) {
            console.log("✅ Models found in v1:");
            dataV1.models.forEach((m) => console.log(` - ${m.name}`));
        }
        else {
            console.log("❌ No models in v1 or error:", JSON.stringify(dataV1));
        }
    }
    catch (error) {
        console.error("💥 Fetch failed:", error.message);
    }
}
listModels();
