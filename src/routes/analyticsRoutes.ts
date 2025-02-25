import express from "express";
import AnalyticsController from "../controllers/analyticsController";
import { isAuthenticated } from "../middleware/auth";

const router = express.Router();

router.get("/users/:userId/loans", isAuthenticated, AnalyticsController.getUserLoans);

export default router;
