import express from "express";

import {
    createRoom,
    getRooms,
    getRoomById,
    deleteRoom
} from "../controllers/roomController.js";

import { upload } from "../middleware/authMiddleware.js";

const router = express.Router();

/* CREATE ROOM WITH MULTIPLE IMAGES */

router.post("/", upload.array("images", 5), createRoom);

/* GET ALL ROOMS */

router.get("/", getRooms);

/* GET SINGLE ROOM */

router.get("/:id", getRoomById);

/* DELETE ROOM */

router.delete("/:id", deleteRoom);

export default router;