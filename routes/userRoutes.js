import express from "express";

import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* GET PROFILE */

router.get(
  "/profile",
  protect,
  getProfile
);

/* UPDATE PROFILE */

router.put(
  "/profile",
  protect,
  updateProfile
);

/* CHANGE PASSWORD */

router.put(
  "/change-password",
  protect,
  changePassword
);

export default router;