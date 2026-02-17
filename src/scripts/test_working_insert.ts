import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function testWorkingInsert() {
    console.log("🧪 Testing Working Message Insert (Schema Compatible)...");

    const merchantId = "40b42079-6636-4b09-b9c9-db9ec0d40b75";

    const payload = {
        user_id: merchantId,
        sender_email: "test_debug@example.com",
        sender_name: "Debug Bot",
        body: "Test working insert " + Date.now(),
        channel: "facebook",
        status: "received",
        created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("messages").insert(payload).select();

    if (error) {
        console.error("❌ Still Failing:", error.message);
    } else {
        console.log("✅ SUCCESS! Message recorded in production 'messages' table.");
        console.log("Message ID:", data[0].id);
        // Cleanup if you want, but maybe leave it for a second to see in dashboard
    }
}

testWorkingInsert().catch(console.error);
