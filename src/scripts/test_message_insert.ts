import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function testMessageInsert() {
    console.log("🧪 Testing Message Insert...");

    // Try to find a valid conversation first
    const { data: conv } = await supabaseAdmin.from("conversations").select("id").limit(1).single();
    if (!conv) {
        console.error("❌ No conversation found to link message to.");
        return;
    }

    console.log(`Using Conversation ID: ${conv.id}`);

    const payload = {
        conversation_id: conv.id,
        role: "user",
        content: "Test message from debug script"
    };

    const { data, error } = await supabaseAdmin.from("messages").insert(payload).select();

    if (error) {
        console.error("❌ Insert Failed!");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        console.error("Error Hint:", error.hint);
        console.error("Error Details:", error.details);
    } else {
        console.log("✅ Insert Succeeded!");
        console.log("New Message:", data[0]);
        // Cleanup
        await supabaseAdmin.from("messages").delete().eq("id", data[0].id);
        console.log("🗑️ Cleanup successful.");
    }
}

testMessageInsert().catch(console.error);
