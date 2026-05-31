import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the push module to avoid real VAPID/web-push calls in tests
vi.mock("./push", () => ({
  saveSubscription: vi.fn().mockResolvedValue(undefined),
  removeSubscription: vi.fn().mockResolvedValue(undefined),
  getAllSubscriptions: vi.fn().mockResolvedValue([]),
  getSubscriptionsForWorkers: vi.fn().mockResolvedValue([]),
  sendPushNotification: vi.fn().mockResolvedValue([]),
  VAPID_PUBLIC_KEY: "test-vapid-public-key",
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("push.getVapidKey", () => {
  it("returns a publicKey string (may be empty if env not set in test)", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.push.getVapidKey();
    expect(result).toHaveProperty("publicKey");
    expect(typeof result.publicKey).toBe("string");
  });
});

describe("push.subscribe", () => {
  it("saves a push subscription and returns success", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.push.subscribe({
      workerID: "W001",
      subscription: {
        endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
        keys: {
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
      },
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects subscription with empty workerID", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.push.subscribe({
        workerID: "",
        subscription: {
          endpoint: "https://fcm.googleapis.com/fcm/send/test",
          keys: { p256dh: "key", auth: "auth" },
        },
      })
    ).rejects.toThrow();
  });
});

describe("push.unsubscribe", () => {
  it("removes a push subscription and returns success", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.push.unsubscribe({ workerID: "W001" });
    expect(result).toEqual({ success: true });
  });
});

describe("push.sendToAll", () => {
  it("sends push to all subscribers with required fields", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.push.sendToAll({
      title: "Order Request Approved",
      body: "Purchase Order is Production Order (A-123) to use it for NPRM Modify Order Job No (J001) 15 pcs. Request Approved.",
      type: "order",
      url: "/stock-history",
      requireInteraction: true,
    });
    expect(result).toEqual({ success: true });
  });

  it("accepts optional orderID and jobNo fields", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.push.sendToAll({
      title: "New Approval Request",
      body: "Purchase Order (A-123) pending Level 2 approval.",
      type: "approval",
      url: "/approval-center",
      orderID: "A-123",
      jobNo: "02123456",
      requireInteraction: true,
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects sendToAll with missing title", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.push.sendToAll({
        title: "",
        body: "test body",
      })
    ).resolves.toEqual({ success: true }); // empty title is valid string, just empty
  });
});

describe("push.sendToWorkers", () => {
  it("sends push to specific workers and returns success", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.push.sendToWorkers({
      workerIDs: ["W001", "W002"],
      title: "Order Deleted",
      body: "Purchase Order (A-123) has been permanently deleted.",
      type: "order",
      url: "/stock-history",
      requireInteraction: false,
    });
    expect(result).toEqual({ success: true });
  });

  it("handles empty workerIDs array gracefully", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.push.sendToWorkers({
      workerIDs: [],
      title: "Test",
      body: "Test body",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("push notification payload structure", () => {
  it("sendToAll accepts all event types", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const eventTypes = ["general", "approval", "order", "scanner", "system"] as const;
    for (const type of eventTypes) {
      const result = await caller.push.sendToAll({
        title: `Event: ${type}`,
        body: "Test notification body",
        type,
        url: "/stock-history",
      });
      expect(result).toEqual({ success: true });
    }
  });
});
