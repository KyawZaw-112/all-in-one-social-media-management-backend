import { Router } from "express";
import { getMetrics } from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// router.get("/metrics", async (req, res) => {
//     res.json({
//         totalUsers: 100,
//         activeUsers: 80,
//         subscribedUsers: 50,
//         churnedUsers: 10,
//     });
// });

router.get("/metrics",  requireAdmin, getMetrics);

export default router;
