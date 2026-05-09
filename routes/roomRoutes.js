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

import { upload, uploadFields } from "../middleware/uploadMiddleware.js";

import { roomValidation } from "../middleware/validation.js";

const router = express.Router();

/* CREATE ROOM */

router.post("/", protect, isOwner, uploadFields, roomValidation, createRoom);

/* GET ALL ROOMS */

router.get("/", getRooms);

/* GET MY ROOMS */

router.get("/my-rooms", protect, isOwner, getMyRooms);

/* GET SINGLE ROOM */

router.get("/:id", getRoomById);

/* UPDATE ROOM */

// router.put(
//   "/:id",
//   protect,
//   isOwner,
//   uploadFields,
//   updateRoom,
// );
router.put(
  "/:id",
  protect,
  isOwner,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]),
  updateRoom,
);

/* DELETE ROOM */

router.delete("/:id", protect, isOwner, deleteRoom);

export default router;
