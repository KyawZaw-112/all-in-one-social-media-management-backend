import express from "express";
import axios, {AxiosError} from "axios";
import {env} from "../config/env.js";
import {supabaseAdmin} from "../supabaseAdmin.js";
import {requireAuth} from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
        .from("platform_connections")
        .select("page_id, page_name")
        .eq("user_id", userId)
        .eq("platform", "facebook");

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(
        data.map((p) => ({
            id: p.page_id,
            name: p.page_name,
            ruleCount: 0,
        }))
    );
});


/**
 * STEP 1: Redirect user to Facebook OAuth
 * GET /api/oauth/facebook
 */
router.get("/facebook", async (req, res) => {
    const userId = req.query.userId as string; // frontend ကပို့မယ်

    const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
        response_type: "code",
        scope: "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging\n",
        state: userId, // 🔥 user id store
        auth_type: "rerequest", // 🔥 always ask for permissions
    });

    res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
});


/**
 * STEP 2: Facebook Callback
 * GET /oauth/facebook/callback
 */
router.get("/facebook/callback", async (req, res) => {
    try {
        const {code, state} = req.query;

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
            {params: {access_token: userAccessToken}}
        );

        for (const page of pagesRes.data.data) {
            const { error } = await supabaseAdmin
                .from("platform_connections")
                .upsert(
                    {
                        user_id: userId,
                        platform: "facebook",   // 🔥 THIS WAS MISSING
                        page_id: page.id,
                        page_name: page.name,
                        page_access_token: page.access_token,
                    },
                    { onConflict: "user_id,page_id" }
                );

            if (error) {
                console.error("Insert error:", error);
            }
        }

        console.log("User ID:", userId);
        console.log("Pages Response:", JSON.stringify(pagesRes.data, null, 2));

        res.redirect(`${process.env.FRONTEND_URL}/dashboard/platforms`);
    } catch (error: any) {
        console.error(error.response?.data || error.message);
        res.status(500).json({error: "OAuth failed"});
    }
});

// DELETE /api/platforms/:pageId
router.delete("/platforms/:pageId", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { pageId } = req.params;

        const { error } = await supabaseAdmin
            .from("platform_connections")
            .delete()
            .eq("user_id", userId)
            .eq("page_id", pageId)
            .eq("platform", "facebook");

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Disconnect failed" });
    }
});



export default router;
