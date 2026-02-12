import { Request, Response } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";

export const getMetrics = async (_req: Request, res: Response) => {
    try {
        const { count: totalUsers } = await supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true });

        const { count: subscribedUsers } = await supabaseAdmin
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");

        res.json({
            totalUsers: totalUsers || 0,
            activeUsers: totalUsers || 0,
            subscribedUsers: subscribedUsers || 0,
            churnedUsers: 0,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to load metrics" });
    }
};
