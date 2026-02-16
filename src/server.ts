// src/server.ts
// IMPORTANT: Load env FIRST before any other imports
import "./env.js";
import express from "express";
import cors from "cors";
import oauthRoutes from "./routes/oauth.js";
import subscriptions from "./routes/subscriptions.js";
import payments from "./routes/payments.js";
import platforms from "./routes/platforms.js";
import adminPayments from "./routes/adminPayments.js";
import adminRoutes from "./routes/admin.js";
import adminUsersRoutes from "./routes/admin.users.routes.js";
import autoReplyRoutes from './routes/autoReply.js';
import webhookRoutes from "./routes/webhook.js";
import rulesRoutes from "./routes/rules.route.js";
import statRouter from "./routes/stats.js";
import { env } from "./config/env.js";
const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running" });
});

import logLoginRouter from "./routes/log-login.js";
app.use("/stats",statRouter)
app.use("/api/log-login", logLoginRouter);
app.use("/webhook", webhookRoutes);
app.use("/rules", rulesRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/subscriptions", subscriptions);
app.use("/payments", payments);
app.use("/platforms", platforms);
app.use("/admin", adminRoutes);
app.use("/admin/users", adminUsersRoutes);
app.use("/admin/payments", adminPayments);
app.use("/dashboard/auto-reply",autoReplyRoutes)
app.get("/", (req, res) => {
    res.send("Welcome to the API");
})


app.listen(4000, () => {
    console.log("🚀 Server is running on http://localhost:4000");
});