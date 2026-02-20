import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function listTables() {
    const { supabaseAdmin } = await import("../supabaseAdmin.js");
    // Query information_schema to see all public tables
    const { data, error } = await supabaseAdmin.rpc('get_tables'); // We might not have this RPC
    // Fallback: try to select from common tables to see what fails
    console.log("Listing tables via direct query...");
    const { data: tables, error: sqlError } = await supabaseAdmin
        .from('pg_catalog.pg_tables') // This might not work via JS client
        .select('tablename')
        .eq('schemaname', 'public');
    if (sqlError) {
        console.error("❌ Error listing tables:", sqlError.message);
        return;
    }
    console.log("Current tables in public schema:", tables.map(t => t.tablename));
}
listTables().catch(err => console.error(err));
