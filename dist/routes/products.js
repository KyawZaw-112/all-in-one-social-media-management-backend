import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
const router = Router();
/**
 * Helper to handle Base64 image upload to Supabase
 */
async function handleImageUpload(imageBase64, userId) {
    if (!imageBase64.startsWith('data:image/')) {
        throw new Error("Invalid image format");
    }
    // Extract content type and base64 data
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 string");
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    // Generate unique filename
    const fileExt = contentType.split('/')[1] || 'png';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    const { data, error } = await supabaseAdmin.storage
        .from('product-images')
        .upload(filePath, buffer, {
        contentType,
        upsert: true
    });
    if (error)
        throw error;
    const { data: { publicUrl } } = supabaseAdmin.storage
        .from('product-images')
        .getPublicUrl(filePath);
    console.log("✅ Image uploaded to Supabase:", publicUrl);
    return publicUrl;
}
/**
 * GET /api/products — List all products for merchant
 */
router.get("/", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabaseAdmin
            .from("products")
            .select("*")
            .eq("merchant_id", userId)
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        res.json({ success: true, data: data || [] });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/products/low-stock — Products below threshold
 */
router.get("/low-stock", requireAuth, async (req, res) => {
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
            const lowStock = (allProducts || []).filter((p) => p.stock <= p.low_stock_threshold);
            return res.json({ success: true, data: lowStock });
        }
        res.json({ success: true, data: data || [] });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, price, currency, variants, image_url, stock, low_stock_threshold } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Product name is required" });
        }
        let finalImageUrl = image_url || "";
        // Handle Base64 Upload
        if (req.body.image_base64) {
            try {
                finalImageUrl = await handleImageUpload(req.body.image_base64, userId);
            }
            catch (err) {
                return res.status(400).json({ error: "Image upload failed: " + err.message });
            }
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
            image_url: finalImageUrl,
            stock: stock || 0,
            low_stock_threshold: low_stock_threshold || 5,
        })
            .select()
            .single();
        if (error) {
            console.error("❌ Database insert error:", error);
            return res.status(400).json({ error: "Database error: " + error.message });
        }
        console.log("✅ Product created successfully:", data.id);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error("❌ Product POST crash:", error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * PATCH /api/products/:id — Update product
 */
router.patch("/:id", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;
        // Remove fields that shouldn't be updated
        delete updates.id;
        delete updates.merchant_id;
        delete updates.created_at;
        const imageBase64 = updates.image_base64;
        delete updates.image_base64;
        if (imageBase64) {
            try {
                updates.image_url = await handleImageUpload(imageBase64, userId);
            }
            catch (err) {
                return res.status(400).json({ error: "Image upload failed: " + err.message });
            }
        }
        const { data, error } = await supabaseAdmin
            .from("products")
            .update(updates)
            .eq("id", id)
            .eq("merchant_id", userId)
            .select()
            .single();
        if (error)
            throw error;
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * PATCH /api/products/:id/stock — Adjust stock level
 */
router.patch("/:id/stock", requireAuth, async (req, res) => {
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
        if (error)
            throw error;
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * DELETE /api/products/:id — Delete product
 */
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from("products")
            .delete()
            .eq("id", id)
            .eq("merchant_id", userId);
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
