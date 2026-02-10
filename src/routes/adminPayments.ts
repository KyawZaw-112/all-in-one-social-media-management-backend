import express from "express";
import {supabaseAdmin} from "../supabaseAdmin.js";
import {requireAdmin} from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/pending", requireAdmin, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from("payments")
        .select(`
      id,
      user_id,
      plan,
      country,
      payment_provider,
      reference,
      created_at,
      profiles(email)
    `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.post("/approve", requireAdmin, async (req, res) => {
    const { paymentId } = req.body;

    const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();

    const expires =
        payment.plan === "monthly"
            ? new Date(Date.now() + 30 * 86400000)
            : new Date(Date.now() + 365 * 86400000);

    await supabaseAdmin
        .from("payments")
        .update({ status: "approved" })
        .eq("id", paymentId);

    await supabaseAdmin.from("subscriptions").upsert({
        user_id: payment.user_id,
        plan: payment.plan,
        status: "active",
        expires_at: expires.toISOString(),
    });

    res.json({ success: true });
});

export default router;
