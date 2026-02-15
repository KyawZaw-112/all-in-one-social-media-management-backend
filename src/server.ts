// src/server.ts
// IMPORTANT: Load env FIRST before any other imports
"use client"
import "./env.js";

import express from "express";
import cors from "cors";
import oauthRoutes from "./routes/oauth.js";
import subscriptions from "./routes/subscriptions.js";
import posts from "./routes/posts.js";
import payments from "./routes/payments.js";
import platforms from "./routes/platforms.js";
import adminPayments from "./routes/adminPayments.js";
import adminRoutes from "./routes/admin.js";
import adminUsersRoutes from "./routes/admin.users.routes.js";
import autoReplyRoutes from './routes/autoReply.js';
import { env } from "./config/env.js";
const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running" });
});



app.use("/api/oauth", oauthRoutes);


app.use("/subscriptions", subscriptions);
app.use("/posts", posts);
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