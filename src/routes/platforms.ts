import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { getFacebookAuthUrl, subscribePageToWebhook } from "../services/facebook.services.js";

const router = Router();

// ... (existing routes)

/**
 * POST /platforms/:pageId/sync
 * Manually re-subscribe a page to webhooks
 */
router.post("/:pageId/sync", requireAuth, async (req: any, res) => {
    try {
        const { pageId } = req.params;
        const userId = req.user.id;

        // Get token from db
        const { data: connection, error } = await supabaseAdmin
            .from("platform_connections")
            .select("page_access_token, page_name")
            .eq("user_id", userId)
            .eq("page_id", pageId)
            .maybeSingle();

        if (error || !connection) {
            return res.status(404).json({ error: "Connection not found" });
        }

        console.log(`🔄 Syncing Page: ${connection.page_name} (${pageId})`);
        await subscribePageToWebhook(pageId, connection.page_access_token);

        res.json({ success: true, message: `Page "${connection.page_name}" synced successfully` });
    } catch (err: any) {
        console.error("Sync error:", err.message);
        res.status(500).json({ error: "Failed to sync page" });
    }
});

export default router;
