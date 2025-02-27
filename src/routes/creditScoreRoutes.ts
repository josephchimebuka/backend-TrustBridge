import express from "express";
import CreditScoreService from "../services/creditScoreService";

const router = express.Router();

router.get("/credit-score/:userId", async (req, res) => {
  try {
    const score = await CreditScoreService.calculateCreditScore(req.params.userId);
    res.json({ userId: req.params.userId, creditScore: score });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ error: errMessage });
  }
});

router.post("/credit-score/recalculate", async (_req, res) => {
  try {
    await CreditScoreService.recalculateAllScores();
    res.json({ message: "Credit scores recalculated successfully" });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ error: errMessage });
  }
});

export default router;
