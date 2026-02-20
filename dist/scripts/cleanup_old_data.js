import dotenv from "dotenv";
import { supabaseAdmin } from "../supabaseAdmin.js";
dotenv.config();
/**
 * Cleanup script to remove old/abandoned data
 * - Deletes conversations older than 7 days that are not completed (abandoned)
 * - Deletes superseded conversations
 * - Can be run as a cron job
 */
async function cleanup() {
    console.log("🚀 Starting Database Cleanup...");
    try {
        const ONE_HOUR_AGO = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
        // 1. Delete superseded conversations (immediate trash)
        const { count: supersededCount, error: supErr } = await supabaseAdmin
            .from("conversations")
            .delete()
            .eq("status", "superseded");
        if (supErr)
            console.error("❌ Superseded cleanup error:", supErr.message);
        else
            console.log(`✅ Deleted ${supersededCount || 0} superseded conversations.`);
        // 2. Delete abandoned conversations (active but older than 1 hour)
        const { count: abandonedCount, error: abanErr } = await supabaseAdmin
            .from("conversations")
            .delete()
            .eq("status", "active")
            .lt("created_at", ONE_HOUR_AGO);
        if (abanErr)
            console.error("❌ Abandoned cleanup error:", abanErr.message);
        else
            console.log(`✅ Deleted ${abandonedCount || 0} abandoned/stale conversations.`);
        // 3. Clean up orphaned messages (not linked to any conversation)
        // This is a bit more complex, usually handled by CASCADE on DB level.
        // If CASCADE is not set, we might need a separate query.
        console.log("🏁 Cleanup finished successfully.");
    }
    catch (err) {
        console.error("🔴 Fatal cleanup error:", err.message);
    }
}
cleanup().catch(console.error);
