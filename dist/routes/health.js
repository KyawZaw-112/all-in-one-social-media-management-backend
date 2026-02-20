import express from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import logger from "../utils/logger.js";
const router = express.Router();
router.get("/", async (req, res) => {
    const healthData = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        database: "unknown"
    };
    try {
        // Simple ping to Supabase to check connectivity
        const { error } = await supabaseAdmin.from("merchants").select("id").limit(1);
        if (error) {
            healthData.status = "error";
            healthData.database = "error";
            healthData.error = error.message;
            logger.error("Health Check: DB Connection Failed", error);
        }
        else {
            healthData.database = "ok";
        }
    }
    catch (err) {
        healthData.status = "error";
        healthData.database = "error";
        healthData.error = err.message;
        logger.error("Health Check: Exception", err);
    }
    const statusCode = healthData.status === "ok" ? 200 : 503;
    res.status(statusCode).json(healthData);
});
export default router;
