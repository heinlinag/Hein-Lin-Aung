import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, workers, orders, deletedLogs, usageHistory, InsertUsageHistory, InsertWorker, InsertOrder, InsertDeletedLog } from "../drizzle/schema";

import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

export async function logDeletedOrder(data: InsertDeletedLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(deletedLogs).values(data);
}

export async function getDeletedLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deletedLogs).orderBy(desc(deletedLogs.deletedAt));
}

export async function logUsageHistory(usage: InsertUsageHistory): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log usage: database not available");
    return;
  }

  try {
    await db.insert(usageHistory).values(usage);
  } catch (error) {
    console.error("[Database] Failed to log usage:", error);
    throw error;
  }
}

export async function getUsageHistory(): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get usage history: database not available");
    return [];
  }

  try {
    return await db.select().from(usageHistory).orderBy(desc(usageHistory.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get usage history:", error);
    return [];
  }
}

