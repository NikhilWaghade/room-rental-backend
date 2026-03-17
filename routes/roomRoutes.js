import express from "express";

import {
    createRoom,
    getRooms,
    getRoomById,
    deleteRoom,
    getMyRooms,
    updateRoom
} from "../controllers/roomController.js";

import { protect, isOwner } from "../middleware/authMiddleware.js";

import { upload } from "../middleware/uploadMiddleware.js";

import { roomValidation } from "../middleware/validation.js";

const router = express.Router();


router.post(
    "/",
    protect,
    isOwner,
    upload.array("images", 5),
    roomValidation,
    createRoom
);


router.get("/", getRooms);

router.get("/my-rooms", protect, isOwner, getMyRooms);

router.get("/:id", getRoomById);

router.put(
    "/:id",
    protect,
    isOwner,
    upload.array("images", 5),
    updateRoom
);

router.delete("/:id", protect, isOwner, deleteRoom);

export default router;