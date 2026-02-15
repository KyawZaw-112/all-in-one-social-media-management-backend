import { Router } from "express";
import {
    exchangeCodeForToken,
    getUserPages,
} from "../services/facebook.services.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { env } from "../config/env.js";

const router = Router();

router.get("/facebook/callback", async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code || typeof code !== "string") {
            return res.redirect(
                `${env.FRONTEND_URL}/dashboard/platforms?error=true`
            );
        }

        const userId = state as string;

        const tokenData = await exchangeCodeForToken(code);
        const userAccessToken = tokenData.access_token;

        const pages = await getUserPages(userAccessToken);

        for (const page of pages) {
            await supabaseAdmin
                .from("platform_connections")
                .upsert(
                    {
                        user_id: userId,
                        platform: "facebook",
                        page_id: page.id,
                        page_name: page.name,
                        page_access_token: page.access_token,
                        connected: true,
                    },
                    { onConflict: "user_id,page_id" }
                );
        }

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
