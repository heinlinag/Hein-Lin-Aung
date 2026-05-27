import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

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
  userLevel: mysqlEnum("userLevel", ["1", "1.1", "2"]).default("2").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = typeof workers.$inferInsert;

// Orders table
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderID: varchar("orderID", { length: 64 }).notNull(),
  trackingId: varchar("trackingId", { length: 64 }).unique(), // TRK-YYYYMMDD-XXXXX format (nullable for existing orders)
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
  processApprovedQty: int("processApprovedQty"),   // Level 1.1 process-approved qty (optional override)
  processApprovedBy: varchar("processApprovedBy", { length: 128 }), // Level 1.1 worker name/ID
  processApprovedAt: timestamp("processApprovedAt"), // when Level 1.1 process-approved
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
  masterCard: varchar("masterCard", { length: 64 }),   // e.g. PABC00001A
  boardSizeW: int("boardSizeW"),                        // Modify Board Size width
  boardSizeL: int("boardSizeL"),                        // Modify Board Size length
  scores: varchar("scores", { length: 128 }),           // e.g. 184 275 184
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

// QR Scan Log table — records every QR scan event and balance updates
export const qrScanLog = mysqlTable("qrScanLog", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull(),  // Order ID (string)
  scannedBy: varchar("scannedBy", { length: 64 }).notNull(),     // workerID
  scannedByName: varchar("scannedByName", { length: 128 }).notNull(), // worker name
  action: mysqlEnum("action", ["scan", "balance_update"]).default("scan").notNull(),
  oldQty: int("oldQty"),     // populated for balance_update
  newQty: int("newQty"),     // populated for balance_update
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type QrScanLog = typeof qrScanLog.$inferSelect;
export type InsertQrScanLog = typeof qrScanLog.$inferInsert;

// Maintenance Schedule table — stores scheduled maintenance windows
export const maintenanceSchedule = mysqlTable("maintenanceSchedule", {
  id: int("id").autoincrement().primaryKey(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MaintenanceSchedule = typeof maintenanceSchedule.$inferSelect;
export type InsertMaintenanceSchedule = typeof maintenanceSchedule.$inferInsert;

// System Metrics table — stores real-time system performance metrics
export const systemMetrics = mysqlTable("systemMetrics", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  responseTime: int("responseTime").notNull(), // milliseconds
  requestCount: int("requestCount").notNull(), // requests in this interval
  errorCount: int("errorCount").default(0).notNull(),
  cpuUsage: varchar("cpuUsage", { length: 10 }), // percentage as string (e.g., "45.67")
  memoryUsage: varchar("memoryUsage", { length: 10 }), // percentage as string (e.g., "78.90")
  databaseLatency: int("databaseLatency"), // milliseconds
  status: mysqlEnum("status", ["operational", "degraded", "down"]).default("operational").notNull(),
});
export type SystemMetrics = typeof systemMetrics.$inferSelect;
export type InsertSystemMetrics = typeof systemMetrics.$inferInsert;

// Analytics Events table — tracks user actions and system events for analytics
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 64 }).notNull(), // e.g., 'order_submitted', 'request_approved', 'login'
  workerID: varchar("workerID", { length: 64 }), // nullable for system events
  orderId: varchar("orderId", { length: 64 }), // nullable if not related to order
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// Email Notifications table — tracks email notifications sent to users
export const emailNotifications = mysqlTable("emailNotifications", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 128 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: mysqlEnum("type", ["maintenance", "alert", "update", "notification"]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

// Contact Messages table — stores contact form submissions from Help Center
export const contactMessages = mysqlTable("contactMessages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  repliedBy: varchar("repliedBy", { length: 128 }), // admin name
  repliedAt: timestamp("repliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

