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
            console.log("⚠️ Merchant profile missing for User ID:", userId, "DB error:", error?.message);
            console.log("   Attempting to auto-create merchant profile...");

            // Auto-create merchant profile if missing (Self-healing via upsert)
            const { data: newMerchant, error: createError } = await supabaseAdmin
                .from("merchants")
                .upsert({
                    id: userId,
                    page_id: `pending_${userId.substring(0, 8)}`,
                    business_name: "My Business",
                    business_type: "online_shop",
                    subscription_plan: "shop",
                    subscription_status: "active",
                    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                }, { onConflict: "id", ignoreDuplicates: false })
                .select("id, subscription_status, trial_ends_at, subscription_plan")
                .maybeSingle();

            if (createError || !newMerchant) {
                console.error("❌ CRITICAL: Merchant auto-creation failed for User ID:", userId);
                console.error("Error Object:", JSON.stringify(createError, null, 2));
                return res.status(403).json({
                    error: "Merchant profile missing and creation failed.",
                    details: createError?.message || "Record not returned after upsert",
                    hint: "Please ensure your Supabase user exists and is a valid UUID.",
                    userId: userId
                });
            }
            console.log("✅ Merchant profile auto-created for:", userId);

            // Use the new merchant
            req.merchant = newMerchant;
            return next();
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
                    .eq("id", userId); // Fixed: user_id -> id

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
