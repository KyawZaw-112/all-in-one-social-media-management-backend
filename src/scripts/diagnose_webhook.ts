import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function diagnoseWebhook() {
    console.log("🔍 Diagnosing Webhook Ingress...");

    // 1. Check connections
    const { data: connections } = await supabaseAdmin.from("platform_connections").select("*");
    console.log(`✅ Connections: ${connections?.length || 0}`);
    connections?.forEach(c => {
        console.log(`- Page: ${c.page_name} (${c.page_id}) | User: ${c.user_id}`);
    });

    // 2. Check latest messages for today
    const today = new Date().toISOString().split('T')[0];
    const { data: messages } = await supabaseAdmin
        .from("messages")
        .select("created_at, sender_name, body, user_id, channel")
        .gte("created_at", `${today}T00:00:00Z`)
        .order("created_at", { ascending: false })
        .limit(20);

    console.log(`\n📩 Latest Messages for Today (${today}):`);
    if (!messages || messages.length === 0) {
        console.log("ℹ️ No messages found for today.");
    } else {
        messages.forEach(m => {
            console.log(`[${m.created_at}] From: ${m.sender_name} | Message: ${m.body?.substring(0, 30)} | UserID: ${m.user_id}`);
        });
    }

    // 3. Check for flows
    const { data: flows } = await supabaseAdmin.from("automation_flows").select("merchant_id, name, is_active");
    console.log("\n⚙️ Active Flows:");
    flows?.forEach(f => {
        console.log(`- ${f.name} (Active: ${f.is_active}) | Merchant: ${f.merchant_id}`);
    });
}

diagnoseWebhook().catch(console.error);
