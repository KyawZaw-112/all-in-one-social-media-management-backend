import { supabaseAdmin } from "../supabaseAdmin.js";

export const requireSubscription = async (
    req: any,
    res: any,
    next: any
) => {
    const { data } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", req.user.id)
        .eq("status", "active")
        .single();

    if (!data) {
        return res.status(403).json({
            error: "Active subscription required"
        });
    }

    next();
};
