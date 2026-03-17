import express from "express";
import { registerUser, loginUser, refreshTokenController } from "../controllers/authController.js";

const router = express.Router();

router.post("/refresh", refreshTokenController);
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;