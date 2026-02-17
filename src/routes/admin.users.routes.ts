import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

/* ===============================
   GET USERS (Auth users)
================================ */
router.get("/", requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        /* 1️⃣ Auth Users */
        const { data, error } =
            await supabaseAdmin.auth.admin.listUsers({
                page,
                perPage: limit,
            });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const authUsers = data?.users || [];

        /* 2️⃣ Subscriptions */
        const { data: subscriptionsData } = await supabaseAdmin
            .from("subscriptions")
            .select("*");

        const subscriptions = subscriptionsData || [];

        /* 3️⃣ Login Logs */
        const { data: logsData } = await supabaseAdmin
            .from("login_logs")
            .select("*")
            .order("created_at", { ascending: false });

        const logs = logsData || [];

        /* 4️⃣ Merge */
        const mergedUsers = authUsers.map((user) => {
            const sub = subscriptions.find(
                (s) => s.user_id === user.id
            );

            const userLogs = logs.filter(
                (l) => l.user_id === user.id
            );

            const lastLog = userLogs[0];

            return {
                id: user.id,
                email: user.email ?? "-",
                last_sign_in_at: user.last_sign_in_at ?? null,

                // ✅ subscription safe defaults
                plan: sub?.plan ?? "Free",
                status: sub?.status ?? "inactive",
                expires_at: sub?.expires_at ?? null,
                confirmed_at: sub?.confirmed_at ?? null,

                created_at: user.created_at ?? null,

                // ✅ login log safe defaults
                device: lastLog?.device ?? "-",
                browser: lastLog?.browser ?? "-",
                country: lastLog?.country ?? "-",
                login_count: userLogs.length ?? 0,
            };
        });

        res.json({
            users: mergedUsers,
            total: mergedUsers.length,
        });

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/* ===============================
   DELETE USER
================================ */
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } =
            await supabaseAdmin.auth.admin.deleteUser(id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true });

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});


/* ===============================
   CREATE USER
   POST /api/admin/users
================================ */
router.post("/", requireAdmin, async (req, res) => {
    try {
        const { email, password, name, role = "user" } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        /* 1️⃣ Create User in Supabase Auth */
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm email since admin created it
            user_metadata: { full_name: name, role: role }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");

        /* 2️⃣ Add to merchants table */
        const { error: merchantError } = await supabaseAdmin.from("merchants").insert({
            id: authData.user.id,
            business_name: `${name}'s Business`,
            subscription_plan: 'shop', // Default plan
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days trial
            subscription_status: 'active'
        });

        if (merchantError) {
            // Rollback auth user creation if merchant creation fails?
            // For now, just log it. In production, we'd want a transaction or rollback.
            console.error("Merchant creation failed after auth user created:", merchantError);
            return res.status(500).json({ error: "User created but profile setup failed: " + merchantError.message });
        }

        res.status(201).json({
            success: true,
            user: authData.user,
            message: "User created successfully"
        });

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
