import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, workers, orders, InsertWorker, InsertOrder, usageHistory, deletedLogs, pendingRequests, approvalActionLog, InsertApprovalActionLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// ─── Tracking ID Generator ───────────────────────────────────────────────────

export function generateTrackingId(): string {
  // Format: TRK-YYYYMMDD-XXXXX
  // XXXXX is a 5-digit random number (00000-99999)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `TRK-${year}${month}${day}-${random}`;
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

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getAllOrders(status?: "current" | "out_of_stock") {
  const db = await getDb();
  if (!db) return [];
  
  const baseQuery = db
    .select({
      id: orders.id,
      orderID: orders.orderID,
      fluteType: orders.fluteType,
      sizeW: orders.sizeW,
      sizeL: orders.sizeL,
      qty: orders.qty,
      bqComment: orders.bqComment,
      status: orders.status,
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

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orders).values(data);
}

export async function updateOrderStatus(id: number, status: "current" | "out_of_stock") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
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
