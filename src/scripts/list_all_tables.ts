import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function listTables() {
    console.log("🔍 Listing all tables in 'public' schema...");

    // Attempt to list tables using a query that is likely to work in Supabase
    const { data, error } = await supabaseAdmin
        .from("pg_catalog.pg_tables")
        .select("tablename")
        .eq("schemaname", "public");

    if (error) {
        console.log("ℹ️ Direct pg_tables query failed (Expected). Trying RPC or common table names...");
        const commonTables = ["messages", "conversation_messages", "chat_messages", "user_messages", "bot_messages", "history"];
        for (const t of commonTables) {
            const { error: e } = await supabaseAdmin.from(t).select("count", { count: "exact", head: true });
            if (!e) {
                console.log(`✅ Table '${t}' EXISTS.`);
            }
        }
    } else {
        console.log("Tables:", data.map(t => t.tablename));
    }
}

listTables().catch(console.error);
