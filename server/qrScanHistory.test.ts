import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Create a mock context for testing
function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "manus",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      headers: {},
      cookies: {},
    } as any,
    res: {
      setHeader: () => {},
      setCookie: () => {},
    } as any,
  };
}

describe("QR Scan History", () => {
  const caller = appRouter.createCaller(createMockContext());

  it("should retrieve QR scan history", async () => {
    const history = await caller.orders.getQrScanHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it("should have scan history entries with required fields", async () => {
    const history = await caller.orders.getQrScanHistory();
    if (history.length > 0) {
      const log = history[0];
      expect(log).toHaveProperty("id");
      expect(log).toHaveProperty("orderId");
      expect(log).toHaveProperty("scannedBy");
      expect(log).toHaveProperty("scannedByName");
      expect(log).toHaveProperty("action");
      expect(log).toHaveProperty("createdAt");
    }
  });

  it("should retrieve scan history in chronological order", async () => {
    const history = await caller.orders.getQrScanHistory();
    if (history.length > 1) {
      // Verify chronological order (either ascending or descending)
      let isAscending = true;
      let isDescending = true;
      
      for (let i = 1; i < history.length; i++) {
        const prevTime = new Date(history[i - 1].createdAt).getTime();
        const currTime = new Date(history[i].createdAt).getTime();
        
        if (currTime < prevTime) isAscending = false;
        if (currTime > prevTime) isDescending = false;
      }
      
      // At least one ordering should be true
      expect(isAscending || isDescending).toBe(true);
    }
  });

  it("should retrieve scan history limited to 200 records", async () => {
    const history = await caller.orders.getQrScanHistory();
    expect(history.length).toBeLessThanOrEqual(200);
  });

  it("should have valid action types in scan history", async () => {
    const history = await caller.orders.getQrScanHistory();
    for (const log of history) {
      expect(log.action).toMatch(/^(scan|balance_update)$/);
    }
  });

  it("should handle balance update entries with oldQty and newQty", async () => {
    const history = await caller.orders.getQrScanHistory();
    const balanceUpdates = history.filter((log) => log.action === "balance_update");
    for (const log of balanceUpdates) {
      // Balance updates should have oldQty and newQty or both null
      if (log.oldQty !== null && log.newQty !== null) {
        expect(typeof log.oldQty).toBe("number");
        expect(typeof log.newQty).toBe("number");
      }
    }
  });
});
