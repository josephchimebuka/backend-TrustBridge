import AuditLogRepository from '../repositories/auditRepository';
import prisma from '../config/prisma';

class AuditLogService {
  async getAuditLogs(userId: string, page: number = 1, limit: number = 10) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const auditLogs = await AuditLogRepository.getAuditLogs(page, limit, userId);
    if (!auditLogs.length) {
      return { message: "No audit logs found for this user." };
    }

    return {
      audit_logs: auditLogs,
      page,
      limit,
    };
  }

  async getAuditLogById(id: string) {
    const auditLog = await AuditLogRepository.getAuditLogById(id);
    if (!auditLog) {
      throw new Error("Audit log not found");
    }

    return auditLog;
  }

  async createAuditLog(userId: string, action: string, details?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const newLog = await AuditLogRepository.createAuditLog(userId, action, details);
    return newLog;
  }

  async updateAuditLog(id: string, action?: string, details?: string) {
    const existingLog = await AuditLogRepository.getAuditLogById(id);
    if (!existingLog) {
      throw new Error("Audit log not found");
    }

    const updatedLog = await AuditLogRepository.updateAuditLog(id, action, details);
    return updatedLog;
  }

  async deleteAuditLog(id: string) {
    const existingLog = await AuditLogRepository.getAuditLogById(id);
    if (!existingLog) {
      throw new Error("Audit log not found");
    }

    await AuditLogRepository.deleteAuditLog(id);
    return { message: "Audit log deleted successfully" };
  }
}

export default new AuditLogService();
