import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";
async function testConvMsgInsert() {
    console.log("🧪 Testing conversation_messages Insert...");
    const { data: conv } = await supabaseAdmin.from("conversations").select("id").limit(1).single();
    if (!conv) {
        console.error("❌ No conversation found.");
        return;
    }
    const payload = {
        conversation_id: conv.id,
        role: "user",
        content: "Test message for conversation_messages"
    };
    const { data, error } = await supabaseAdmin.from("conversation_messages").insert(payload).select();
    if (error) {
        console.error("❌ Insert Failed:", error.message);
    }
    else {
        console.log("✅ Insert Succeeded:", data[0].id);
        // Cleanup
        await supabaseAdmin.from("conversation_messages").delete().eq("id", data[0].id);
        console.log("🗑️ Cleanup successful.");
    }
}
testConvMsgInsert().catch(console.error);
