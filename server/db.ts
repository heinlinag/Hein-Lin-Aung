import { eq, desc, and, or, isNull, isNotNull, lte, inArray, sql as sqlExpr } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, workers, orders, InsertWorker, InsertOrder, usageHistory, deletedLogs, pendingRequests, approvalActionLog, InsertApprovalActionLog, appNotifications, InsertAppNotification, AppNotification, requestEditHistory, InsertRequestEditHistory, auditLogs, InsertAuditLog, AuditLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// ─── Tracking ID Generator ───────────────────────────────────────────────────

export function generateTrackingId(orderID?: string): string {
  // Format: PP4 + DDMMYY + HHMM + OrderID Suffix
  // Example: PP400130520260100A206
  // PP4 = prefix
  // 001305 = day (01), month (05), year (26)
  // 2026 = hour (20), minute (26)
  // A206 = suffix from Production Order (A-206 -> A206)
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  // Extract suffix from orderID (e.g., "A-206" -> "A206", "A - 206" -> "A206")
  let orderSuffix = "0000";
  if (orderID) {
    // Remove hyphens and spaces, keep only alphanumeric
    orderSuffix = orderID.replace(/[-\s]/g, '').toUpperCase().slice(-4).padStart(4, '0');
  }
  
  return `PP4${day}${month}${year}${hour}${minute}${orderSuffix}`;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Workers ─────────────────────────────────────────────────────────────────

export async function getAllWorkers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workers).orderBy(desc(workers.createdAt));
}

export async function getWorkerByWorkerID(workerID: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workers).where(eq(workers.workerID, workerID)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createWorker(data: InsertWorker) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(workers).values(data);
}

export async function deleteWorker(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(workers).where(eq(workers.id, id));
}

export async function updateWorkerById(id: number, data: Partial<InsertWorker>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workers).set(data).where(eq(workers.id, id));
}

/** Set the active device session for a worker (one-device enforcement) */
export async function setWorkerActiveDevice(
  workerID: string,
  deviceToken: string,
  deviceName: string,
  deviceIP: string,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workers).set({
    activeDeviceToken: deviceToken,
    activeDeviceName: deviceName,
    activeDeviceIP: deviceIP,
    activeLoginAt: new Date(),
  }).where(eq(workers.workerID, workerID));
}

/** Clear the active device session (logout) */
export async function clearWorkerActiveDevice(workerID: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workers).set({
    activeDeviceToken: null,
    activeDeviceName: null,
    activeDeviceIP: null,
    activeLoginAt: null,
  }).where(eq(workers.workerID, workerID));
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getAllOrders(status?: "current" | "out_of_stock") {
  const db = await getDb();
  if (!db) return [];
  
  const baseQuery = db
    .select({
      id: orders.id,
      orderID: orders.orderID,
      trackingId: orders.trackingId,
      fluteType: orders.fluteType,
      sizeW: orders.sizeW,
      sizeL: orders.sizeL,
      qty: orders.qty,
      bqComment: orders.bqComment,
      status: orders.status,
      outOfStockAt: orders.outOfStockAt,
      submittedBy: workers.name,
      workerID: orders.submittedBy,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(workers, eq(orders.submittedBy, workers.workerID));
  
  if (status) {
    return baseQuery.where(eq(orders.status, status)).orderBy(desc(orders.createdAt));
  }
  
  return baseQuery.orderBy(desc(orders.createdAt));
}

export async function getOrderByOrderID(orderID: string) {
  const db = await getDb();
  if (!db) return null;
  const { orders } = await import("../drizzle/schema");
  const result = await db.select().from(orders).where(eq(orders.orderID, orderID)).limit(1);
  return result[0] ?? null;
}

export async function getOrderByTrackingId(trackingId: string) {
  const db = await getDb();
  if (!db) return null;
  const { orders } = await import("../drizzle/schema");
  const result = await db.select().from(orders).where(eq(orders.trackingId, trackingId)).limit(1);
  return result[0] ?? null;
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orders).values(data);
}

export async function updateOrderStatus(id: number, status: "current" | "out_of_stock") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Partial<typeof orders.$inferInsert> = { status };
  if (status === "out_of_stock") {
    updateData.outOfStockAt = new Date();
  }
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

// ─── Auto-Delete Expired Out of Stock Orders ─────────────────────────────────
// Deletes orders that have been out_of_stock for more than 13 months
export async function deleteExpiredOutOfStockOrders(): Promise<{ deletedCount: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate the cutoff date: 13 months ago from now
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 13);

  const expiredOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.status, "out_of_stock"),
        or(
          and(isNotNull(orders.outOfStockAt), lte(orders.outOfStockAt, cutoffDate)),
          and(isNull(orders.outOfStockAt), lte(orders.createdAt, cutoffDate))
        )
      )
    );

  if (expiredOrders.length === 0) return { deletedCount: 0 };

  const expiredIds = expiredOrders.map(o => o.id);
  await db.delete(orders).where(inArray(orders.id, expiredIds));
  return { deletedCount: expiredIds.length };
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(orders).where(eq(orders.id, id));
}

