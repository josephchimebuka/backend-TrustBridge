import { Request, Response } from 'express';
import AuditLogController from '../../src/controllers/auditController';
import AuditLogService from '../../src/services/auditService';

// Mock the AuditLogService
jest.mock("../../src/services/auditService");

describe("AuditLogController", () => {
  const userId = "test-user";
  const logId = "log-123";
  const action = "create";
  const details = "Test log details";

  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {} as Request;
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return audit logs for a user", async () => {
    req.params = { userId };
    req.query = { page: '1', limit: '10' };

    const mockLogs = [{ id: logId, userId, action, timestamp: new Date(), details }];
    (AuditLogService.getAuditLogs as jest.Mock).mockResolvedValue(mockLogs);

    await AuditLogController.getUserAuditLogs(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith(mockLogs);
    expect(AuditLogService.getAuditLogs).toHaveBeenCalledWith(userId, 1, 10);
  });

  it("should handle error when getting audit logs for a user", async () => {
    req.params = { userId };
    req.query = { page: '1', limit: '10' };

    const errorMessage = { message: 'Error retrieving audit logs', error: expect.any(Error) };
    (AuditLogService.getAuditLogs as jest.Mock).mockRejectedValue(new Error("Service error"));

    await AuditLogController.getUserAuditLogs(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(errorMessage);
  });

  it("should get an audit log by id", async () => {
    req.params = { id: logId };

    const mockLog = { id: logId, userId, action, timestamp: new Date(), details };
    (AuditLogService.getAuditLogById as jest.Mock).mockResolvedValue(mockLog);

    await AuditLogController.getAuditLogById(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith(mockLog);
    expect(AuditLogService.getAuditLogById).toHaveBeenCalledWith(logId);
  });

  it("should handle error when getting an audit log by id", async () => {
    req.params = { id: logId };

    const errorMessage = { message: 'Error retrieving audit logs', error: expect.any(Error) };
    (AuditLogService.getAuditLogById as jest.Mock).mockRejectedValue(new Error("Service error"));

    await AuditLogController.getAuditLogById(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(errorMessage);
  });

  it("should create an audit log successfully", async () => {
    req.body = { userId, action, details };

    const mockNewLog = { id: logId, userId, action, timestamp: new Date(), details };
    (AuditLogService.createAuditLog as jest.Mock).mockResolvedValue(mockNewLog);

    await AuditLogController.createAuditLog(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNewLog);
    expect(AuditLogService.createAuditLog).toHaveBeenCalledWith(userId, action, details);
  });

  it("should handle error when creating an audit log", async () => {
    req.body = { userId, action, details };

    const errorMessage = { message: 'Error retrieving audit logs', error: expect.any(Error) };
    (AuditLogService.createAuditLog as jest.Mock).mockRejectedValue(new Error("Service error"));

    await AuditLogController.createAuditLog(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(errorMessage);
  });

  it("should update an audit log successfully", async () => {
    req.params = { id: logId };
    req.body = { action: "update", details: "Updated details" };

    const mockUpdatedLog = { id: logId, userId, action: "update", timestamp: new Date(), details: "Updated details" };
    (AuditLogService.updateAuditLog as jest.Mock).mockResolvedValue(mockUpdatedLog);

    await AuditLogController.updateAuditLog(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith(mockUpdatedLog);
    expect(AuditLogService.updateAuditLog).toHaveBeenCalledWith(logId, "update", "Updated details");
  });

  it("should handle error when updating an audit log", async () => {
    req.params = { id: logId };
    req.body = { action: "update", details: "Updated details" };

    const errorMessage = { message: 'Error retrieving audit logs', error: expect.any(Error) };
    (AuditLogService.updateAuditLog as jest.Mock).mockRejectedValue(new Error("Service error"));

    await AuditLogController.updateAuditLog(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(errorMessage);
  });

  it("should delete an audit log successfully", async () => {
    req.params = { id: logId };

    const mockDeletedLog = { id: logId, userId, action, timestamp: new Date(), details };
    (AuditLogService.deleteAuditLog as jest.Mock).mockResolvedValue(mockDeletedLog);

    await AuditLogController.deleteAuditLog(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith(mockDeletedLog);
    expect(AuditLogService.deleteAuditLog).toHaveBeenCalledWith(logId);
  });

  it("should handle error when deleting an audit log", async () => {
    req.params = { id: logId };

    const errorMessage = { message: 'Error retrieving audit logs', error: expect.any(Error) };
    (AuditLogService.deleteAuditLog as jest.Mock).mockRejectedValue(new Error("Service error"));

    await AuditLogController.deleteAuditLog(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(errorMessage);
  });
});
