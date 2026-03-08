import express from "express";
import {
    addWishlist,
    getWishlist,
    removeWishlist
} from "../controllers/wishlistController.js";

const router = express.Router();

router.post("/", addWishlist);
router.get("/:userId", getWishlist);
router.delete("/:id", removeWishlist);

export default router;