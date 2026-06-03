/**
 * Tests for chat and groupChat router procedures
 */
import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeCtx(workerID?: string): TrpcContext {
  return {
    user: workerID ? { id: 1, openId: workerID, name: "Test User", role: "user" } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("chat router", () => {
  it("getWorkers returns array for unknown workerID", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    const result = await caller.chat.getWorkers({ workerID: "NONEXISTENT_WORKER_XYZ" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getConversations returns empty array for unknown workerID", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    const result = await caller.chat.getConversations({ workerID: "NONEXISTENT_WORKER_XYZ" });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("getMessages returns empty array for non-existent conversationID", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    const result = await caller.chat.getMessages({ conversationID: 999999 });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("markRead does not throw for non-existent conversationID", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    await expect(
      caller.chat.markRead({ conversationID: 999999, workerID: "NONEXISTENT_WORKER_XYZ" })
    ).resolves.not.toThrow();
  });

  it("getUnreadCount returns 0 for unknown workerID", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    const result = await caller.chat.getUnreadCount({ workerID: "NONEXISTENT_WORKER_XYZ" });
    // Returns { count: number }
    expect(result).toHaveProperty("count");
    expect(typeof (result as any).count).toBe("number");
    expect((result as any).count).toBe(0);
  });
});

describe("groupChat router", () => {
  it("getGroups returns empty array for unknown workerID", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    const result = await caller.groupChat.getGroups({ workerID: "NONEXISTENT_WORKER_XYZ" });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("getMessages returns empty array for non-existent groupID", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    const result = await caller.groupChat.getMessages({ groupID: 999999 });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("getMembers returns empty array for non-existent groupID", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    const result = await caller.groupChat.getMembers({ groupID: 999999 });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("create validates name is required", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    await expect(
      caller.groupChat.create({ name: "", createdBy: "NONEXISTENT_WORKER_XYZ", memberIDs: ["OTHER"] })
    ).rejects.toThrow();
  });

  it("create validates memberIDs is not empty", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    await expect(
      caller.groupChat.create({ name: "Test Group", createdBy: "NONEXISTENT_WORKER_XYZ", memberIDs: [] })
    ).rejects.toThrow();
  });

  it("create validates max 9 additional members (10 total)", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    const tooManyMembers = Array.from({ length: 10 }, (_, i) => `MEMBER_${i}`);
    await expect(
      caller.groupChat.create({ name: "Too Big Group", createdBy: "NONEXISTENT_WORKER_XYZ", memberIDs: tooManyMembers })
    ).rejects.toThrow();
  });

  it("leave does not throw for non-existent groupID", async () => {
    const caller = appRouter.createCaller(makeCtx("NONEXISTENT_WORKER_XYZ"));
    await expect(
      caller.groupChat.leave({ groupID: 999999, workerID: "NONEXISTENT_WORKER_XYZ" })
    ).resolves.not.toThrow();
  });
});
