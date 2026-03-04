import dotenv from "dotenv";
dotenv.config();
console.log("🛠️ Debugging Environment Variables...");
const key = process.env.GEMINI_API_KEY;
if (key) {
    console.log(`✅ GEMINI_API_KEY found. Length: ${key.length}`);
    console.log(`🔹 First 5: ${key.substring(0, 5)}...`);
    console.log(`🔹 Last 5: ...${key.substring(key.length - 5)}`);
}
else {
    console.log("❌ GEMINI_API_KEY NOT FOUND!");
}
