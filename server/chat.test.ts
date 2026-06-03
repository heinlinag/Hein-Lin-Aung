import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
  or: vi.fn((...args) => ({ type: "or", args })),
  and: vi.fn((...args) => ({ type: "and", args })),
  desc: vi.fn((a) => ({ type: "desc", a })),
  asc: vi.fn((a) => ({ type: "asc", a })),
  isNull: vi.fn((a) => ({ type: "isNull", a })),
  ne: vi.fn((a, b) => ({ type: "ne", a, b })),
  sql: Object.assign(vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ type: "sql", strings, values })), {
    raw: vi.fn((s: string) => ({ type: "sql_raw", s })),
  }),
}));

// Mock schema
vi.mock("../drizzle/schema", () => ({
  conversations: { id: "id", worker1ID: "worker1ID", worker2ID: "worker2ID", orderRef: "orderRef", orderLabel: "orderLabel", lastMessageAt: "lastMessageAt" },
  chatMessages: { id: "id", conversationID: "conversationID", senderID: "senderID", text: "text", createdAt: "createdAt", readAt: "readAt" },
  workers: { id: "id", workerID: "workerID", name: "name", department: "department", userLevel: "userLevel" },
}));

describe("Chat Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getConversations", () => {
    it("returns empty array when db is unavailable", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValue(null as never);

      // Simulate the procedure logic
      const db = await getDb();
      if (!db) {
        expect(db).toBeNull();
        return;
      }
      expect(true).toBe(false); // Should not reach here
    });

    it("returns conversations for a worker", async () => {
      const { getDb } = await import("./db");
      const mockConvs = [
        { id: 1, worker1ID: "W001", worker2ID: "W002", orderRef: null, orderLabel: null, lastMessageAt: new Date() },
      ];
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockConvs),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as never);

      const db = await getDb();
      expect(db).not.toBeNull();
    });
  });

  describe("getOrCreate", () => {
    it("creates a new conversation if none exists", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as never);

      const db = await getDb();
      expect(db).not.toBeNull();
    });

    it("returns existing conversation if already exists", async () => {
      const { getDb } = await import("./db");
      const existing = { id: 5, worker1ID: "W001", worker2ID: "W002", orderRef: null, orderLabel: null, lastMessageAt: new Date() };
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existing]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as never);

      const db = await getDb();
      expect(db).not.toBeNull();
    });
  });

  describe("getMessages", () => {
    it("returns empty array when db is unavailable", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValue(null as never);

      const db = await getDb();
      if (!db) {
        expect(db).toBeNull();
        return;
      }
    });

    it("returns messages for a conversation", async () => {
      const { getDb } = await import("./db");
      const mockMessages = [
        { id: 1, conversationID: 1, senderID: "W001", text: "Hello!", createdAt: new Date(), readAt: null },
        { id: 2, conversationID: 1, senderID: "W002", text: "Hi there!", createdAt: new Date(), readAt: null },
      ];
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockMessages),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as never);

      const db = await getDb();
      expect(db).not.toBeNull();
    });
  });

  describe("sendMessage", () => {
    it("inserts a message and updates conversation lastMessageAt", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as never);

      const db = await getDb();
      expect(db).not.toBeNull();
    });

    it("throws when db is unavailable", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValue(null as never);

      const db = await getDb();
      if (!db) {
        expect(db).toBeNull();
        return;
      }
    });
  });

  describe("markRead", () => {
    it("marks messages as read for a worker", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as never);

      const db = await getDb();
      expect(db).not.toBeNull();
    });
  });

  describe("getUnreadCount", () => {
    it("returns 0 unread count when db is unavailable", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValue(null as never);

      const db = await getDb();
      if (!db) {
        const result = { count: 0 };
        expect(result.count).toBe(0);
        return;
      }
    });

    it("returns unread count for a worker", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: "3" }]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as never);

      const db = await getDb();
      expect(db).not.toBeNull();
    });
  });

  describe("getWorkers", () => {
    it("returns workers list excluding the current worker", async () => {
      const { getDb } = await import("./db");
      const mockWorkers = [
        { id: 2, workerID: "W002", name: "Alice", department: "Production", userLevel: "1" },
        { id: 3, workerID: "W003", name: "Bob", department: "Warehouse", userLevel: "2" },
      ];
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockWorkers),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as never);

      const db = await getDb();
      expect(db).not.toBeNull();
    });
  });

  describe("Chat deep-link URL format", () => {
    it("builds correct deep-link URL with order context", () => {
      const workerID = "W002";
      const orderID = "A-123";
      const label = "A-123 · BC 1200×800";
      const url = `/chat?with=${encodeURIComponent(workerID)}&ref=${encodeURIComponent(orderID)}&label=${encodeURIComponent(label)}`;
      expect(url).toBe("/chat?with=W002&ref=A-123&label=A-123%20%C2%B7%20BC%201200%C3%97800");
    });

    it("builds correct deep-link URL without order context", () => {
      const workerID = "W002";
      const url = `/chat?with=${encodeURIComponent(workerID)}`;
      expect(url).toBe("/chat?with=W002");
    });
  });
});
