// src/env.ts - Load this FIRST in server.ts
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load .env from project root
dotenv.config({ path: join(__dirname, "..", ".env") });
// Validate required env vars
const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingEnvVars.forEach((key) => console.error(`  - ${key}`));
    console.error("\n💡 Make sure you have a .env file in the backend directory");
    process.exit(1);
}
console.log("✅ Environment variables loaded successfully");
console.log("📍 SUPABASE_URL:", process.env.SUPABASE_URL?.substring(0, 30) + "...");
