import prisma from "../config/prisma";

class AuditService {
  async logAction(userId: string | null, action: string, details?: string) {
    await prisma.auditLog.create({
      data: { userId, action, details },
    });
  }
}

export default new AuditService();
