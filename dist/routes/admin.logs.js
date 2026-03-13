import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
const router = Router();
// Get all logs for the authenticated merchant
router.get("/", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data, error } = await supabaseAdmin
            .from("system_logs")
            .select("*")
            .eq("merchant_id", userId)
            .order("created_at", { ascending: false })
            .limit(100);
        if (error)
            throw error;
        res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Mark a log as resolved
router.put("/:id/resolve", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from("system_logs")
            .update({ is_resolved: true })
            .eq("id", id)
            .eq("merchant_id", userId)
            .select()
            .single();
        if (error)
            throw error;
        res.json({
            success: true,
            data,
            message: "Log marked as resolved",
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a log
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from("system_logs")
            .delete()
            .eq("id", id)
            .eq("merchant_id", userId);
        if (error)
            throw error;
        res.json({
            success: true,
            message: "Log deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
