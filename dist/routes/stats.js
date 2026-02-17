import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
const router = express.Router();
router.get("/", requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { count: rulesCount } = await supabaseAdmin
        .from("rules")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
    const { count: pagesCount } = await supabaseAdmin
        .from("platform_connections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
    res.json({
        replies: 0,
        rules: rulesCount || 0,
        platforms: pagesCount || 0,
    });
});
export default router;
