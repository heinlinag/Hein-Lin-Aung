import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getAllWorkers: vi.fn().mockResolvedValue([]),
  getWorkerByWorkerID: vi.fn(),
  createWorker: vi.fn().mockResolvedValue(undefined),
  deleteWorker: vi.fn().mockResolvedValue(undefined),
  getAllOrders: vi.fn().mockResolvedValue([]),
  createOrder: vi.fn().mockResolvedValue(undefined),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  deleteOrder: vi.fn().mockResolvedValue(undefined),
  generateTrackingId: vi.fn((orderID?: string) => `TRK-${orderID || 'TEST'}`),
  getPendingRequests: vi.fn().mockResolvedValue([]),
  getPendingRequestById: vi.fn(),
  createPendingRequest: vi.fn().mockResolvedValue({ id: 1 }),
  updatePendingRequestStatus: vi.fn().mockResolvedValue(undefined),
  getInProcessQtyForOrder: vi.fn().mockResolvedValue(0),
  getPendingUsedQtyForOrder: vi.fn().mockResolvedValue(0),
  processApprovePendingRequest: vi.fn().mockResolvedValue(undefined),
}));

import * as db from "./db";

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createProtectedCtx(userLevel: "1" | "1.1" | "2" = "1"): TrpcContext {
  return {
    user: {
      id: 1,
      workerID: "W-001",
      name: "Test Worker",
      department: "Production",
      userLevel,
      openId: "test-open-id",
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("pendingRequests.getInProcessQty", () => {
  beforeEach(() => {
    vi.mocked(db.getInProcessQtyForOrder).mockReset();
  });

  it("returns 0 when no in-process requests exist", async () => {
    vi.mocked(db.getInProcessQtyForOrder).mockResolvedValue(0);
    const caller = appRouter.createCaller(createProtectedCtx("2"));
    const result = await caller.pendingRequests.getInProcessQty({ orderId: 1 });
    expect(result).toBe(0);
  });

  it("returns correct in-process qty when requests exist", async () => {
    vi.mocked(db.getInProcessQtyForOrder).mockResolvedValue(70);
    const caller = appRouter.createCaller(createProtectedCtx("2"));
    const result = await caller.pendingRequests.getInProcessQty({ orderId: 1 });
    expect(result).toBe(70);
  });

  it("returns sum of multiple in-process requests", async () => {
    vi.mocked(db.getInProcessQtyForOrder).mockResolvedValue(150);
    const caller = appRouter.createCaller(createProtectedCtx("2"));
    const result = await caller.pendingRequests.getInProcessQty({ orderId: 1 });
    expect(result).toBe(150);
    expect(db.getInProcessQtyForOrder).toHaveBeenCalledWith(1);
  });

  it("works for all user levels", async () => {
    vi.mocked(db.getInProcessQtyForOrder).mockResolvedValue(50);
    
    // Test Level 1
    let caller = appRouter.createCaller(createProtectedCtx("1"));
    let result = await caller.pendingRequests.getInProcessQty({ orderId: 1 });
    expect(result).toBe(50);
    
    // Test Level 1.1
    caller = appRouter.createCaller(createProtectedCtx("1.1"));
    result = await caller.pendingRequests.getInProcessQty({ orderId: 1 });
    expect(result).toBe(50);
    
    // Test Level 2
    caller = appRouter.createCaller(createProtectedCtx("2"));
    result = await caller.pendingRequests.getInProcessQty({ orderId: 1 });
    expect(result).toBe(50);
  });
});

describe("pendingRequests.getPendingUsedQty", () => {
  beforeEach(() => {
    vi.mocked(db.getPendingUsedQtyForOrder).mockReset();
  });

  it("returns 0 when no pending used qty requests exist", async () => {
    vi.mocked(db.getPendingUsedQtyForOrder).mockResolvedValue(0);
    const caller = appRouter.createCaller(createProtectedCtx("2"));
    const result = await caller.pendingRequests.getPendingUsedQty({ orderId: 1 });
    expect(result).toBe(0);
  });

  it("returns correct pending used qty when requests exist", async () => {
    vi.mocked(db.getPendingUsedQtyForOrder).mockResolvedValue(45);
    const caller = appRouter.createCaller(createProtectedCtx("2"));
    const result = await caller.pendingRequests.getPendingUsedQty({ orderId: 1 });
    expect(result).toBe(45);
  });

  it("calculates available qty correctly (stock - pending)", async () => {
    // Mock: stock = 300, pending = 45, available = 255
    vi.mocked(db.getPendingUsedQtyForOrder).mockResolvedValue(45);
    const caller = appRouter.createCaller(createProtectedCtx("2"));
    const result = await caller.pendingRequests.getPendingUsedQty({ orderId: 1 });
    const availableQty = 300 - result; // 300 - 45 = 255
    expect(availableQty).toBe(255);
  });
});

describe("pendingRequests.list", () => {
  beforeEach(() => {
    vi.mocked(db.getPendingRequests).mockReset();
  });

  it("returns empty array when no pending requests exist", async () => {
    vi.mocked(db.getPendingRequests).mockResolvedValue([]);
    const caller = appRouter.createCaller(createProtectedCtx("2"));
    const result = await caller.pendingRequests.list();
    expect(result).toEqual([]);
  });

  it("returns pending requests for Level 2 users", async () => {
    const mockRequests = [
      {
        id: 1,
        type: "used_update",
        orderId: 1,
        status: "pending",
        requestedBy: 1,
        workerName: "Alice",
        createdAt: new Date(),
        processApprovedBy: null,
        processApprovedAt: null,
        processApprovedQty: null,
        approvedBy: null,
        approvedAt: null,
        approvedQty: null,
        cancelledBy: null,
        cancelledAt: null,
        cancelReason: null,
        actionData: JSON.stringify({ usedQty: 50 }),
        orderSnapshot: JSON.stringify({ orderID: "A-206" }),
      },
    ];
    vi.mocked(db.getPendingRequests).mockResolvedValue(mockRequests as any);
    const caller = appRouter.createCaller(createProtectedCtx("2"));
    const result = await caller.pendingRequests.list();
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("pending");
  });
});

describe("pendingRequests.submit", () => {
  beforeEach(() => {
    vi.mocked(db.createPendingRequest).mockReset();
    vi.mocked(db.processApprovePendingRequest).mockReset();
  });

  it("creates pending request for Level 1 user", async () => {
    vi.mocked(db.createPendingRequest).mockResolvedValue({ id: 1 } as any);
    const caller = appRouter.createCaller(createProtectedCtx("1"));
    const result = await caller.pendingRequests.submit({
      type: "used_update",
      orderId: 1,
      actionData: JSON.stringify({ usedQty: 50 }),
      orderSnapshot: JSON.stringify({ orderID: "A-206" }),
    });
    expect(result.success).toBe(true);
    expect(db.createPendingRequest).toHaveBeenCalledOnce();
  });

  it("auto process-approves for Level 1.1 user", async () => {
    vi.mocked(db.createPendingRequest).mockResolvedValue({ id: 1 } as any);
    vi.mocked(db.processApprovePendingRequest).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedCtx("1.1"));
    const result = await caller.pendingRequests.submit({
      type: "used_update",
      orderId: 1,
      actionData: JSON.stringify({ usedQty: 50 }),
      orderSnapshot: JSON.stringify({ orderID: "A-206" }),
    });
    expect(result.success).toBe(true);
    expect(db.createPendingRequest).toHaveBeenCalledOnce();
    expect(db.processApprovePendingRequest).toHaveBeenCalledOnce();
  });

  it("rejects submission without authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.pendingRequests.submit({
        type: "used_update",
        orderId: 1,
        actionData: JSON.stringify({ usedQty: 50 }),
        orderSnapshot: JSON.stringify({ orderID: "A-206" }),
      })
    ).rejects.toThrow("UNAUTHORIZED");
  });
});
