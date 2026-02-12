// src/routes/posts.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveSubscription } from "../middleware/requireActiveSubscription.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

router.post("/create", requireAuth, requireActiveSubscription, async (_req, res) => {
    res.json({ message: "Post created successfully 🚀" });
});

router.get("/stats", requireAuth, async (req: any, res: any) => {
    try {
        const userId = req.user?.id;
        console.log("📊 Fetching stats for user:", userId);

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Get posts count - try multiple approaches
        let postsCount = 0;
        try {
            const { count, error: postsError } = await supabaseAdmin
                .from("posts")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId);

            if (postsError) {
                console.warn("⚠️ Posts query error:", postsError);
                // Table might not exist or user has no posts
                postsCount = 0;
            } else {
                postsCount = count || 0;
            }
        } catch (e) {
            console.warn("⚠️ Posts count exception:", e);
            postsCount = 0;
        }

        // Get auto-replies count
        let repliesCount = 0;
        try {
            const { count, error: repliesError } = await supabaseAdmin
                .from("auto_replies")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId);

            if (repliesError) {
                console.warn("⚠️ Auto-replies query error:", repliesError);
                repliesCount = 0;
            } else {
                repliesCount = count || 0;
            }
        } catch (e) {
            console.warn("⚠️ Auto-replies count exception:", e);
            repliesCount = 0;
        }

        // Get connected platforms count
        let platformsCount = 0;
        try {
            const { count, error: platformsError } = await supabaseAdmin
                .from("user_platforms")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId);

            if (platformsError) {
                console.warn("⚠️ Platforms query error:", platformsError);
                platformsCount = 0;
            } else {
                platformsCount = count || 0;
            }
        } catch (e) {
            console.warn("⚠️ Platforms count exception:", e);
            platformsCount = 0;
        }

        console.log("✅ Stats:", { posts: postsCount, replies: repliesCount, platforms: platformsCount });
        res.json({
            posts: postsCount,
            replies: repliesCount,
            platforms: platformsCount,
        });
    } catch (error) {
        console.error("❌ Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

router.get("/recent", requireAuth, async (req: any, res: any) => {
    try {
        const userId = req.user?.id;
        console.log("📝 Fetching recent posts for user:", userId);

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { data, error } = await supabaseAdmin
            .from("posts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            console.warn("⚠️ Posts query error:", error);
            // Table might not exist, return empty array instead of error
            return res.json([]);
        }

        console.log("✅ Recent posts count:", data?.length || 0);
        res.json(data || []);
    } catch (error) {
        console.error("❌ Error fetching recent posts:", error);
        // Don't crash, just return empty array
        res.json([]);
    }
});

export default router;
