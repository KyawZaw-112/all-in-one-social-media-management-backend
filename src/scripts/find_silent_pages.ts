import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function findSilentPages() {
    console.log("🔍 Finding pages with NO message activity...");

    const { data: connections, error: connError } = await supabaseAdmin
        .from("platform_connections")
        .select("user_id, page_id, page_name");

    if (connError) {
        console.error("❌ Conn Error:", connError);
        return;
    }

    for (const conn of connections) {
        const { count, error: countError } = await supabaseAdmin
            .from("messages")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", conn.user_id);

        if (countError) {
            console.error(`❌ Error counting for ${conn.page_name}:`, countError);
            continue;
        }

        if (count === 0) {
            console.log(`🔇 SILENT PAGE: ${conn.page_name} (ID: ${conn.page_id}, User: ${conn.user_id})`);
        } else {
            console.log(`🔊 Active page: ${conn.page_name} (ID: ${conn.page_id}, Messages: ${count})`);
        }
    }
}

findSilentPages();
