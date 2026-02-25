import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
dotenv.config();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function resubscribeAll() {
    console.log("📡 Re-subscribing all pages...");
    const { data: conns, error } = await supabaseAdmin.from("platform_connections").select("*");
    if (error)
        throw error;
    for (const conn of conns) {
        console.log(`🔗 Page: ${conn.page_name} (${conn.page_id})`);
        try {
            const response = await fetch(`https://graph.facebook.com/v21.0/${conn.page_id}/subscribed_apps`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    access_token: conn.page_access_token,
                    subscribed_fields: ["messages", "messaging_postbacks", "messaging_optins", "message_deliveries", "message_reads"],
                }),
            });
            const resData = await response.json();
            if (response.ok) {
                console.log(`✅ Success: ${JSON.stringify(resData)}`);
            }
            else {
                console.error(`❌ Failed: ${JSON.stringify(resData)}`);
            }
        }
        catch (err) {
            console.error(`🔴 Error: ${err.message}`);
        }
    }
}
resubscribeAll();
