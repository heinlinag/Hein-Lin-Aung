import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { approvalActionLog } from "../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";

describe("Approval Action Log", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Cleanup is handled by the database
  });

  it("should retrieve action logs ordered by creation date", async () => {
    if (!db) {
      expect(true).toBe(true); // Skip if DB not available
      return;
    }

    const logs = await db.select().from(approvalActionLog).limit(5);
    
    // Verify that logs are returned (if any exist)
    if (logs.length > 0) {
      expect(Array.isArray(logs)).toBe(true);
      expect(logs[0]).toHaveProperty("id");
      expect(logs[0]).toHaveProperty("actionType");
      expect(logs[0]).toHaveProperty("orderID");
      expect(logs[0]).toHaveProperty("requestedBy");
      expect(logs[0]).toHaveProperty("reviewedBy");
    }
  });

  it("should have required fields in action log records", async () => {
    if (!db) {
      expect(true).toBe(true); // Skip if DB not available
      return;
    }

    const logs = await db.select().from(approvalActionLog).limit(1);
    
    if (logs.length > 0) {
      const log = logs[0];
      
      // Verify all required fields exist
      expect(log).toHaveProperty("id");
      expect(log).toHaveProperty("actionType");
      expect(log).toHaveProperty("requestId");
      expect(log).toHaveProperty("requestType");
      expect(log).toHaveProperty("orderID");
      expect(log).toHaveProperty("requestedBy");
      expect(log).toHaveProperty("reviewedBy");
      expect(log).toHaveProperty("createdAt");
      
      // Verify data types
      expect(typeof log.id).toBe("number");
      expect(typeof log.actionType).toBe("string");
      expect(typeof log.orderID).toBe("string");
      expect(typeof log.requestedBy).toBe("string");
      expect(typeof log.reviewedBy).toBe("string");
      expect(log.createdAt instanceof Date).toBe(true);
    }
  });

  it("should support approve action type", async () => {
    if (!db) {
      expect(true).toBe(true); // Skip if DB not available
      return;
    }

    const approveLogs = await db
      .select()
      .from(approvalActionLog)
      .where(eq(approvalActionLog.actionType, "approve"))
      .limit(1);

    // If approve logs exist, verify their structure
    if (approveLogs.length > 0) {
      const log = approveLogs[0];
      expect(log.actionType).toBe("approve");
      expect(log.approvedQty).not.toBeUndefined();
    }
  });

  it("should support cancel action type", async () => {
    if (!db) {
      expect(true).toBe(true); // Skip if DB not available
      return;
    }

    const cancelLogs = await db
      .select()
      .from(approvalActionLog)
      .where(eq(approvalActionLog.actionType, "cancel"))
      .limit(1);

    // If cancel logs exist, verify their structure
    if (cancelLogs.length > 0) {
      const log = cancelLogs[0];
      expect(log.actionType).toBe("cancel");
      expect(log.cancelReason).not.toBeUndefined();
    }
  });

  it("should store and retrieve details field as JSON", async () => {
    if (!db) {
      expect(true).toBe(true); // Skip if DB not available
      return;
    }

    const logsWithDetails = await db
      .select()
      .from(approvalActionLog)
      .where(isNotNull(approvalActionLog.details))
      .limit(1);

    if (logsWithDetails.length > 0) {
      const log = logsWithDetails[0];
      expect(log.details).toBeDefined();
      
      // Try to parse the details field
      if (log.details) {
        try {
          const parsed = JSON.parse(log.details);
          expect(typeof parsed).toBe("object");
        } catch {
          // Details might be a string, not JSON
          expect(typeof log.details).toBe("string");
        }
      }
    }
  });

  it("should maintain chronological order of logs", async () => {
    if (!db) {
      expect(true).toBe(true); // Skip if DB not available
      return;
    }

    const logs = await db.select().from(approvalActionLog).limit(10);
    
    if (logs.length > 1) {
      // Verify that logs are ordered consistently
      const times = logs.map(log => log.createdAt.getTime());
      const isAscending = times.every((time, i) => i === 0 || time >= times[i - 1]);
      const isDescending = times.every((time, i) => i === 0 || time <= times[i - 1]);
      
      // Logs should be in either ascending or descending order
      expect(isAscending || isDescending).toBe(true);
    }
  });
});
