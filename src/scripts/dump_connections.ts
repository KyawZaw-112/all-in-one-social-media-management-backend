import "../env.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

async function dumpConnections() {
    console.log("🔍 Dumping all platform_connections...");
    const { data, error } = await supabaseAdmin
        .from("platform_connections")
        .select("*");

    if (error) console.error("❌ Error:", error);
    else {
        console.log(JSON.stringify(data, null, 2));
    }
}

dumpConnections();
