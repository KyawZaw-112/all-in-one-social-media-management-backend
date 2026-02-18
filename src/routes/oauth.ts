import express from "express";
import axios from "axios";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { subscribePageToWebhook } from "../services/facebook.services.js";
import { seedDefaultFlows } from "../services/seed.services.js";

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
        data?.map((p) => ({
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
        scope: "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging",
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

        // 🔥 Exchange for Long-Lived User Access Token
        let longLivedToken = userAccessToken;
        try {
            console.log("🔄 Exchanging for long-lived token...");
            const exchangeRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
                params: {
                    grant_type: "fb_exchange_token",
                    client_id: process.env.FACEBOOK_APP_ID,
                    client_secret: process.env.FACEBOOK_APP_SECRET,
                    fb_exchange_token: userAccessToken,
                },
            });
            if (exchangeRes.data.access_token) {
                longLivedToken = exchangeRes.data.access_token;
                console.log("✅ Long-lived token acquired");
            }

            // 🔍 Debug Token Expiration
            try {
                const debugRes = await axios.get("https://graph.facebook.com/v19.0/debug_token", {
                    params: {
                        input_token: longLivedToken,
                        access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
                    }
                });
                console.log("🧐 Token Debug Info:", JSON.stringify(debugRes.data.data, null, 2));
            } catch (debugErr) {
                console.error("⚠️ Failed to debug token:", debugErr);
            }

        } catch (exErr: any) {
            console.error("❌ Token Exchange Failed:", exErr.response?.data || exErr.message);
            // Fallback to short-lived token if exchange fails, but log it clearly
        }

        const pagesRes = await axios.get(
            "https://graph.facebook.com/v19.0/me/accounts",
            { params: { access_token: longLivedToken } }
        );

        const pages = pagesRes.data.data || [];

        if (pages.length === 0) {
            console.error("❌ No Facebook pages found for this user access token.");
            throw new Error("သင်၏ Facebook အကောင့်တွင် Page မတွေ့ရပါ။ ကျေးဇူးပြု၍ Facebook Login ဝင်စဉ် Page တစ်ခုကို အမှန်ခြစ်ခဲ့ပါသလား ပြန်စစ်ပေးပါ။");
        }

        // Limit to 1 page: Take the first page ONLY
        const page = pages[0];
        console.log(`🔗 Connecting Page: ${page.name} (${page.id}) for user: ${userId}`);

        // Check if ANY other page is connected for this user and remove it (Enforce 1-page rule)
        await supabaseAdmin
            .from("platform_connections")
            .delete()
            .eq("user_id", userId);

        // 🔥 ENSURE MERCHANT EXISTS FIRST (defensive)
        const { data: existingMerchant } = await supabaseAdmin
            .from("merchants")
            .select("id")
            .eq("id", userId)
            .maybeSingle();

        if (!existingMerchant) {
            console.log("Creating missing merchant record for user:", userId);
            const { error: merchError } = await supabaseAdmin.from("merchants").insert({
                id: userId,
                page_id: page.id,
                business_name: page.name,
                business_type: "shop",
                subscription_plan: "shop",
                subscription_status: "active",
                trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
            if (merchError) {
                console.error("Failed to create missing merchant:", merchError);
            }
        }

        const { error: insertError } = await supabaseAdmin
            .from("platform_connections")
            .upsert(
                {
                    user_id: userId,
                    platform: "facebook",
                    page_id: page.id,
                    page_name: page.name,
                    page_access_token: page.access_token,
                },
                { onConflict: "user_id,page_id" }
            );

        if (insertError) {
            console.error("Insert error in platform_connections:", insertError);
            if (insertError.message.includes("row-level security policy")) {
                throw new Error("Database Access Error: RLS violation. Please handle this in Supabase.");
            }
            throw insertError;
        }

        // Update Merchant Profile with Page Info
        await supabaseAdmin
            .from("merchants")
            .update({
                page_id: page.id,
                business_name: page.name,
            })
            .eq("id", userId);

        // Subscribe Webhook
        console.log(`📡 Subscribing Page ${page.id} to webhooks...`);
        await subscribePageToWebhook(page.id, page.access_token);

        console.log("User ID:", userId);

        res.redirect(`${process.env.FRONTEND_URL}/dashboard/platforms?connected=facebook`);
    } catch (error: any) {
        console.error("OAuth Error:", error.response?.data || error.message);
        const errorMsg = encodeURIComponent(error.message || "OAuth validation failed");
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/platforms?error=true&message=${errorMsg}`);
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

        // AUTO DELETE FLOWS when page is disconnected/deleted
        await supabaseAdmin
            .from("automation_flows")
            .delete()
            .eq("merchant_id", userId);

        res.json({ success: true, message: "Page disconnected and flows deleted." });
    } catch (err) {
        res.status(500).json({ error: "Disconnect failed" });
    }
});

/**
 * SaaS Registration
 * POST /api/oauth/register
 */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, subscription_plan, trial_ends_at } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");

        // Use explicit business_type or derive from subscription_plan
        const businessType = req.body.business_type || (subscription_plan === 'cargo' ? 'cargo' : 'shop');

        await supabaseAdmin.from("merchants").insert({
            id: authData.user.id,
            page_id: "pending",
            business_name: `${name}'s Business`,
            subscription_plan: subscription_plan || 'shop',
            business_type: businessType, // Save business type
            trial_ends_at: trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            subscription_status: 'active'
        });

        // 🔥 Seed default flows
        await seedDefaultFlows(authData.user.id, businessType);

        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });

        if (sessionError) throw sessionError;

        // Fetch profile to get role
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single();

        res.status(201).json({
            success: true,
            token: sessionData.session.access_token,
            user: { ...sessionData.user, role: profile?.role || 'user' },
            message: "Registration successful! Welcome! 🚀"
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * SaaS Login
 * POST /api/oauth/login
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Fetch profile to get role
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

        res.json({
            success: true,
            token: data.session?.access_token,
            user: { ...data.user, role: profile?.role || 'user' },
            message: "Login successful! 👋"
        });
    } catch (error: any) {
        res.status(401).json({ error: error.message || "Invalid email or password" });
    }
});

/**
 * Forgot Password
 * POST /api/oauth/forgot-password
 */
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
        });

        if (error) throw error;

        res.json({
            success: true,
            message: "Password reset link has been sent to your email."
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Reset Password (with access token from email link)
 * POST /api/oauth/reset-password
 */
router.post("/reset-password", async (req, res) => {
    try {
        const { access_token, new_password } = req.body;
        if (!access_token || !new_password) {
            return res.status(400).json({ error: "Access token and new password are required" });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(
            // We need to decode the token to get user ID
            // But since we have supabaseAdmin, we can use the token directly
            access_token,
            { password: new_password }
        );

        // Alternative approach: use the user's session
        // Client-side will handle this with Supabase client

        if (error) throw error;

        res.json({
            success: true,
            message: "Password updated successfully!"
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
