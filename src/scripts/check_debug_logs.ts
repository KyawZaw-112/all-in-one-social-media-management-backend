import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkLogs() {
    console.log("🔍 Checking for recent SYSTEM_DEBUG logs in 'messages' table...");

    const { data, error } = await supabaseAdmin
        .from("messages")
        .select("created_at, body")
        .eq("sender_id", "SYSTEM_DEBUG")
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("❌ Error fetching logs:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("ℹ️ No debug logs found. Is the webhook actually receiving data?");
        return;
    }

    data.forEach((log, i) => {
        try {
            const body = JSON.parse(log.body);
            const pageId = body.entry?.[0]?.id;
            console.log(`[${i}] ${log.created_at} - Page ID: ${pageId}`);
        } catch (e) {
            console.log(`[${i}] ${log.created_at} - Raw: ${log.body.substring(0, 100)}...`);
        }
    });
}

checkLogs();
