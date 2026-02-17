import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function deepInspect() {
    console.log("🕵️ Deep Database Inspection...");

    // 1. Check schemas
    const tables = ["messages", "conversations", "automation_flows", "platform_connections"];
    for (const table of tables) {
        console.log(`\n--- Schema for: ${table} ---`);
        const { data, error } = await supabaseAdmin.from(table).select("*").limit(1);
        if (error) {
            console.error(`❌ Error reading ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log("Fields:", Object.keys(data[0]));
        } else {
            console.log("Table is empty, cannot infer fields easily from data.");
        }
    }

    // 2. Check for ANY message from today
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n🔍 Checking for messages created today (${today})...`);
    const { data: recentMsgs } = await supabaseAdmin
        .from("messages")
        .select("*")
        .gte("created_at", today)
        .order("created_at", { ascending: false });

    if (!recentMsgs || recentMsgs.length === 0) {
        console.log("ℹ️ No messages found for today.");
    } else {
        console.log(`✅ Found ${recentMsgs.length} messages today:`);
        recentMsgs.forEach(m => {
            console.log(`- [${m.role}] ${m.content.substring(0, 30)}... | Conv: ${m.conversation_id}`);
        });
    }

    // 3. Try a dummy insert into conversations to see if it fails
    console.log("\n🧪 Testing dummy conversation insert...");
    const { data: dummy, error: dummyError } = await supabaseAdmin
        .from("conversations")
        .insert({
            merchant_id: "40b42079-6636-4b09-b9c9-db9ec0d40b75",
            page_id: "100530332303174",
            user_psid: "test_dummy_psid_" + Date.now(),
            status: "active",
            temp_data: {}
        })
        .select();

    if (dummyError) {
        console.error("❌ Dummy Insert Failed:", dummyError.message);
    } else {
        console.log("✅ Dummy Insert Succeeded:", dummy[0].id);
        // Cleanup
        await supabaseAdmin.from("conversations").delete().eq("id", dummy[0].id);
        console.log("🗑️ Dummy Cleanup Done.");
    }
}

deepInspect().catch(console.error);
