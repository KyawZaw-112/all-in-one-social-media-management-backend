import { supabaseAdmin } from "../supabaseAdmin.js";

export async function requireAdmin(req:any, res:any, next:any) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data } = await supabaseAdmin.auth.getUser(token);
    if (!data?.user) return res.status(401).json({ error: "Invalid token" });

    const { data: admin } = await supabaseAdmin
        .from("admin_users")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

    if (!admin) return res.status(403).json({ error: "Admin only" });

    req.user = data.user;
    next();
}
