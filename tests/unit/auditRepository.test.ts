import prisma from "../../src/config/prisma";
import AuditLogRepository from "../../src/repositories/auditRepository";

jest.mock("../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("AuditLogRepository", () => {
  const userId = "test-user";
  const logId = "log-123";
  const action = "create";
  const details = "Log creation details";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new audit log", async () => {
    const mockCreate = prisma.auditLog.create as jest.Mock;
    const mockLog = { id: logId, userId, action, timestamp: new Date(), details };

    mockCreate.mockResolvedValue(mockLog);

    const newLog = await AuditLogRepository.createAuditLog(userId, action, details);

    expect(newLog).toEqual(mockLog);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId,
        action,
        details,
      },
    });
  });

  it("should get audit logs with pagination and without userId filter", async () => {
    const mockFindMany = prisma.auditLog.findMany as jest.Mock;
    const mockLogs = [{ id: logId, userId, action, timestamp: new Date(), details }];
    
    mockFindMany.mockResolvedValue(mockLogs);

    const logs = await AuditLogRepository.getAuditLogs(1, 10);

    expect(logs).toEqual(mockLogs);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { timestamp: "desc" },
    });
  });

  it("should get audit logs filtered by userId", async () => {
    const mockFindMany = prisma.auditLog.findMany as jest.Mock;
    const mockLogs = [{ id: logId, userId, action, timestamp: new Date(), details }];
    
    mockFindMany.mockResolvedValue(mockLogs);

    const logs = await AuditLogRepository.getAuditLogs(1, 10, userId);

    expect(logs).toEqual(mockLogs);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId },
      skip: 0,
      take: 10,
      orderBy: { timestamp: "desc" },
    });
  });

  it("should get an audit log by id", async () => {
    const mockFindUnique = prisma.auditLog.findUnique as jest.Mock;
    const mockLog = { id: logId, userId, action, timestamp: new Date(), details };

    mockFindUnique.mockResolvedValue(mockLog);

    const log = await AuditLogRepository.getAuditLogById(logId);

    expect(log).toEqual(mockLog);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: logId } });
  });

  it("should update an audit log", async () => {
    const mockUpdate = prisma.auditLog.update as jest.Mock;
    const updatedLog = { id: logId, userId, action: "update", timestamp: new Date(), details };

    mockUpdate.mockResolvedValue(updatedLog);

    const log = await AuditLogRepository.updateAuditLog(logId, "update", details);

    expect(log).toEqual(updatedLog);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: logId },
      data: { action: "update", details },
    });
  });

  it("should delete an audit log", async () => {
    const mockDelete = prisma.auditLog.delete as jest.Mock;
    const deletedLog = { id: logId, userId, action, timestamp: new Date(), details };

    mockDelete.mockResolvedValue(deletedLog);

    const log = await AuditLogRepository.deleteAuditLog(logId);

    expect(log).toEqual(deletedLog);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: logId } });
  });

  it("should handle errors when creating an audit log", async () => {
    const mockCreate = prisma.auditLog.create as jest.Mock;
    mockCreate.mockRejectedValue(new Error("Database error"));

    await expect(AuditLogRepository.createAuditLog(userId, action, details))
      .rejects
      .toThrow("Database error");
  });
});
