import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";
async function probe() {
    console.log("🕵️ Probing 'messages' table schema...");
    // Try to insert with ALL likely names to see what sticks
    const payload = {
        conversation_id: "516333ce-a126-4f40-86a6-d6872a8fdf57",
        body: "test",
        message: "test",
        content: "test",
        sender_id: "test_sender",
        role: "user",
        type: "text"
    };
    const { error } = await supabaseAdmin.from("messages").insert(payload);
    if (error) {
        console.log("❌ Error:", error.message);
        console.log("Hint:", error.hint);
    }
    else {
        console.log("✅ Insert Succeeded (somehow? This shouldn't happen with dummy data)");
    }
}
probe().catch(console.error);
