import { Router } from "express";
import { stripe } from "../payments/stripe.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

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
router.post("/manual", requireAuth, async (req: any, res) => {
    const { reference } = req.body;

    await supabaseAdmin.from("subscriptions").insert({
        user_id: req.user.id,
        country: "MM",
        status: "pending",
        payment_provider: "manual",
        reference
    });

    res.json({ message: "Payment submitted. Await approval." });
});

export default router;
