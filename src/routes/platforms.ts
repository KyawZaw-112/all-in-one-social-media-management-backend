import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { getFacebookAuthUrl } from "../services/facebook.services.js";

const router = Router();

/**
 * GET /platforms
 * Return connected platforms
 */
router.get("/", requireAuth, async (req: any, res) => {
    const { data } = await supabaseAdmin
        .from("platform_connections")
        .select("platform, connected")
        .eq("user_id", req.user.id);

    res.json(data || []);
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

/**
 * Facebook OAuth callback
 */
router.get("/facebook/callback", async (req, res) => {
    const { code, state: userId } = req.query;

    // 🔥 Exchange code → access token (simplified)
    // (you can implement token exchange later)

    await supabaseAdmin
        .from("platform_connections")
        .upsert({
            user_id: userId,
            platform: "facebook",
            connected: true,
            access_token: "TEMP_TOKEN",
        });

    res.redirect(`${process.env.FRONTEND_URL}/platforms?connected=facebook`);
});

export default router;
