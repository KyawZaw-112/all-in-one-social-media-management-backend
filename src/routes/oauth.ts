import { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

/**
 * STEP 1 — Redirect to Facebook OAuth
 */
router.get("/facebook", requireAuth, async (req: any, res) => {
    const userId = req.user.id;

    const state = crypto.randomUUID();

    // store state → userId
    await supabaseAdmin.from("oauth_states").insert({
        state,
        user_id: userId,
        provider: "facebook",
    });

    const url =
        "https://www.facebook.com/v19.0/dialog/oauth" +
        `?client_id=${process.env.FACEBOOK_CLIENT_ID}` +
        `&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}` +
        `&scope=pages_show_list,pages_manage_metadata,pages_messaging` +
        `&state=${state}`;

    res.redirect(url);
});

/**
 * STEP 2 — Facebook callback
 */
router.get("/facebook/callback", async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}/platforms?error=denied`);
    }

    // Validate state
    const { data: stateRow } = await supabaseAdmin
        .from("oauth_states")
        .select("*")
        .eq("state", state)
        .single();

    if (!stateRow) {
        return res.status(400).send("Invalid OAuth state");
    }

    const userId = stateRow.user_id;

    // Exchange code → user token
    const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token` +
        `?client_id=${process.env.FACEBOOK_CLIENT_ID}` +
        `&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}` +
        `&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}` +
        `&code=${code}`
    );

    const tokenData: any = await tokenRes.json();

    if (!tokenData.access_token) {
        return res.redirect(`${process.env.FRONTEND_URL}/platforms?error=token`);
    }

    const userAccessToken = tokenData.access_token;

    // Fetch pages
    const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`
    );

    const pagesData: any = await pagesRes.json();
    const page = pagesData.data?.[0];

    if (!page) {
        return res.redirect(`${process.env.FRONTEND_URL}/platforms?error=no_pages`);
    }

    // Save platform
    await supabaseAdmin.from("platforms").upsert({
        user_id: userId,
        platform: "facebook",
        page_id: page.id,
        access_token: page.access_token,
    });

    // Cleanup state
    await supabaseAdmin.from("oauth_states").delete().eq("state", state);

    res.redirect(`${process.env.FRONTEND_URL}/platforms?connected=facebook`);
});

export default router;
