import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/me", requireAuth, async (req: any, res) => {
    const { data: subscription } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", req.user.id)
        .single();

    if (!subscription) return res.json(null);

    // Auto expire
    if (
        subscription.status === "active" &&
        subscription.expires_at &&
        new Date(subscription.expires_at) < new Date()
    ) {
        await supabaseAdmin
            .from("subscriptions")
            .update({ status: "expired" })
            .eq("id", subscription.id);

        subscription.status = "expired";
    }

    res.json(subscription);
});


export default router;
