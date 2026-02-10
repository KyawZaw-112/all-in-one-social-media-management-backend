import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../supabaseAdmin.js";

export async function adminLogin(req:any, res:any) {
    const { email, password } = req.body;

    const { data: admin } = await supabaseAdmin
        .from("admins")
        .select("*")
        .eq("email", email)
        .eq("active", true)
        .single();

    if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { adminId: admin.id, role: admin.role },
        process.env.ADMIN_JWT_SECRET!,
        { expiresIn: "8h" }
    );

    res.cookie("admin_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    });

    res.json({ success: true });
}
