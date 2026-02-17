import { supabaseAdmin } from "../supabaseAdmin.js";

export const requireActiveSubscription = async (req: any, res: any, next: any) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // 1. Get merchant subscription status from merchants table
        const { data: merchant, error } = await supabaseAdmin
            .from("merchants")
            .select("id, subscription_status, trial_ends_at, subscription_plan")
            .eq("id", userId)
            .maybeSingle();

        if (error || !merchant) {
            console.error("❌ Subscription Check Failed:", { userId, error, merchantFound: !!merchant });
            return res.status(403).json({
                error: "လုပ်ငန်းမှတ်တမ်း မတွေ့ရှိပါ။ ကျေးဇူးပြု၍ အကောင့်ပြန်ဝင်ပါ။",
                details: `User ID: ${userId}`
            });
        }

        // 2. Check Trial expiry
        const trialEndDate = merchant.trial_ends_at ? new Date(merchant.trial_ends_at) : null;
        const now = new Date();

        // If status is 'active' but trial date is past, we should verify subscription
        if (merchant.subscription_status === 'active' && trialEndDate && now > trialEndDate) {
            // Check if there's a real paid subscription
            const { data: sub } = await supabaseAdmin
                .from("subscriptions")
                .select("status, expires_at")
                .eq("user_id", userId)
                .eq("status", "active")
                .gt("expires_at", now.toISOString())
                .maybeSingle();

            if (!sub) {
                // Trial over and no paid sub
                await supabaseAdmin
                    .from("merchants")
                    .update({ subscription_status: 'expired' })
                    .eq("user_id", userId);

                return res.status(402).json({
                    error: "Subscription expired",
                    message: "သင်၏ ၇ ရက် အခမဲ့ စမ်းသပ်ကာလ ကုန်ဆုံးသွားပါပြီ။ ဆက်လက်အသုံးပြုလိုပါက လစဉ်ကြေး ပေးသွင်းပေးပါ။"
                });
            }
        }

        // 3. Explicitly expired status
        if (merchant.subscription_status === 'expired') {
            return res.status(402).json({
                error: "Subscription expired",
                message: "သင့် လစဉ်ကြေး သက်တမ်းကုန်ဆုံးသွားပါပြီ။ ဆက်လက်အသုံးပြုလိုပါက ကျေးဇူးပြု၍ ငွေပေးချေပါ။"
            });
        }

        req.merchant = merchant;
        next();
    } catch (err) {
        return res.status(500).json({ error: "Subscription check failed" });
    }
};
