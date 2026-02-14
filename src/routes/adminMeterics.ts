import {supabaseAdmin} from "../supabaseAdmin.js";
import {Router} from "express";


const router = Router();
router.get("/monthly-revenue", async (req, res) => {
    const firstDay = new Date();
    firstDay.setDate(1);

    const { data, error } = await supabaseAdmin
        .from("payments")
        .select("amount")
        .eq("status", "approved")
        .gte("created_at", firstDay.toISOString());

    if (error) return res.status(500).json({ error });

    const revenue = data.reduce((sum, p) => sum + p.amount, 0);

    res.json({ revenue });
});
