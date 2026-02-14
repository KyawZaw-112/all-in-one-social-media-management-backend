import { Router } from "express";
import { stripe } from "../payments/stripe.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();


router.get("/my-history", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data } = await supabaseAdmin.auth.getUser(token);
    if (!data?.user) return res.status(401).json({ error: "Invalid token" });

    const { data: payments, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(payments);
});


/**
 * 🇹🇭 Stripe checkout
 */
router.post("/stripe/checkout", requireAuth, async (req: any, res) => {
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "thb",
                    recurring: { interval: "month" },
                    product_data: { name: "All in One Social Media Management Pro" },
                    unit_amount: 9900,
                },
                quantity: 1,
            },
        ],
        success_url: "http://localhost:3000/dashboard",
        cancel_url: "http://localhost:3000/subscribe",
        metadata: {
            user_id: req.user.id, // 🔑 critical
        },
    });

    res.json({ url: session.url });
});


/**
 * 🇲🇲 Manual payment request
 */
router.post("/manual", requireAuth, async (req, res) => {
    try {
        const { reference, plan, amount, proof_url, payment_provider } = req.body;
        const userId = req.user.id;

        const { error } = await supabaseAdmin
            .from("payments")
            .insert({
                user_id: userId,
                plan,
                amount,
                transaction_id:reference,
                proof_url,
                status: "pending",
                payment_provider: payment_provider,
                created_at: new Date().toISOString(),
            });

        if (error) return res.status(500).json({ error: error.message });

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
export default router;