// ─── Usage History ───────────────────────────────────────────────────────────
export async function logUsageHistory(data: {
  jobNo: string | null;
  usedQty: number;
  orderID: string;
  fluteType: string;
  bqComment: string;
  purpose: "job" | "old_stock";
  masterCard?: string | null;
  boardSizeW?: number | null;
  boardSizeL?: number | null;
  scores?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(usageHistory).values({
    jobNo: data.jobNo,
    usedQty: data.usedQty,
    orderID: data.orderID,
    fluteType: data.fluteType,
    bqComment: data.bqComment,
    purpose: data.purpose,
    masterCard: data.masterCard ?? null,
    boardSizeW: data.boardSizeW ?? null,
    boardSizeL: data.boardSizeL ?? null,
    scores: data.scores ?? null,
  });
}

export async function getUsageHistory() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(usageHistory).orderBy(desc(usageHistory.createdAt));
}

// ─── Deleted Logs ─────────────────────────────────────────────────────────────
export async function logDeletedOrder(data: {
  orderID: string;
  fluteType: string;
  sizeW: number;
  sizeL: number;
  qty: number;
  bqComment: string;
  deletedBy: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(deletedLogs).values(data);
}

export async function getDeletedLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deletedLogs).orderBy(desc(deletedLogs.deletedAt));
}

// ─── Pending Requests ─────────────────────────────────────────────────────────
export async function createPendingRequest(data: {
  type: "delete" | "used_update";
  orderId: number;
  orderSnapshot: string;
  requestedBy: string;
  workerName: string;
  actionData?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pendingRequests).values(data);
  // Drizzle MySQL returns insertId in result[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertId = (result as any)[0]?.insertId ?? 0;
  return insertId;
}

export async function getPendingRequests(status?: "pending" | "approved" | "cancelled") {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(pendingRequests).where(eq(pendingRequests.status, status)).orderBy(desc(pendingRequests.createdAt));
  }
  return db.select().from(pendingRequests).orderBy(desc(pendingRequests.createdAt));
}

