import express from "express";
import {supabaseAdmin} from "../supabaseAdmin.js";
import {requireAdmin} from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/pending", requireAdmin, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

router.post("/reject", requireAdmin, async (req, res) => {
    const { paymentId } = req.body;

    if (!paymentId) {
        return res.status(400).json({ error: "paymentId required" });
    }

    const { error } = await supabaseAdmin
        .from("payments")
        .update({
            status: "rejected",
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
});

router.post("/approve/:id", requireAdmin, async (req, res) => {
    const paymentId = req.params.id;

    const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();

    if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1️⃣ Update payment
    await supabaseAdmin
        .from("payments")
        .update({
            status: "approved",
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

    // 2️⃣ Activate subscription  ← PASTE HERE
    const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .upsert(
            {
                user_id: payment.user_id,
                plan: payment.plan || "pro",
                status: "active",
                country: payment.country || "MM",
                payment_provider: payment.payment_method || "manual",
                reference: payment.transaction_id || payment.id,
                start_date: startDate.toISOString(),
                expires_at: endDate.toISOString(),
                created_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );

    if (subError) {
        console.error("Subscription error:", subError);
        return res.status(500).json({ error: subError.message });
    }

    res.json({ success: true });
});


export default router;
