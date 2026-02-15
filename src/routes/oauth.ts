import express from "express";
import axios, {AxiosError} from "axios";
import { env } from "../config/env.js";

const router = express.Router();

/**
 * STEP 1: Redirect user to Facebook OAuth
 * GET /api/oauth/facebook
 */
router.get("/facebook", (req, res) => {
    const params = new URLSearchParams({
        client_id: env.FACEBOOK_APP_ID,
        redirect_uri: env.FACEBOOK_REDIRECT_URI,
        response_type: "code",
        scope: "email",
    });

    const facebookUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;

    return res.redirect(facebookUrl);
});

/**
 * STEP 2: Facebook Callback
 * GET /api/oauth/facebook/callback
 */
router.get("/facebook/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "No code received" });
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            {
                params: {
                    client_id: env.FACEBOOK_APP_ID,
                    client_secret: env.FACEBOOK_APP_SECRET,
                    redirect_uri: env.FACEBOOK_REDIRECT_URI,
                    code,
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        return res.json({
            message: "Facebook connected successfully",
            accessToken,
        });

    } catch (error) {
    const err = error as AxiosError;

    console.error(
        err.response?.data || err.message
    );

    return res.status(500).json({
        error: "Token exchange failed",
    });
}


export default router;
