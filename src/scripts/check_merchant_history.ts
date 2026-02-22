import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function checkHistory(merchantId: string) {
    console.log(`🔍 Checking history for Merchant: ${merchantId}`);
    const { data: messages, error } = await supabaseAdmin
        .from("messages")
        .select("sender_name, body, status, created_at, metadata")
        .eq("user_id", merchantId)
        .order("created_at", { ascending: true });

    if (error) console.error("❌ Error:", error);
    else {
        messages.forEach(m => {
            console.log(`[${m.created_at}] ${m.status.toUpperCase()}: ${m.body || '(no body)'}`);
        });
    }
}

// Using the one that had many 'No Reply' logs
checkHistory('6e571264-2886-40d8-8a37-b3ea95cf3809');
