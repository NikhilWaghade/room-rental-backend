import express from "express";

import {
  createRoom,
  getRooms,
  getRoomById,
  deleteRoom,
  getMyRooms,
  updateRoom,
} from "../controllers/roomController.js";

import { protect, isOwner } from "../middleware/authMiddleware.js";

// ✅ upload ki jagah uploadFields import karo
import { upload, uploadFields } from "../middleware/uploadMiddleware.js";

import { roomValidation } from "../middleware/validation.js";

const router = express.Router();

router.post(
  "/",
  protect,
  isOwner,
  uploadFields, // ← ye hona chahiye, upload.array nahi
  roomValidation,
  createRoom,
);

router.get("/", getRooms);

router.get("/my-rooms", protect, isOwner, getMyRooms);

router.get("/:id", getRoomById);

router.put(
  "/:id",
  protect,
  isOwner,
  upload.array("images", 5), // ✅ ye abhi same rehne do - update me video baad me add karenge
  updateRoom,
);

router.delete("/:id", protect, isOwner, deleteRoom);

export default router;
