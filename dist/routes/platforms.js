import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { getFacebookAuthUrl } from "../services/facebook.services.js";
const router = Router();
/**
 * GET /platforms
 * Return connected Facebook pages
 */
router.get("/", requireAuth, async (req, res) => {
    const { data } = await supabaseAdmin
        .from("platform_connections")
        .select("platform, connected")
        .eq("user_id", req.user.id)
        .eq("platform", "facebook");
    res.json((data || []).map((item) => ({
        platform: item.platform,
        connected: item.connected,
    })));
});
/**
 * POST /platforms/connect
 */
router.post("/connect", requireAuth, async (req, res) => {
    const { platform } = req.body;
    if (platform === "facebook") {
        const url = getFacebookAuthUrl(req.user.id);
        return res.json({ url });
    }
    res.status(400).json({ error: "Unsupported platform" });
});
export default router;
