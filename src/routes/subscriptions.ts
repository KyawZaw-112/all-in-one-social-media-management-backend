// src/routes/subscriptions.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

router.get("/me", requireAuth, async (req: any, res) => {
    const { data } = await supabaseAdmin
        .from("subscriptions")
        .select("status, expires_at,plan")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (!data) {
        return res.json({ status: "none" });
    }

    if (new Date(data.expires_at) < new Date()) {
        return res.json({ status: "expired" });
    }

    res.json({ status: data.status,plan:data.plan });
});

export default router;
