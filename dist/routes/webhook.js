import { Router } from "express";
import { handleWebhook, verifyWebhook } from "../controllers/webhook.js";
import { validateFacebookSignature } from "../middleware/validateFacebookSignature.js";
const router = Router();
router.get("/facebook", verifyWebhook);
router.post("/facebook", validateFacebookSignature, handleWebhook);
export default router;
