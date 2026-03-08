import express from "express";
import { addReview, getReviews } from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", addReview);
router.get("/:roomId", getReviews);

export default router;