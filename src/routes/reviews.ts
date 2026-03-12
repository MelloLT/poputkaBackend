import express from "express";
import { createReview, getUserReviews } from "../controllers/reviewController";
import { authMiddleware } from "../middleware/auth";
import {
  checkSelfReview,
  checkDuplicateReview,
} from "../middleware/validation";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  checkSelfReview,
  checkDuplicateReview,
  createReview
);
router.get("/user/:userId", getUserReviews);

export default router;
