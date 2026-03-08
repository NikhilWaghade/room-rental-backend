import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";

dotenv.config();

const app = express();

/* ---------------- Middleware ---------------- */

app.use(cors());
app.use(express.json());

/* ---------------- Health Check ---------------- */

app.get("/", (req, res) => {
    res.send("Room Rental API is running");
});

/* ---------------- Routes ---------------- */

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);

/* ---------------- 404 Handler ---------------- */

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
    });
});

/* ---------------- Error Handler ---------------- */

app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);

    res.status(500).json({
        error: "Internal Server Error",
    });
});

/* ---------------- Start Server ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});