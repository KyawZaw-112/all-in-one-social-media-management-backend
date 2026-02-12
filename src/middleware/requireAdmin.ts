import { supabaseAdmin } from "../supabaseAdmin.js";
import { Request, Response, NextFunction } from "express";

export async function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ error: "Unauthorized - No token" });
        }

        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !data?.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { data: admin } = await supabaseAdmin
            .from("admin_users")
            .select("id")
            .eq("user_id", data.user.id)
            .single();

        if (!admin) {
            return res.status(403).json({ error: "Admin only" });
        }

        (req as any).user = data.user;

        next();
    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
}
