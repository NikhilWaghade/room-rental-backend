import express from "express";
import { addReview, getReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ADD REVIEW */

router.post(
    "/:roomId",
    protect,
    addReview
);

/* GET REVIEWS */

router.get(
    "/:roomId",
    getReviews
);

export default router;