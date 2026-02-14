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
    try {
        const paymentId = req.params.id;
        const adminUserId = req.admin?.id;

        if (!adminUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // 1️⃣ Get payment
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("id", paymentId)
            .single();

        if (paymentError || !payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        if (payment.status === "approved") {
            return res.status(400).json({ error: "Already approved" });
        }

        const startDate = new Date();
        const endDate = new Date(
            startDate.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        // 2️⃣ Update payment
        const { error: updateError } = await supabaseAdmin
            .from("payments")
            .update({
                status: "approved",
                reviewed_at: new Date().toISOString(),
                approved_at: new Date().toISOString(),
                approved_by: adminUserId,
            })
            .eq("id", paymentId);

        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }

        // 3️⃣ Activate subscription
        const { error: subError } = await supabaseAdmin
            .from("subscriptions")
            .upsert(
                {
                    user_id: payment.user_id,
                    plan: payment.plan || "pro",
                    status: "active",
                    country: payment.country || "MM",
                    payment_provider: "manual",
                    reference: payment.transaction_id || payment.id,
                    start_date: startDate.toISOString(),
                    expires_at: endDate.toISOString(),
                    created_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            );

        if (subError) {
            return res.status(500).json({ error: subError.message });
        }

        res.json({ success: true });

    } catch (err) {
        console.error("Approve error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/all", requireAdmin, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});


export default router;
