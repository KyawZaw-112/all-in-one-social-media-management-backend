import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { getFacebookAuthUrl } from "../services/facebook.services.js";

const router = Router();

/**
 * GET /platforms
 * Return connected Facebook pages
 */
router.get("/", requireAuth, async (req: any, res) => {
    const { data, error } = await supabaseAdmin
        .from("platform_connections")
        .select("page_id, page_name")
        .eq("user_id", req.user.id)
        .eq("platform", "facebook");

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(
        (data || []).map((page) => ({
            id: page.page_id,
            name: page.page_name,
            ruleCount: 0,
        }))
    );
});


/**
 * POST /platforms/connect
 */
router.post("/connect", requireAuth, async (req: any, res) => {
    const { platform } = req.body;

    if (platform === "facebook") {
        const url = getFacebookAuthUrl(req.user.id);
        return res.json({ url });
    }

    res.status(400).json({ error: "Unsupported platform" });
});

export default router;
