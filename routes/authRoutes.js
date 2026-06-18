import express from "express";

import {
  registerUser,
  loginUser,
  refreshTokenController,
  googleLogin,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";
import {
  loginLimiter,
  forgotPasswordLimiter,
} from "../middleware/authLimiter.js";

const router = express.Router();

/* AUTH ROUTES */

router.post("/register", registerUser);

router.post("/login", loginLimiter, loginUser);

router.post("/google-login", googleLogin);

router.post("/refresh-token", refreshTokenController);

router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);

router.post("/reset-password/:token", resetPassword);

router.get("/verify-email/:token", verifyEmail);

export default router;
