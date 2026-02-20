import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";
async function checkString() {
    const merchantId = "40b42079-6636-4b09-b9c9-db9ec0d40b75";
    const { error } = await supabaseAdmin.from("messages").insert({
        user_id: merchantId,
        sender_id: "test_psid_string",
        body: "Test String Probe",
        status: "received",
        channel: "facebook"
    });
    if (error) {
        console.log("❌ String Failed:", error.message);
    }
    else {
        console.log("✅ String Succeeded!");
    }
}
checkString().catch(console.error);
