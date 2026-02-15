import express from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { getDashboardMetrics } from "../controllers/admin.controller.js";
const router = express.Router();
router.get("/metrics", requireAdmin, getDashboardMetrics);
export default router;
