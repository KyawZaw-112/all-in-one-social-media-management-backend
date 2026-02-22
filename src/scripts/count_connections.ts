import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function countConnections() {
    const { count, error } = await supabaseAdmin
        .from("platform_connections")
        .select("*", { count: 'exact', head: true });

    if (error) console.error("❌ Error:", error);
    else {
        console.log(`📊 TOTAL PLATFORM CONNECTIONS: ${count}`);
    }
}

countConnections();
