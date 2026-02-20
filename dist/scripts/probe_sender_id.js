import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";
async function probeSenderId() {
    console.log("🕵️ Probing 'sender_id' column...");
    const merchantId = "40b42079-6636-4b09-b9c9-db9ec0d40b75";
    // Try UUID first (merchantId)
    const payloadUUID = {
        user_id: merchantId,
        sender_id: merchantId, // <--- TRY UUID
        body: "Test probe UUID",
        status: "received",
        channel: "facebook"
    };
    console.log("Trying UUID...");
    const { error: error1 } = await supabaseAdmin.from("messages").insert(payloadUUID);
    if (error1) {
        console.log("❌ UUID Failed:", error1.message);
        // Try String (PSID-like)
        const payloadString = {
            user_id: merchantId,
            sender_id: "test_psid_123", // <--- TRY STRING
            body: "Test probe String",
            status: "received",
            channel: "facebook"
        };
        console.log("Trying String...");
        const { error: error2 } = await supabaseAdmin.from("messages").insert(payloadString);
        if (error2) {
            console.log("❌ String Failed:", error2.message);
        }
        else {
            console.log("✅ String Succeeded!");
        }
    }
    else {
        console.log("✅ UUID Succeeded!");
    }
}
probeSenderId().catch(console.error);
