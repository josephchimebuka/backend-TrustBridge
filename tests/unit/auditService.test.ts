import prisma from '../../src/config/prisma';
import AuditLogService from '../../src/services/auditService';

jest.mock("../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('AuditLogService', () => {
  const userId = "test-user";
  const logId = "log-123";
  const action = "create";
  const details = "Test log details";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if user not found when creating an audit log", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(AuditLogService.createAuditLog(userId, action, details))
      .rejects
      .toThrow("User not found");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
  });

  it("should create a new audit log successfully", async () => {
    const mockCreate = prisma.auditLog.create as jest.Mock;
    const mockUser = { id: userId };
    const mockNewLog = { id: logId, userId, action, timestamp: new Date(), details };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    mockCreate.mockResolvedValue(mockNewLog);

    const result = await AuditLogService.createAuditLog(userId, action, details);

    expect(result).toEqual(mockNewLog);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId, action, details },
    });
  });

  it("should get an audit log by ID", async () => {
    const mockGetLog = prisma.auditLog.findUnique as jest.Mock;
    const mockLog = { id: logId, userId, action, timestamp: new Date(), details };

    mockGetLog.mockResolvedValue(mockLog);

    const log = await AuditLogService.getAuditLogById(logId);

    expect(log).toEqual(mockLog);
    expect(mockGetLog).toHaveBeenCalledWith({ where: { id: logId } });
  });

  it("should throw error if audit log not found when getting by ID", async () => {
    (prisma.auditLog.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(AuditLogService.getAuditLogById(logId))
      .rejects
      .toThrow("Audit log not found");

    expect(prisma.auditLog.findUnique).toHaveBeenCalledWith({ where: { id: logId } });
  });

  it("should update an audit log successfully", async () => {
    const mockUpdate = prisma.auditLog.update as jest.Mock;
    const mockLog = { id: logId, userId, action, timestamp: new Date(), details };

    (prisma.auditLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    mockUpdate.mockResolvedValue(mockLog);

    const updatedLog = await AuditLogService.updateAuditLog(logId, "update", "Updated details");

    expect(updatedLog).toEqual(mockLog);
    expect(prisma.auditLog.findUnique).toHaveBeenCalledWith({ where: { id: logId } });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: logId },
      data: { action: "update", details: "Updated details" },
    });
  });

  it("should throw error if audit log not found when updating", async () => {
    (prisma.auditLog.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(AuditLogService.updateAuditLog(logId, "update", "Updated details"))
      .rejects
      .toThrow("Audit log not found");

    expect(prisma.auditLog.findUnique).toHaveBeenCalledWith({ where: { id: logId } });
  });

  it("should delete an audit log successfully", async () => {
    const mockDelete = prisma.auditLog.delete as jest.Mock;
    const mockLog = { id: logId, userId, action, timestamp: new Date(), details };

    (prisma.auditLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    mockDelete.mockResolvedValue(mockLog);

    const result = await AuditLogService.deleteAuditLog(logId);

    expect(result).toEqual({ message: "Audit log deleted successfully" });
    expect(prisma.auditLog.findUnique).toHaveBeenCalledWith({ where: { id: logId } });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: logId } });
  });

  it("should throw error if audit log not found when deleting", async () => {
    (prisma.auditLog.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(AuditLogService.deleteAuditLog(logId))
      .rejects
      .toThrow("Audit log not found");

    expect(prisma.auditLog.findUnique).toHaveBeenCalledWith({ where: { id: logId } });
  });

  it("should throw error if user not found when getting audit logs", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(AuditLogService.getAuditLogs(userId, 1, 10))
      .rejects
      .toThrow("User not found");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
  });

  it("should return a message if no audit logs are found for the user", async () => {
    const mockGetLogs = prisma.auditLog.findMany as jest.Mock;

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
    mockGetLogs.mockResolvedValue([]);

    const result = await AuditLogService.getAuditLogs(userId, 1, 10);

    expect(result).toEqual({ message: "No audit logs found for this user." });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    expect(mockGetLogs).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  });

  it("should return audit logs when found", async () => {
    const mockGetLogs = prisma.auditLog.findMany as jest.Mock;
    const mockLogs = [
      { id: "log-1", userId, action, timestamp: new Date(), details },
      { id: "log-2", userId, action, timestamp: new Date(), details },
    ];

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
    mockGetLogs.mockResolvedValue(mockLogs);

    const result = await AuditLogService.getAuditLogs(userId, 1, 10);

    expect(result).toEqual({
      audit_logs: mockLogs,
      page: 1,
      limit: 10,
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    expect(mockGetLogs).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  });
});
