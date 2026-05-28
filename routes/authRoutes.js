import express from "express";

import {
  registerUser,
  loginUser,
  refreshTokenController,
  googleLogin,
} from "../controllers/authController.js";

const router = express.Router();

/* AUTH ROUTES */

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/google-login", googleLogin);

router.post("/refresh-token", refreshTokenController);

export default router;
