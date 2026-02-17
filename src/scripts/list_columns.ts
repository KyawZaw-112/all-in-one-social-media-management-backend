import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function listColumns() {
    console.log("🔍 Listing columns for 'messages' table...");

    // We try to use query instead of RPC if get_table_columns doesn't exist
    const { data, error } = await supabaseAdmin.rpc('get_table_columns_v2', { t_name: 'messages' }); // Try RPC first if exists

    if (error) {
        // Fallback to direct SQL if RPC fails (Note: select from pg_catalog might require postgres user, 
        // but we can try common variations)
        console.log("ℹ️ RPC failed, trying dummy insert with variations...");
        const variations = ["text", "message", "body", "content_text"];
        for (const v of variations) {
            const { error: e } = await supabaseAdmin.from("messages").insert({ [v]: "test" }).limit(1);
            if (e && e.message.includes("Could not find the") && e.message.includes("column")) {
                continue;
            } else if (e) {
                console.log(`Column '${v}' might exist but: ${e.message}`);
                if (!e.message.includes("column")) {
                    console.log(`✅ FOUND IT? Column '${v}' exists!`);
                    return;
                }
            } else {
                console.log(`✅ Column '${v}' exists!`);
                return;
            }
        }
    } else {
        console.log("Columns:", data);
    }
}

listColumns().catch(console.error);
