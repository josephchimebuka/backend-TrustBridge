import prisma from '../config/prisma';

class AuditLogRepository {

  async createAuditLog(userId: string, action: string, details?: string) {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  }
  
  async getAuditLogs(page: number = 1, limit: number = 10, userId?: string) {
    const validatedPage = Math.max(1, Math.floor(page)); // mínimo 1
    const validatedLimit = Math.max(1, Math.floor(limit)); // mínimo 1

    const skip = (validatedPage - 1) * validatedLimit;

    const whereClause = userId ? { userId } : {};

    return prisma.auditLog.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async getAuditLogById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
    });
  }

  async updateAuditLog(id: string, action?: string, details?: string) {
    return prisma.auditLog.update({
      where: { id },
      data: {
        action,
        details,
      },
    });
  }

  async deleteAuditLog(id: string) {
    return prisma.auditLog.delete({
      where: { id },
    });
  }
}

export default new AuditLogRepository();


