import prisma from '../config/prisma';

/**
 * Repository for interacting with the audit log data.
 * This class contains methods for creating, retrieving, updating, and deleting audit logs in the database.
 */
class AuditLogRepository {

  /**
   * Creates a new audit log entry.
   *
   * @param {string} userId - The ID of the user associated with the audit log.
   * @param {string} action - The action performed that is being logged.
   * @param {string} [details] - Optional details about the action performed.
   * 
   * @returns {Promise<any>} The newly created audit log.
   */
  async createAuditLog(userId: string, action: string, details?: string) {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  }

  /**
   * Retrieves a list of audit logs with pagination and an optional filter for a specific user.
   *
   * @param {number} [page=1] - The page number for pagination. Default is 1.
   * @param {number} [limit=10] - The number of records to retrieve per page. Default is 10.
   * @param {string} [userId] - The optional user ID to filter audit logs by a specific user.
   * 
   * @returns {Promise<any[]>} A list of audit logs, potentially filtered by `userId` and paginated.
   */
  async getAuditLogs(page: number = 1, limit: number = 10, userId?: string) {
    const validatedPage = Math.max(1, Math.floor(page)); // minimum 1
    const validatedLimit = Math.max(1, Math.floor(limit)); // minimum 1

    const skip = (validatedPage - 1) * validatedLimit;

    const whereClause = userId ? { userId } : {};

    return prisma.auditLog.findMany({
      where: whereClause,
      skip,
      take: validatedLimit,
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * Retrieves a single audit log by its ID.
   *
   * @param {string} id - The unique ID of the audit log to retrieve.
   * 
   * @returns {Promise<any>} The audit log associated with the specified ID.
   */
  async getAuditLogById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
    });
  }

  /**
   * Updates an existing audit log by its ID.
   *
   * @param {string} id - The unique ID of the audit log to update.
   * @param {string} [action] - The new action to set for the audit log.
   * @param {string} [details] - The new details to set for the audit log.
   * 
   * @returns {Promise<any>} The updated audit log.
   */
  async updateAuditLog(id: string, action?: string, details?: string) {
    return prisma.auditLog.update({
      where: { id },
      data: {
        action,
        details,
      },
    });
  }

  /**
   * Deletes an audit log by its ID.
   *
   * @param {string} id - The unique ID of the audit log to delete.
   * 
   * @returns {Promise<any>} The result of the deletion operation.
   */
  async deleteAuditLog(id: string) {
    return prisma.auditLog.delete({
      where: { id },
    });
  }
}

export default new AuditLogRepository();
