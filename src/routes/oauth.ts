import express from "express";
import axios, {AxiosError} from "axios";
import {env} from "../config/env.js";
import {supabaseAdmin} from "../supabaseAdmin.js";

const router = express.Router();

/**
 * STEP 1: Redirect user to Facebook OAuth
 * GET /api/oauth/facebook
 */
router.get("/facebook", (req, res) => {
    const params = new URLSearchParams({
        client_id: `${process.env.FACEBOOK_APP_ID}`,
        redirect_uri: `${process.env.FACEBOOK_REDIRECT_URI}`,
        response_type: "code",
        scope: "pages_show_list,pages_messaging,pages_manage_metadata",
    });

    const facebookUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;

    return res.redirect(facebookUrl);
});

/**
 * STEP 2: Facebook Callback
 * GET /api/oauth/facebook/callback
 */
router.get("/facebook/callback", async (req: any, res) => {
    const {code, state} = req.query;

    if (!code) {
        return res.status(400).json({error: "No code received"});
    }

    try {
        // 1️⃣ Exchange code for USER access token
        const tokenResponse = await axios.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            {
                params: {
                    client_id: process.env.FACEBOOK_APP_ID,
                    client_secret: process.env.FACEBOOK_APP_SECRET,
                    redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
                    code,
                },
            }
        );

        const userAccessToken = tokenResponse.data.access_token;

        // 2️⃣ Get user's pages
        const pagesResponse = await axios.get(
            "https://graph.facebook.com/v19.0/me/accounts",
            {
                params: {
                    access_token: userAccessToken,
                },
            }
        );

        const pages = pagesResponse.data.data;

        if (!pages || pages.length === 0) {
            return res.status(400).json({error: "No pages found"});
        }

        // Example: save first page (later you can let user choose)
        const page = pages[0];

        const {data, error} = await supabaseAdmin
            .from("platform_connections")
            .upsert(
                {
                    user_id: state,
                    platform: "facebook",
                    page_id: page.id,
                    page_name: page.name,
                    page_access_token: page.access_token,
                    connected: true,
                },
                {onConflict: "user_id,page_id"}
            );

        console.log("INSERT RESULT:", data);
        console.log("INSERT ERROR:", error);
        console.log("PAGE DATA:", page);
        console.log("State", state)

        return res.redirect(
            `${process.env.FRONTEND_URL}/dashboard/platforms?connected=facebook`
        );

    } catch (error: any) {
        console.error(error.response?.data || error.message);
        return res.status(500).json({error: "Facebook connection failed"});
    }
});


export default router;
