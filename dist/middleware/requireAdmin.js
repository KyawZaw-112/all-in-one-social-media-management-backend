import { supabaseAdmin } from "../supabaseAdmin.js";
export const requireAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
        return res.status(401).json({ error: "Invalid token" });
    }
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
    if (profile?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    req.admin = {
        id: data.user.id,
        email: data.user.email ?? undefined,
    };
    next();
};
