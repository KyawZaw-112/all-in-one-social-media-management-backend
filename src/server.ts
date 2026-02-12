// src/server.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
console.log("🔥 RAW ENV TEST 🔥");
console.log("SUPABASE_URL =", process.env.SUPABASE_URL);
console.log("CWD =", process.cwd());
import express from "express";
import cors from "cors";

import subscriptions from "./routes/subscriptions.js";
import posts from "./routes/posts.js";
import payments from "./routes/payments.js";
import platforms from "./routes/platforms.js";
import adminPayments from "./routes/adminPayments.js";
import adminRoutes from "./routes/admin.js";
import adminUsersRoutes from "./routes/admin.users.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running" });
});

app.use("/api/subscriptions", subscriptions);
app.use("/posts", posts);
app.use("/payments", payments);
app.use("/platforms", platforms);
app.use("/api/admin/payments", adminPayments);
app.use("/admin", adminRoutes);
app.use("/api/admin/users", adminUsersRoutes);



app.listen(4000, () => {
    // API running successfully
});
