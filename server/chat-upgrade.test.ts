/**
 * Tests for Chat & Notification upgrade features:
 * - chat.heartbeat (online status)
 * - chat.getOnlineStatus
 * - chat.deleteMessage (DM)
 * - chat.searchMessages (DM)
 * - groupChat.deleteMessage
 * - groupChat.searchMessages
 * - notifications.listByCategory
 */
import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000/api/trpc";

async function mutate(path: string, input: any) {
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  return res.json();
}

async function query(path: string, input: any) {
  // tRPC v11 with superjson: query input wrapped in {json: ...}
  const encoded = encodeURIComponent(JSON.stringify({ json: input }));
  const res = await fetch(`${BASE}/${path}?input=${encoded}`);
  return res.json();
}

describe("Chat Upgrade Features", () => {
  it("chat.heartbeat updates lastSeenAt", async () => {
    const json = await mutate("chat.heartbeat", { workerID: "TEST001" });
    expect(json.result?.data?.json?.success).toBe(true);
  });

  it("chat.getOnlineStatus returns status map", async () => {
    const json = await query("chat.getOnlineStatus", { workerIDs: ["TEST001", "NONEXIST"] });
    expect(json.result?.data?.json).toBeDefined();
    expect(typeof json.result.data.json).toBe("object");
  });

  it("chat.getOnlineStatus returns empty for empty array", async () => {
    const json = await query("chat.getOnlineStatus", { workerIDs: [] });
    expect(json.result?.data?.json).toEqual({});
  });

  it("chat.searchMessages returns array for non-existent conversation", async () => {
    const json = await query("chat.searchMessages", { conversationID: 99999, query: "test" });
    expect(Array.isArray(json.result?.data?.json)).toBe(true);
    expect(json.result.data.json.length).toBe(0);
  });

  it("chat.deleteMessage fails for non-existent message", async () => {
    const json = await mutate("chat.deleteMessage", { messageID: 999999, workerID: "TEST001" });
    expect(json.error).toBeDefined();
    expect(json.error.json.data.code).toBe("NOT_FOUND");
  });

  it("groupChat.searchMessages returns array for non-existent group", async () => {
    const json = await query("groupChat.searchMessages", { groupID: 99999, query: "hello" });
    expect(Array.isArray(json.result?.data?.json)).toBe(true);
    expect(json.result.data.json.length).toBe(0);
  });

  it("groupChat.deleteMessage fails for non-existent message", async () => {
    const json = await mutate("groupChat.deleteMessage", { messageID: 999999, workerID: "TEST001" });
    expect(json.error).toBeDefined();
    expect(json.error.json.data.code).toBe("NOT_FOUND");
  });

  it("notifications.listByCategory returns array for 'orders'", async () => {
    const json = await query("notifications.listByCategory", { category: "orders" });
    expect(Array.isArray(json.result?.data?.json)).toBe(true);
  });

  it("notifications.listByCategory returns array for 'all'", async () => {
    const json = await query("notifications.listByCategory", { category: "all" });
    expect(Array.isArray(json.result?.data?.json)).toBe(true);
  });

  it("notifications.listByCategory returns array for 'chat'", async () => {
    const json = await query("notifications.listByCategory", { category: "chat" });
    expect(Array.isArray(json.result?.data?.json)).toBe(true);
  });
});
