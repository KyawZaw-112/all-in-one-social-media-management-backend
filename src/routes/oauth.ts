import express from "express";
import axios, {AxiosError} from "axios";
import {env} from "../config/env.js";
import {supabaseAdmin} from "../supabaseAdmin.js";
import {requireAuth} from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * STEP 1: Redirect user to Facebook OAuth
 * GET /api/oauth/facebook
 */
router.get("/facebook", async (req, res) => {
    const userId = req.query.userId as string; // frontend ကပို့မယ်

    const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
        response_type: "rerequest",
        scope: "pages_show_list,pages_messaging,pages_manage_metadata",
        state: userId, // 🔥 user id store
    });

    res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
});


/**
 * STEP 2: Facebook Callback
 * GET /oauth/facebook/callback
 */
router.get("/facebook/callback", async (req, res) => {
    try {
        const { code, state } = req.query;

        const userId = state as string;

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
            { params: { access_token: userAccessToken } }
        );

        for (const page of pagesRes.data.data) {
            await supabaseAdmin.from("platform_connections").upsert({
                user_id: userId, // ✅ now safe
                page_id: page.id,
                page_name: page.name,
                page_access_token: page.access_token,
            });
        }
        console.log("Pages:", pagesRes.data.data);


        res.redirect(`${process.env.FRONTEND_URL}/dashboard/platforms`);
    } catch (error: any) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "OAuth failed" });
    }
});



export default router;
