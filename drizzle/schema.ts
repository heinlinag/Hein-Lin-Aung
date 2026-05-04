import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Workers table — authenticated by workerID (no password, just ID)
export const workers = mysqlTable("workers", {
  id: int("id").autoincrement().primaryKey(),
  workerID: varchar("workerID", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  department: varchar("department", { length: 128 }).notNull(),
  userLevel: mysqlEnum("userLevel", ["1", "2"]).default("2").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = typeof workers.$inferInsert;

// Orders table
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderID: varchar("orderID", { length: 64 }).notNull(),
  fluteType: varchar("fluteType", { length: 64 }).notNull(),
  sizeW: int("sizeW").notNull(),
  sizeL: int("sizeL").notNull(),
  qty: int("qty").notNull(),
  bqComment: text("bqComment").notNull(),
  status: mysqlEnum("status", ["current", "out_of_stock"]).default("current").notNull(),
  submittedBy: varchar("submittedBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Pending Requests table — approval workflow for Level 1 worker actions
export const pendingRequests = mysqlTable("pendingRequests", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["delete", "used_update"]).notNull(),
  orderId: int("orderId").notNull(),
  orderSnapshot: text("orderSnapshot").notNull(), // JSON snapshot of order at request time
  requestedBy: varchar("requestedBy", { length: 64 }).notNull(), // workerID
  workerName: varchar("workerName", { length: 128 }).notNull(),
  actionData: text("actionData"), // JSON: for used_update: { jobNo, usedQty, purpose, newQty }
  status: mysqlEnum("status", ["pending", "approved", "cancelled"]).default("pending").notNull(),
  reviewedBy: varchar("reviewedBy", { length: 128 }),
  cancelReason: text("cancelReason"), // required when status = cancelled
  approvedQty: int("approvedQty"),    // Level 2 can override requested qty before approving
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});
export type PendingRequest = typeof pendingRequests.$inferSelect;
export type InsertPendingRequest = typeof pendingRequests.$inferInsert;

// Approval Action Log — records every Level 2 action in Approval Center
export const approvalActionLog = mysqlTable("approvalActionLog", {
  id: int("id").autoincrement().primaryKey(),
  actionType: varchar("actionType", { length: 64 }).notNull(), // approve | cancel | direct_used_update | direct_old_stock | direct_delete
  requestId: int("requestId").notNull(),       // references pendingRequests.id (0 for direct actions)
  requestType: mysqlEnum("requestType", ["delete", "used_update"]).notNull(),
  orderID: varchar("orderID", { length: 64 }).notNull(),
  requestedBy: varchar("requestedBy", { length: 128 }).notNull(), // Level 1 worker name or Level 2 for direct
  reviewedBy: varchar("reviewedBy", { length: 128 }).notNull(),   // Level 2 worker name/ID
  approvedQty: int("approvedQty"),    // final approved qty (may differ from requested)
  requestedQty: int("requestedQty"), // original requested qty
  cancelReason: text("cancelReason"), // populated when actionType = cancel
  details: text("details"),           // human-readable description of the action
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApprovalActionLog = typeof approvalActionLog.$inferSelect;
export type InsertApprovalActionLog = typeof approvalActionLog.$inferInsert;

// Deleted Logs table — audit trail of deleted orders
export const deletedLogs = mysqlTable("deletedLogs", {
  id: int("id").autoincrement().primaryKey(),
  orderID: varchar("orderID", { length: 64 }).notNull(),
  fluteType: varchar("fluteType", { length: 64 }).notNull(),
  sizeW: int("sizeW").notNull(),
  sizeL: int("sizeL").notNull(),
  qty: int("qty").notNull(),
  bqComment: text("bqComment").notNull(),
  deletedBy: varchar("deletedBy", { length: 64 }).notNull(),
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
});
export type DeletedLog = typeof deletedLogs.$inferSelect;
export type InsertDeletedLog = typeof deletedLogs.$inferInsert;

// Usage History table — tracks how orders are used (Job No or Old Stock)
export const usageHistory = mysqlTable("usageHistory", {
  id: int("id").autoincrement().primaryKey(),
  jobNo: varchar("jobNo", { length: 8 }),
  usedQty: int("usedQty").notNull(),
  orderID: varchar("orderID", { length: 64 }).notNull(),
  fluteType: varchar("fluteType", { length: 64 }).notNull(),
  bqComment: text("bqComment").notNull(),
  purpose: mysqlEnum("purpose", ["job", "old_stock"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UsageHistory = typeof usageHistory.$inferSelect;
export type InsertUsageHistory = typeof usageHistory.$inferInsert;

// Push Subscriptions table — stores Web Push API subscriptions per worker
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  workerID: varchar("workerID", { length: 64 }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
