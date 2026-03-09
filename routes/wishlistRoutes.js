import express from "express";
import {
    addWishlist,
    getWishlist,
    removeWishlist
} from "../controllers/wishlistController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ADD TO WISHLIST */

router.post(
    "/:roomId",
    protect,
    addWishlist
);

/* GET USER WISHLIST */

router.get(
    "/",
    protect,
    getWishlist
);

/* REMOVE FROM WISHLIST */

router.delete(
    "/:roomId",
    protect,
    removeWishlist
);

export default router;