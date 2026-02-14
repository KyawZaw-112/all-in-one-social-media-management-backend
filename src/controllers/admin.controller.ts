
import { Request, Response } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";

export const getDashboardMetrics = async (
    req: Request,
    res: Response
) => {
    try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

        const { count: users } = await supabaseAdmin
            .from("profiles")
            .select("*", { count: "exact", head: true });

        const { data: payments } = await supabaseAdmin
            .from("payments")
            .select("status, amount, created_at");

        const monthlyRevenue = payments
            ?.filter(
                (p) =>
                    p.status === "approved" &&
                    new Date(p.created_at) >= firstDay
            )
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const pending =
            payments?.filter((p) => p.status === "pending").length || 0;

        const approved =
            payments?.filter((p) => p.status === "approved").length || 0;

        res.json({
            users,
            pending,
            approved,
            monthlyRevenue: monthlyRevenue || 0,
        });
    } catch (err) {
        res.status(500).json({ error: "Admin metrics error" });
    }
};
