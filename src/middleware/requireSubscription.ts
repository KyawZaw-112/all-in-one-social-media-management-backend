import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";

export async function requireSubscription(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
) {
    const userId = req.user?.id;

    if (!userId) {
        return res.sendStatus(401);
    }

    const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .single();

    if (error || !data) {
        return res.status(403).json({
            error: "Active subscription required",
        });
    }

    // optional: attach subscription
    (req as any).subscription = data;

    next();
}
