import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
const router = Router();
// Middleware-like check for shared secret or simple API key
const checkDriverToken = (req, res, next) => {
    const token = req.headers["x-driver-token"];
    if (token !== process.env.DRIVER_API_TOKEN && token !== "vibe_driver_poc_2024") {
        return res.status(401).json({ error: "Unauthorized Driver Access" });
    }
    next();
};
/**
 * GET /api/drivers/shipments
 * List all active shipments (pending, processing, in_transit)
 */
router.get("/shipments", checkDriverToken, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from("shipments")
            .select("*")
            .in("status", ["pending", "processing", "in_transit"])
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * PUT /api/drivers/shipments/:id/status
 * Update shipment status and append to history
 */
router.put("/shipments/:id/status", checkDriverToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, message, location } = req.body;
        if (!status)
            return res.status(400).json({ error: "Status is required" });
        // 1. Get current shipment to fetch existing history
        const { data: shipment, error: fetchErr } = await supabaseAdmin
            .from("shipments")
            .select("status_history, status")
            .eq("id", id)
            .single();
        if (fetchErr || !shipment)
            return res.status(404).json({ error: "Shipment not found" });
        // 2. Prepare new history entry
        const history = shipment.status_history || [];
        const newEntry = {
            status,
            message: message || `Status updated to ${status}`,
            location: location || "Transhipment Point",
            timestamp: new Date().toISOString()
        };
        const updatedHistory = [...history, newEntry];
        // 3. Update shipment
        const { data, error: updateErr } = await supabaseAdmin
            .from("shipments")
            .update({
            status,
            status_history: updatedHistory,
            updated_at: new Date().toISOString()
        })
            .eq("id", id)
            .select()
            .single();
        if (updateErr)
            throw updateErr;
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
