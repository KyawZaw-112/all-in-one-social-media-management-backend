import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { supabaseAdmin } from "../supabaseAdmin.js";

async function migrate() {
    console.log("🚀 Running migration to add columns to 'messages'...");

    // Since we don't have a direct 'exec_sql' RPC, we'll try to insert a test row 
    // to verify if columns exist, and then explain to the user if we can't fix it.
    // BUT! I can try to use a common trick: some Supabase environments have an RPC for this.

    const { error } = await supabaseAdmin.from("messages").select("conversation_id, role").limit(1);

    if (error && error.message.includes("column")) {
        console.log("❌ Missing columns detected. Please run this SQL in your Supabase Dashboard:");
        console.log(`
            ALTER TABLE messages 
            ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id),
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
            
            ALTER TABLE messages RENAME COLUMN body TO content; -- OR just use body in code
        `);

        // Let's try to adapt the code to use 'body' and just skip 'role' for now?
        // No, 'role' is needed. 
    } else {
        console.log("✅ Columns already exist or another error occurred.");
    }
}

migrate().catch(console.error);
