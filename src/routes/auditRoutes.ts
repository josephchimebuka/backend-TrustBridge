import express from "express";
import prisma from "../config/prisma";
import {logAction} from "../services/auditService";
import AuditLogController from '../controllers/auditController';

const router = express.Router();

// Get audit logs
router.get("/audit/logs", async (_req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: "desc" } });
    res.json(logs);
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ error: errMessage });
  }
});


router.get('/users/:userId/audit-logs', AuditLogController.getUserAuditLogs);


// Manually add a log
router.post("/audit/log", async (req, res) => {
  try {
    const { userId, action, details } = req.body;
    await logAction(userId, action, details);
    res.json({ message: "Audit log recorded" });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ error: errMessage });
  }
});

export default router;
