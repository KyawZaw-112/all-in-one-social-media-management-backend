import {Router} from "express";
import {requireAuth} from "../middleware/requireAuth.js";
import {supabaseAdmin} from "../supabaseAdmin.js";
import {getFacebookAuthUrl} from "../services/facebook.services.js";

const router = Router();

/**
 * GET /platforms
 * Return connected Facebook pages
 */
router.get("/", requireAuth, async (req: any, res) => {
    const { data, error } = await supabaseAdmin
        .from("platform_connections")
        .select("id, page_id, page_name, platform")
        .eq("user_id", req.user.id)
        .eq("platform", "facebook");

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
});


/**
 * POST /platforms/connect
 */
router.post("/connect", requireAuth, async (req: any, res) => {
    const {platform} = req.body;

    if (platform === "facebook") {
        const url = getFacebookAuthUrl(req.user.id);
        return res.json({url});
    }

    res.status(400).json({error: "Unsupported platform"});
});

export default router;
