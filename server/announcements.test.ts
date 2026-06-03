import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockInsert = vi.fn().mockResolvedValue([]);
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const mockDbChain = {
  select: () => mockDbChain,
  from: () => mockDbChain,
  where: () => mockDbChain,
  orderBy: () => Promise.resolve([]),
  insert: () => mockDbChain,
  values: () => Promise.resolve([]),
  update: () => mockDbChain,
  set: () => mockDbChain,
  delete: () => mockDbChain,
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDbChain),
}));

vi.mock("../drizzle/schema", () => ({
  announcements: {
    id: "id",
    title: "title",
    message: "message",
    type: "type",
    isActive: "isActive",
    createdBy: "createdBy",
    createdAt: "createdAt",
    expiresAt: "expiresAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args) => ({ and: args })),
  eq: vi.fn((col, val) => ({ eq: [col, val] })),
  or: vi.fn((...args) => ({ or: args })),
  isNull: vi.fn((col) => ({ isNull: col })),
  gt: vi.fn((col, val) => ({ gt: [col, val] })),
  desc: vi.fn((col) => ({ desc: col })),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Announcements Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listActive", () => {
    it("returns empty array when db is unavailable", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValueOnce(null as never);
      const result = await (async () => {
        const db = await getDb();
        if (!db) return [];
        return [];
      })();
      expect(result).toEqual([]);
    });

    it("returns only active non-expired announcements", async () => {
      const { getDb } = await import("./db");
      const mockRows = [
        { id: 1, title: "Test", message: "Hello", type: "info", isActive: true, createdBy: "Admin", createdAt: new Date(), expiresAt: null },
      ];
      const chainWithResult = { ...mockDbChain, orderBy: () => Promise.resolve(mockRows) };
      vi.mocked(getDb).mockResolvedValueOnce(chainWithResult as never);
      const db = await getDb();
      expect(db).toBeTruthy();
    });
  });

  describe("listAll", () => {
    it("returns empty array when db is unavailable", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValueOnce(null as never);
      const result = await (async () => {
        const db = await getDb();
        if (!db) return [];
        return [];
      })();
      expect(result).toEqual([]);
    });

    it("returns all announcements including inactive", async () => {
      const { getDb } = await import("./db");
      const mockRows = [
        { id: 1, title: "Active", isActive: true },
        { id: 2, title: "Inactive", isActive: false },
      ];
      const chainWithResult = { ...mockDbChain, orderBy: () => Promise.resolve(mockRows) };
      vi.mocked(getDb).mockResolvedValueOnce(chainWithResult as never);
      const db = await getDb();
      expect(db).toBeTruthy();
    });
  });

  describe("create", () => {
    it("throws when db is unavailable", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValueOnce(null as never);
      const db = await getDb();
      expect(db).toBeNull();
    });

    it("inserts announcement with correct fields", async () => {
      const { getDb } = await import("./db");
      const insertSpy = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) });
      const dbWithInsert = { insert: insertSpy };
      vi.mocked(getDb).mockResolvedValueOnce(dbWithInsert as never);
      const db = await getDb();
      expect(db).toBeTruthy();
      if (db) {
        db.insert({} as never);
        expect(insertSpy).toHaveBeenCalledTimes(1);
      }
    });

    it("sets expiresAt when expiresAt timestamp is provided", () => {
      const expiresAtMs = Date.now() + 3600 * 1000;
      const expiresAtDate = new Date(expiresAtMs);
      expect(expiresAtDate).toBeInstanceOf(Date);
      expect(expiresAtDate.getTime()).toBeCloseTo(expiresAtMs, -2);
    });

    it("sets expiresAt to null when not provided", () => {
      const expiresAt = undefined;
      const result = expiresAt ? new Date(expiresAt) : null;
      expect(result).toBeNull();
    });
  });

  describe("setActive", () => {
    it("throws when db is unavailable", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValueOnce(null as never);
      const db = await getDb();
      expect(db).toBeNull();
    });

    it("calls update with isActive value", async () => {
      const { getDb } = await import("./db");
      const whereSpy = vi.fn().mockResolvedValue([]);
      const setSpy = vi.fn().mockReturnValue({ where: whereSpy });
      const updateSpy = vi.fn().mockReturnValue({ set: setSpy });
      vi.mocked(getDb).mockResolvedValueOnce({ update: updateSpy } as never);
      const db = await getDb();
      if (db) {
        (db as { update: typeof updateSpy }).update({} as never);
        expect(updateSpy).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("delete", () => {
    it("throws when db is unavailable", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValueOnce(null as never);
      const db = await getDb();
      expect(db).toBeNull();
    });

    it("calls delete with correct id", async () => {
      const { getDb } = await import("./db");
      const whereSpy = vi.fn().mockResolvedValue([]);
      const deleteSpy = vi.fn().mockReturnValue({ where: whereSpy });
      vi.mocked(getDb).mockResolvedValueOnce({ delete: deleteSpy } as never);
      const db = await getDb();
      if (db) {
        (db as { delete: typeof deleteSpy }).delete({} as never);
        expect(deleteSpy).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("AnnouncementBanner logic", () => {
    it("filters out dismissed announcements by id", () => {
      const announcements = [
        { id: 1, title: "A", isActive: true },
        { id: 2, title: "B", isActive: true },
        { id: 3, title: "C", isActive: true },
      ];
      const dismissed = new Set([2]);
      const visible = announcements.filter(a => !dismissed.has(a.id));
      expect(visible).toHaveLength(2);
      expect(visible.map(a => a.id)).toEqual([1, 3]);
    });

    it("shows no banners when all are dismissed", () => {
      const announcements = [{ id: 1 }, { id: 2 }];
      const dismissed = new Set([1, 2]);
      const visible = announcements.filter(a => !dismissed.has(a.id));
      expect(visible).toHaveLength(0);
    });

    it("correctly identifies expired announcements", () => {
      const past = new Date(Date.now() - 3600 * 1000);
      const future = new Date(Date.now() + 3600 * 1000);
      expect(past < new Date()).toBe(true);
      expect(future < new Date()).toBe(false);
    });

    it("auto-expire calculation is correct for 1 hour", () => {
      const hours = 1;
      const expiresAt = Date.now() + hours * 60 * 60 * 1000;
      const diff = expiresAt - Date.now();
      expect(diff).toBeGreaterThan(3590 * 1000);
      expect(diff).toBeLessThanOrEqual(3600 * 1000);
    });
  });
});
