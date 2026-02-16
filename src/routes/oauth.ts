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
 * GET /oauth/facebook/callback
 */
router.get("/facebook/callback", async (req, res) => {
    try {
        const { code } = req.query;

        const tokenRes = await axios.get(
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

        const userAccessToken = tokenRes.data.access_token;

        const pagesRes = await axios.get(
            "https://graph.facebook.com/v19.0/me/accounts",
            {
                params: { access_token: userAccessToken },
            }
        );

        const pages = pagesRes.data.data;

        for (const page of pages) {
            await supabaseAdmin.from("platform_connections").upsert({
                user_id: req.user.id, // ⚠️ user_id ထည့်ရန်မမေ့ပါနဲ့
                page_id: page.id,
                page_name: page.name,
                page_access_token: page.access_token,
            });

            await axios.post(
                `https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`,
                {},
                { params: { access_token: page.access_token } }
            );
        }

        res.redirect(`${process.env.FRONTEND_URL}dashboard/platforms`);
    } catch (error) {
        console.error("OAuth Error:", error.response?.data || error.message);
        res.status(500).send("OAuth failed");
    }
});


export default router;
