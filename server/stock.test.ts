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
}));

import * as db from "./db";

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("admin.login", () => {
  it("succeeds with correct password", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.admin.login({ password: "Qwer@7090heinann" });
    expect(result).toEqual({ success: true });
  });

  it("throws UNAUTHORIZED with wrong password", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.admin.login({ password: "wrong" })).rejects.toThrow();
  });
});

describe("workers.verify", () => {
  beforeEach(() => {
    vi.mocked(db.getWorkerByWorkerID).mockReset();
  });

  it("returns worker info when found", async () => {
    vi.mocked(db.getWorkerByWorkerID).mockResolvedValue({
      id: 1,
      workerID: "W-001",
      name: "Alice",
      department: "Production",
      createdAt: new Date(),
    });
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.workers.verify({ workerID: "W-001" });
    expect(result.workerID).toBe("W-001");
    expect(result.name).toBe("Alice");
  });

  it("throws NOT_FOUND when worker does not exist", async () => {
    vi.mocked(db.getWorkerByWorkerID).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.workers.verify({ workerID: "INVALID" })).rejects.toThrow();
  });
});

describe("orders.submit", () => {
  beforeEach(() => {
    vi.mocked(db.getWorkerByWorkerID).mockReset();
    vi.mocked(db.createOrder).mockReset();
  });

  it("submits order when worker exists", async () => {
    vi.mocked(db.getWorkerByWorkerID).mockResolvedValue({
      id: 1, workerID: "W-001", name: "Alice", department: "Production", createdAt: new Date(),
    });
    vi.mocked(db.createOrder).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.orders.submit({
      orderID: "ORD-001",
      fluteType: "AB",
      sizeW: 1530,
      sizeL: 1800,
      qty: 100,
      bqComment: "LR170MP115LR170",
      workerID: "W-001",
    });
    expect(result).toEqual({ success: true });
    expect(db.createOrder).toHaveBeenCalledOnce();
  });

  it("throws UNAUTHORIZED when worker ID is invalid", async () => {
    vi.mocked(db.getWorkerByWorkerID).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.orders.submit({
      orderID: "ORD-001", fluteType: "AB", sizeW: 1530, sizeL: 1800,
      qty: 100, bqComment: "LR170MP115LR170", workerID: "INVALID",
    })).rejects.toThrow();
  });
});

describe("workers.add", () => {
  beforeEach(() => {
    vi.mocked(db.getWorkerByWorkerID).mockReset();
    vi.mocked(db.createWorker).mockReset();
  });

  it("adds worker with correct admin password", async () => {
    vi.mocked(db.getWorkerByWorkerID).mockResolvedValue(undefined);
    vi.mocked(db.createWorker).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.workers.add({
      workerID: "W-002", name: "Bob", department: "Logistics", adminPassword: "Qwer@7090heinann",
    });
    expect(result).toEqual({ success: true });
  });

  it("throws FORBIDDEN with wrong admin password", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.workers.add({
      workerID: "W-002", name: "Bob", department: "Logistics", adminPassword: "wrong",
    })).rejects.toThrow();
  });
});
