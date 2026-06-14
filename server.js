import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { apiLimiter } from "./middleware/rateLimiter.js";
import { logger } from "./utils/logger.js";
import { swaggerSpec } from "./config/swagger.js";

dotenv.config();

const app = express();

/* ---------------- Security Middleware ---------------- */

app.use(helmet());

app.use(cors());

app.use(express.json());

app.use(logger);

/* ---------------- Cache Control ---------------- */

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");

  next();
});

/* ---------------- Rate Limiter ---------------- */

app.use("/api", apiLimiter);

/* ---------------- Swagger Docs ---------------- */

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ---------------- Health Check ---------------- */

app.get("/", (req, res) => {
  res.send("Room Rental API is running");
});

app.get("/api", (req, res) => {
  res.json({
    message: "API is running 🚀",
  });
});

/* ---------------- Routes ---------------- */

app.use("/api/auth", authRoutes);

app.use("/api/rooms", roomRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/users", userRoutes);
/* ---------------- 404 Handler ---------------- */

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

/* ---------------- Global Error Handler ---------------- */

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
