import AuditLogRepository from '../repositories/auditRepository';
import prisma from '../config/prisma';

/**
 * Service for handling audit log-related operations.
 * This class contains business logic for managing audit logs, including retrieval, creation, update, and deletion.
 */
class AuditLogService {

  /**
   * Retrieves a list of audit logs for a specific user, with pagination.
   *
   * @param {string} userId - The ID of the user whose audit logs are to be retrieved.
   * @param {number} [page=1] - The page number for pagination. Default is 1.
   * @param {number} [limit=10] - The number of logs to retrieve per page. Default is 10.
   * 
   * @returns {Promise<{audit_logs: any[], page: number, limit: number} | {message: string}>} The list of audit logs or a message if no logs are found.
   */
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

  /**
   * Retrieves a single audit log by its ID.
   *
   * @param {string} id - The unique ID of the audit log to retrieve.
   * 
   * @returns {Promise<any>} The requested audit log.
   */
  async getAuditLogById(id: string) {
    const auditLog = await AuditLogRepository.getAuditLogById(id);
    if (!auditLog) {
      throw new Error("Audit log not found");
    }

    return auditLog;
  }

  /**
   * Creates a new audit log entry.
   *
   * @param {string} userId - The ID of the user associated with the audit log.
   * @param {string} action - The action being logged.
   * @param {string} [details] - Optional details about the action.
   * 
   * @returns {Promise<any>} The newly created audit log.
   */
  async createAuditLog(userId: string, action: string, details?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const newLog = await AuditLogRepository.createAuditLog(userId, action, details);
    return newLog;
  }

  /**
   * Updates an existing audit log.
   *
   * @param {string} id - The unique ID of the audit log to update.
   * @param {string} [action] - The new action to set for the audit log.
   * @param {string} [details] - The new details to set for the audit log.
   * 
   * @returns {Promise<any>} The updated audit log.
   */
  async updateAuditLog(id: string, action?: string, details?: string) {
    const existingLog = await AuditLogRepository.getAuditLogById(id);
    if (!existingLog) {
      throw new Error("Audit log not found");
    }

    const updatedLog = await AuditLogRepository.updateAuditLog(id, action, details);
    return updatedLog;
  }

  /**
   * Deletes an audit log by its ID.
   *
   * @param {string} id - The unique ID of the audit log to delete.
   * 
   * @returns {Promise<{message: string}>} A success message upon successful deletion.
   */
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
