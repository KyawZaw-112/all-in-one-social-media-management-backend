import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

/**
 * GET /api/rates — List all rates for merchant
 */
router.get("/", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabaseAdmin
            .from("shipping_rates")
            .select("*")
            .eq("merchant_id", userId)
            .order("country", { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/rates — Create rate entry
 */
router.post("/", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { country, shipping_type, rate_per_kg, currency } = req.body;

        if (!country || !shipping_type || rate_per_kg === undefined) {
            return res.status(400).json({ error: "country, shipping_type, and rate_per_kg are required" });
        }

        const { data, error } = await supabaseAdmin
            .from("shipping_rates")
            .insert({
                merchant_id: userId,
                country,
                shipping_type,
                rate_per_kg,
                currency: currency || "THB",
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/rates/:id — Update rate
 */
router.patch("/:id", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        delete updates.id;
        delete updates.merchant_id;
        delete updates.created_at;

        const { data, error } = await supabaseAdmin
            .from("shipping_rates")
            .update(updates)
            .eq("id", id)
            .eq("merchant_id", userId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/rates/:id — Delete rate
 */
router.delete("/:id", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from("shipping_rates")
            .delete()
            .eq("id", id)
            .eq("merchant_id", userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/rates/calculate — Calculate shipping cost
 * Body: { country, shipping_type, weight_kg }
 */
router.post("/calculate", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { country, shipping_type, weight_kg } = req.body;

        if (!country || !shipping_type || !weight_kg) {
            return res.status(400).json({ error: "country, shipping_type, and weight_kg are required" });
        }

        const { data: rate } = await supabaseAdmin
            .from("shipping_rates")
            .select("*")
            .eq("merchant_id", userId)
            .eq("country", country)
            .eq("shipping_type", shipping_type)
            .eq("is_active", true)
            .maybeSingle();

        if (!rate) {
            return res.status(404).json({ error: "No rate found for this route. Please add a rate first." });
        }

        const total = rate.rate_per_kg * weight_kg;

        res.json({
            success: true,
            data: {
                country,
                shipping_type,
                weight_kg,
                rate_per_kg: rate.rate_per_kg,
                currency: rate.currency,
                total,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
