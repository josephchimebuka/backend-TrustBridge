import { Request, Response } from 'express';
import AuditLogService from '../services/auditService';

/**
 * Controller to handle actions related to audit logs.
 * This class contains methods for retrieving, creating, updating, and deleting audit logs.
 */
class AuditLogController {

  /**
   * Retrieves a list of audit logs for a specific user, with pagination.
   *
   * @param {Request} req - The request object containing userId in the URL parameters and pagination details (page, limit) in the query parameters.
   * @param {Response} res - The response object used to send the result of the audit log retrieval.
   * 
   * @returns {Promise<void>} A list of audit logs for the user, or an error message if an issue occurs during the retrieval process.
   */
  async getUserAuditLogs(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const data = await AuditLogService.getAuditLogs(userId, Number(page), Number(limit));

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving audit logs', error: error });
    }
  }

  /**
   * Retrieves a single audit log by its ID.
   *
   * @param {Request} req - The request object containing the audit log ID in the URL parameters.
   * @param {Response} res - The response object used to send the retrieved audit log data.
   * 
   * @returns {Promise<void>} The audit log data for the specified ID, or an error message if the log cannot be retrieved.
   */
  async getAuditLogById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await AuditLogService.getAuditLogById(id);

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving audit logs', error: error });
    }
  }

  /**
   * Creates a new audit log entry.
   *
   * @param {Request} req - The request object containing the user ID, action, and details for the new audit log in the request body.
   * @param {Response} res - The response object used to send the result of the created audit log.
   * 
   * @returns {Promise<void>} The newly created audit log data, or an error message if the log cannot be created.
   */
  async createAuditLog(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const { action, details } = req.body;

      const data = await AuditLogService.createAuditLog(userId, action, details);

      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving audit logs', error: error });
    }
  }

  /**
   * Updates an existing audit log.
   *
   * @param {Request} req - The request object containing the audit log ID in the URL parameters and updated action and details in the request body.
   * @param {Response} res - The response object used to send the result of the update.
   * 
   * @returns {Promise<void>} The updated audit log data, or an error message if the log cannot be updated.
   */
  async updateAuditLog(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, details } = req.body;

      const data = await AuditLogService.updateAuditLog(id, action, details);

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving audit logs', error: error });
    }
  }

  /**
   * Deletes an existing audit log by its ID.
   *
   * @param {Request} req - The request object containing the audit log ID in the URL parameters.
   * @param {Response} res - The response object used to send the result of the deletion.
   * 
   * @returns {Promise<void>} A message indicating the audit log was deleted, or an error message if the deletion fails.
   */
  async deleteAuditLog(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await AuditLogService.deleteAuditLog(id);

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving audit logs', error: error });
    }
  }
}

export default new AuditLogController();
