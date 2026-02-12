import { supabaseAdmin } from "../supabaseAdmin.js";

export async function requireAuth(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.sendStatus(401);

    const { data } = await supabaseAdmin.auth.getUser(token);
    if (!data.user) return res.sendStatus(401);

    req.user = data.user;
    next();
}
