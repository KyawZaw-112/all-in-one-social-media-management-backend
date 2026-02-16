import { Router } from "express";
import { handleWebhook, verifyWebhook } from "../controllers/webhook.js";
const router = Router();
router.get("/facebook", verifyWebhook);
router.post("/facebook", handleWebhook);
export default router;
