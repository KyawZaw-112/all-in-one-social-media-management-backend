import { Router } from "express";
const router = Router();
router.post("/", async (req, res) => {
    console.log("Login log:", req.body);
    res.json({ success: true });
});
export default router;
