import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

/**
 * GET /api/products — List all products for merchant
 */
router.get("/", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabaseAdmin
            .from("products")
            .select("*")
            .eq("merchant_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/products/low-stock — Products below threshold
 */
router.get("/low-stock", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabaseAdmin
            .from("products")
            .select("*")
            .eq("merchant_id", userId)
            .eq("is_active", true)
            .filter("stock", "lte", "low_stock_threshold")
            .order("stock", { ascending: true });

        if (error) {
            // Fallback: fetch all and filter client-side
            const { data: allProducts } = await supabaseAdmin
                .from("products")
                .select("*")
                .eq("merchant_id", userId)
                .eq("is_active", true);

            const lowStock = (allProducts || []).filter(
                (p: any) => p.stock <= p.low_stock_threshold
            );
            return res.json({ success: true, data: lowStock });
        }

        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/products — Create product
 */
router.post("/", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { name, description, price, currency, variants, image_url, stock, low_stock_threshold } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Product name is required" });
        }

        const { data, error } = await supabaseAdmin
            .from("products")
            .insert({
                merchant_id: userId,
                name,
                description: description || "",
                price: price || 0,
                currency: currency || "MMK",
                variants: variants || "",
                image_url: image_url || "",
                stock: stock || 0,
                low_stock_threshold: low_stock_threshold || 5,
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
 * PATCH /api/products/:id — Update product
 */
router.patch("/:id", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        // Remove fields that shouldn't be updated
        delete updates.id;
        delete updates.merchant_id;
        delete updates.created_at;

        const { data, error } = await supabaseAdmin
            .from("products")
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
 * PATCH /api/products/:id/stock — Adjust stock level
 */
router.patch("/:id/stock", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { adjustment } = req.body; // +5 or -3

        if (typeof adjustment !== "number") {
            return res.status(400).json({ error: "adjustment must be a number" });
        }

        // Get current stock
        const { data: product } = await supabaseAdmin
            .from("products")
            .select("stock")
            .eq("id", id)
            .eq("merchant_id", userId)
            .single();

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        const newStock = Math.max(0, (product.stock || 0) + adjustment);

        const { data, error } = await supabaseAdmin
            .from("products")
            .update({ stock: newStock })
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
 * DELETE /api/products/:id — Delete product
 */
router.delete("/:id", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from("products")
            .delete()
            .eq("id", id)
            .eq("merchant_id", userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
