import express from "express";
import AnalyticsController from "../controllers/analyticsController";
import { isAuthenticated } from "../middleware/auth";

const router = express.Router();

router.get("/users/:userId/loans", isAuthenticated, AnalyticsController.getUserLoans);
router.get("/users/:userId/payments", isAuthenticated, AnalyticsController.getUserPayments);
router.get("/users/:userId/reputation", isAuthenticated, AnalyticsController.getUserReputation);

export default router;
