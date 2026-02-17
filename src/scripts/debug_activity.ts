import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkRecentActivity() {
    const merchantId = "40b42079-6636-4b09-b9c9-db9ec0d40b75";
    console.log(`🔍 Debugging Activity for Merchant: ${merchantId}`);

    // 1. Check recent conversations
    const { data: convs } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(5);

    console.log("\n--- Recent Conversations ---");
    if (!convs || convs.length === 0) {
        console.log("None found.");
    } else {
        convs.forEach(c => console.log(`[${c.status}] ID: ${c.id} | Created: ${c.created_at}`));
    }

    // 2. Check ALL recent messages
    const { data: msgs } = await supabaseAdmin
        .from("messages")
        .select("*, conversations(merchant_id)")
        .order("created_at", { ascending: false })
        .limit(10);

    console.log("\n--- Recent Messages (Across All Conversations) ---");
    if (!msgs || msgs.length === 0) {
        console.log("None found.");
    } else {
        msgs.forEach(m => {
            console.log(`[${m.role.toUpperCase()}] ${m.content.substring(0, 50)}... (Conv: ${m.conversation_id})`);
        });
    }

    // 3. Check Flows
    const { data: flows } = await supabaseAdmin
        .from("automation_flows")
        .select("*")
        .eq("merchant_id", merchantId);

    console.log("\n--- Automation Flows ---");
    flows?.forEach(f => console.log(`Keyword: '${f.trigger_keyword}' | Active: ${f.is_active} | Business: ${f.business_type}`));
}

checkRecentActivity().catch(console.error);
