import express from "express";

import {
    createRoom,
    getRooms,
    getRoomById,
    deleteRoom,
    getMyRooms,
    updateRoom,
    deleteRoomImage
} from "../controllers/roomController.js";

import {
    upload,
    protect,
    isOwner
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* CREATE ROOM (OWNER ONLY) */

router.post(
    "/",
    protect,
    isOwner,
    upload.array("images", 5),
    createRoom
);


/* GET ALL ROOMS (PUBLIC) */

router.get("/", getRooms);

/* GET OWNER ROOMS */

router.get(
    "/my-rooms",
    protect,
    isOwner,
    getMyRooms
);

/* GET SINGLE ROOM */

router.get("/:id", getRoomById);

/* UPDATE ROOM (OWNER ONLY) */

router.put(
    "/:id",
    protect,
    isOwner,
    upload.array("images", 5),
    updateRoom
);


/* DELETE ROOM (OWNER ONLY) */

router.delete(
    "/:id",
    protect,
    isOwner,
    deleteRoom
);

/* DELETE SINGLE IMAGE */

router.delete(
    "/image/:imageId",
    protect,
    isOwner,
    deleteRoomImage
);


export default router;