// import { Router } from "express";
// import { AdminUsersController } from "../controllers/admin.users.controller.js";
// import { requireAdmin } from "../middleware/requireAdmin.js";
//
// const router = Router();
// const controller = new AdminUsersController();
//
// router.get("/", requireAdmin, controller.getUsers.bind(controller));
// router.post("/", requireAdmin, controller.createUser.bind(controller));
// router.put("/:id", requireAdmin, controller.updateUser.bind(controller));
// router.delete("/:id", requireAdmin, controller.deleteUser.bind(controller));
//
// export default router;

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

        const { data, error } =
            await supabaseAdmin.auth.admin.listUsers({
                page,
                perPage: limit,
            });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({
            users: data.users,
            total: data.users.length,
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

export default router;
