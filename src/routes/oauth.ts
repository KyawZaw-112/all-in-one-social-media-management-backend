import { Router } from "express";
import {
    getFacebookAuthUrl,
    exchangeCodeForToken,
    getUserPages,
} from "../services/facebook.services.js";
import { env } from "../config/env.js";

const router = Router();

/**
 * Step 1: Redirect to Facebook
 */
router.get("/facebook", (req, res) => {
    const url = getFacebookAuthUrl();
    return res.redirect(url);
});

/**
 * Step 2: Facebook Callback
 */
router.get("/facebook/callback", async (req, res) => {
    try {
        const { code } = req.query;

        if (!code || typeof code !== "string") {
            return res.status(400).json({ error: "Missing code" });
        }

        // Exchange code → user access token
        const tokenData = await exchangeCodeForToken(code);
        const userAccessToken = tokenData.access_token;

        // Get pages
        const pages = await getUserPages(userAccessToken);

        // TODO: Save page_access_token to database here

        return res.redirect(
            `${env.FRONTEND_URL}/dashboard/platforms?success=true`
        );
    } catch (error: any) {
        console.error(error.response?.data || error.message);

        return res.redirect(
            `${env.FRONTEND_URL}/dashboard/platforms?error=true`
        );
    }
});

export default router;