export async function getPendingRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pendingRequests).where(eq(pendingRequests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Returns total pending used qty for a given orderId (used_update requests still pending)
export async function getPendingUsedQtyForOrder(orderId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select()
    .from(pendingRequests)
    .where(and(eq(pendingRequests.orderId, orderId), eq(pendingRequests.status, "pending"), eq(pendingRequests.type, "used_update")));
  let total = 0;
  for (const row of rows) {
    try {
      const action = JSON.parse(row.actionData ?? "{}");
      if (typeof action.usedQty === "number") total += action.usedQty;
    } catch { /* ignore */ }
  }
  return total;
}

export async function updatePendingRequestStatus(
  id: number,
  status: "approved" | "cancelled",
  reviewedBy: string,
  opts?: { cancelReason?: string; approvedQty?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status, reviewedBy, reviewedAt: new Date() };
  if (opts?.cancelReason !== undefined) updateData.cancelReason = opts.cancelReason;
  if (opts?.approvedQty !== undefined) updateData.approvedQty = opts.approvedQty;
  // Auto-remove urgent flag when request is approved (processed)
  if (status === "approved") updateData.isUrgent = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.update(pendingRequests).set(updateData as any).where(eq(pendingRequests.id, id));
}

// Process-approve a pending request (Level 1.1 intermediate action)
export async function processApprovePendingRequest(
  id: number,
  processApprovedBy: string,
  processApprovedQty?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {
    processApprovedBy,
    processApprovedAt: new Date(),
  };
  if (processApprovedQty !== undefined) updateData.processApprovedQty = processApprovedQty;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.update(pendingRequests).set(updateData as any).where(eq(pendingRequests.id, id));
}

// Toggle urgent status on a pending request (Level 1 only)
export async function toggleUrgent(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const req = await getPendingRequestById(id);
  if (!req) throw new Error("Request not found");
  const newUrgentStatus = !req.isUrgent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.update(pendingRequests).set({ isUrgent: newUrgentStatus } as any).where(eq(pendingRequests.id, id));
  return newUrgentStatus;
}

// ─── Approval Action Log ──────────────────────────────────────────────────────
export async function createApprovalActionLog(data: InsertApprovalActionLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(approvalActionLog).values(data);
}

export async function getApprovalActionLog(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(approvalActionLog).orderBy(desc(approvalActionLog.createdAt)).limit(limit);
}


// Returns In Process Qty for a given orderId (processApprovedQty from approved requests)
export async function getInProcessQtyForOrder(orderId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select()
    .from(pendingRequests)
    .where(and(eq(pendingRequests.orderId, orderId), eq(pendingRequests.status, "approved"), eq(pendingRequests.type, "used_update")));
  let total = 0;
  for (const row of rows) {
    // Use processApprovedQty if available (Level 1.1 process-approved), otherwise use approvedQty
    if (typeof row.processApprovedQty === "number") {
      total += row.processApprovedQty;
    } else if (typeof row.approvedQty === "number") {
      total += row.approvedQty;
    } else {
      try {
        const action = JSON.parse(row.actionData ?? "{}");
        if (typeof action.usedQty === "number") total += action.usedQty;
      } catch { /* ignore */ }
    }
  }
  return total;
}

// ─── In-App Notifications ─────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 200;

export async function createAppNotification(data: Omit<InsertAppNotification, "id" | "createdAt" | "readBy">): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(appNotifications).values({ ...data, readBy: "" });
    // Auto-delete oldest notifications when count exceeds MAX_NOTIFICATIONS
    const countRows = await db.execute(sqlExpr`SELECT COUNT(*) as cnt FROM appNotifications`);
    const total = Number((countRows as unknown as [Array<{ cnt: number }>])[0]?.[0]?.cnt ?? 0);
    if (total > MAX_NOTIFICATIONS) {
      const excess = total - MAX_NOTIFICATIONS;
      await db.execute(sqlExpr`
        DELETE FROM appNotifications
        WHERE id IN (
          SELECT id FROM (
            SELECT id FROM appNotifications ORDER BY createdAt ASC LIMIT ${excess}
          ) AS oldest
        )
      `);
    }
  } catch (e) {
    console.warn("[Notification] Failed to save:", e);
  }
}

