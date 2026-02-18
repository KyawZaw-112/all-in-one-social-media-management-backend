import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./env.js";

// Route Imports
import automationRoutes from "./routes/automation.js";
import webhookRoutes from "./routes/webhook.js";
import oauthRoutes from "./routes/oauth.js";
import adminRoutes from "./routes/admin.js";
import paymentsRoutes from "./routes/payments.js";
import adminPaymentsRoutes from "./routes/adminPayments.js";
import platformsRoutes from "./routes/platforms.js";
import autoReplyRoutes from "./routes/autoReply.js";
import merchantRoutes from "./routes/merchants.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware Setup
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://ashy.vercel.app",
        "https://all-in-one-social-media-management-ashy.vercel.app",
        process.env.FRONTEND_URL || ""
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health Check for Render/Vercel
app.get("/", (req, res) => {
    res.json({ message: "SaaS Auto-Reply API is Live! 🚀" });
});

// API Routes
app.use("/api/automation", automationRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin/payments", adminPaymentsRoutes);
app.use("/api/platforms", platformsRoutes);
app.use("/api/auto-reply", autoReplyRoutes);
app.use("/api/merchants", merchantRoutes);

// Error Handling Middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error("🔥 Global Error:", err);
    res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log(`🚀 API Server running at http://localhost:${PORT}`);
});