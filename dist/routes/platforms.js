import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { getFacebookAuthUrl, subscribePageToWebhook } from "../services/facebook.services.js";
const router = Router();
/**
 * GET /api/platforms
 * Get all connected platforms for the user
 */
router.get("/", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabaseAdmin
            .from("platform_connections")
            .select("page_id, page_name, platform")
            .eq("user_id", userId);
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (err) {
        console.error("Fetch platforms error:", err.message);
        res.status(500).json({ error: "Failed to fetch platforms" });
    }
});
/**
 * POST /api/platforms/connect
 * Get the Facebook Auth URL
 * ENFORCES: 1 page per account — if user already has a page, block new connections
 */
router.post("/connect", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        // Check if user already has a connected page
        const { data: existingPages } = await supabaseAdmin
            .from("platform_connections")
            .select("page_id, page_name")
            .eq("user_id", userId);
        if (existingPages && existingPages.length > 0) {
            return res.status(400).json({
                error: `သင့်အကောင့်မှာ "${existingPages[0].page_name}" page ချိတ်ဆက်ပြီးသားဖြစ်ပါတယ်။ Page အသစ်ချိတ်ဆက်ရန် လက်ရှိ page ကို disconnect လုပ်ပါ။`,
                code: "PAGE_LIMIT_REACHED"
            });
        }
        const url = getFacebookAuthUrl(userId);
        res.json({ url });
    }
    catch (err) {
        console.error("Connect error:", err.message);
        res.status(500).json({ error: "Failed to generate auth URL" });
    }
});
/**
 * DELETE /api/platforms/:pageId
 * Disconnect a page AND clean up all related auto-reply data
 */
router.delete("/:pageId", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { pageId } = req.params;
        // 1. Delete the platform connection
        const { error } = await supabaseAdmin
            .from("platform_connections")
            .delete()
            .eq("user_id", userId)
            .eq("page_id", pageId);
        if (error)
            throw error;
        // 2. Delete ALL automation flows for this user
        const { error: flowError } = await supabaseAdmin
            .from("automation_flows")
            .delete()
            .eq("merchant_id", userId);
        if (flowError) {
            console.error("Failed to delete automation flows:", flowError);
        }
        // 3. Delete ALL auto-reply templates for this user
        const { error: templateError } = await supabaseAdmin
            .from("auto_reply_templates")
            .delete()
            .eq("merchant_id", userId);
        if (templateError) {
            console.error("Failed to delete auto-reply templates:", templateError);
        }
        // 4. Delete ALL auto-reply rules for this user
        const { error: ruleError } = await supabaseAdmin
            .from("auto_reply_rules")
            .delete()
            .eq("merchant_id", userId);
        if (ruleError) {
            console.error("Failed to delete auto-reply rules:", ruleError);
        }
        // 5. Clear page_id from merchant profile
        await supabaseAdmin
            .from("merchants")
            .update({ page_id: null })
            .eq("id", userId);
        console.log(`🧹 Cleaned up all data for user ${userId} after page ${pageId} disconnect`);
        res.json({
            success: true,
            message: "Page disconnected and all auto-reply data cleaned up successfully."
        });
    }
    catch (err) {
        console.error("Disconnect error:", err.message);
        res.status(500).json({ error: "Failed to disconnect platform" });
    }
});
/**
 * POST /platforms/:pageId/sync
 * Manually re-subscribe a page to webhooks
 */
router.post("/:pageId/sync", requireAuth, async (req, res) => {
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
    }
    catch (err) {
        console.error("Sync error:", err.message);
        res.status(500).json({ error: "Failed to sync page" });
    }
});
export default router;