export async function getRecentNotifications(limit = 50, workerID?: string): Promise<AppNotification[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    if (workerID) {
      // Return: all non-custom_alert types + custom_broadcast + custom_alert targeted to this worker
      const rows = await db.execute(sqlExpr`
        SELECT * FROM appNotifications
        WHERE type != 'custom_alert'
           OR (type = 'custom_alert' AND targetWorkerID = ${workerID})
        ORDER BY createdAt DESC
        LIMIT ${limit}
      `);
      return (rows as unknown as [AppNotification[]])[0] ?? [];
    }
    return await db.select().from(appNotifications).orderBy(desc(appNotifications.createdAt)).limit(limit);
  } catch { return []; }
}

export async function markNotificationsRead(workerID: string, ids: number[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    for (const id of ids) {
      // Append workerID to readBy if not already present
      await db.execute(sqlExpr`
        UPDATE appNotifications
        SET readBy = CASE
          WHEN readBy = '' THEN ${workerID}
          WHEN FIND_IN_SET(${workerID}, readBy) = 0 THEN CONCAT(readBy, ',', ${workerID})
          ELSE readBy
        END
        WHERE id = ${id}
      `);
    }
  } catch (e) {
    console.warn("[Notification] Failed to mark read:", e);
  }
}

export async function getUnreadCount(workerID: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const rows = await db.execute(sqlExpr`
      SELECT COUNT(*) as cnt FROM appNotifications
      WHERE FIND_IN_SET(${workerID}, readBy) = 0
        AND (type != 'custom_alert' OR targetWorkerID = ${workerID})
    `);
    const result = rows as unknown as [Array<{ cnt: number }>];
    return Number(result[0]?.[0]?.cnt ?? 0);
  } catch { return 0; }
}

// ─── Request Edit History ─────────────────────────────────────────────────────
export async function logRequestEdit(data: InsertRequestEditHistory): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(requestEditHistory).values(data);
}

export async function getRequestEditHistory(requestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(requestEditHistory)
    .where(eq(requestEditHistory.requestId, requestId))
    .orderBy(desc(requestEditHistory.editedAt));
}

// ─── Customer Samples ─────────────────────────────────────────────────────────
import { customerSamples, InsertCustomerSample, CustomerSample } from "../drizzle/schema";

export async function createCustomerSample(data: InsertCustomerSample): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customerSamples).values(data);
  const res = result as unknown as [{ insertId: number }];
  return res[0]?.insertId ?? 0;
}

export async function getCustomerSamples(filter?: { status?: "pending" | "progress" | "delivery" }): Promise<CustomerSample[]> {
  const db = await getDb();
  if (!db) return [];
  if (filter?.status) {
    return db.select().from(customerSamples)
      .where(eq(customerSamples.status, filter.status))
      .orderBy(desc(customerSamples.createdAt));
  }
  return db.select().from(customerSamples).orderBy(desc(customerSamples.createdAt));
}

export async function getCustomerSampleById(id: number): Promise<CustomerSample | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(customerSamples).where(eq(customerSamples.id, id));
  return rows[0] ?? null;
}

export async function updateCustomerSampleStatus(
  id: number,
  status: "progress" | "delivery",
  workerName: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  if (status === "progress") {
    await db.update(customerSamples)
      .set({ status, progressBy: workerName, progressAt: now })
      .where(eq(customerSamples.id, id));
  } else {
    await db.update(customerSamples)
      .set({ status, deliveryBy: workerName, deliveryAt: now })
      .where(eq(customerSamples.id, id));
  }
}

// ─── Security Audit Log ──────────────────────────────────────────────────────

export async function createAuditLog(entry: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return; // non-blocking — don't throw if DB is unavailable
  await db.insert(auditLogs).values(entry);
}

export async function getAuditLogs(opts?: {
  workerID?: string;
  action?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.workerID) conditions.push(eq(auditLogs.workerID, opts.workerID));
  if (opts?.action)   conditions.push(eq(auditLogs.action,   opts.action));
  const query = db.select().from(auditLogs);
  const withWhere = conditions.length > 0 ? query.where(and(...conditions)) : query;
  return withWhere.orderBy(desc(auditLogs.createdAt)).limit(opts?.limit ?? 200);
}
