import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, uniqueIndex } from "drizzle-orm/mysql-core";

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
  permissions: text("permissions"), // JSON: { submitOrder, viewStock, nprmModifyOrder, customerSample, qrScanner, viewChat, viewNotifications } — null = not yet configured
  lastSeenAt: timestamp("lastSeenAt"),
  // One-device session tracking
  activeDeviceToken: varchar("activeDeviceToken", { length: 128 }),  // fingerprint of active device
  activeDeviceName: varchar("activeDeviceName", { length: 256 }),   // human-readable device name
  activeDeviceIP: varchar("activeDeviceIP", { length: 64 }),        // IP address of active session
  activeLoginAt: timestamp("activeLoginAt"),                         // when the active session started
  activeDeviceCountry: varchar("activeDeviceCountry", { length: 128 }), // approximate IP geolocation country
  activeDeviceRegion: varchar("activeDeviceRegion", { length: 128 }),   // approximate IP geolocation region/state
  activeDeviceCity: varchar("activeDeviceCity", { length: 128 }),       // approximate IP geolocation city
  // Profile fields
  profilePicture: text("profilePicture"),             // S3 URL for profile picture
  displayName: varchar("displayName", { length: 128 }), // custom display name (editable, 7-day cooldown)
  displayNameChangedAt: timestamp("displayNameChangedAt"), // last time displayName was changed
  employeeIdChangedAt: timestamp("employeeIdChangedAt"),   // last time workerID was changed (30-day cooldown)
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
  outOfStockAt: timestamp("outOfStockAt"), // set when status changes to out_of_stock
  submittedBy: varchar("submittedBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  submittedVia: mysqlEnum("submittedVia", ["manual", "scanner"]).default("manual").notNull(),
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
  isUrgent: boolean("isUrgent").default(false).notNull(), // Level 1 can mark as urgent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});
export type PendingRequest = typeof pendingRequests.$inferSelect;
export type InsertPendingRequest = typeof pendingRequests.$inferInsert;

// Request Edit History table — tracks edits to pending requests (Target Black Qty)
export const requestEditHistory = mysqlTable("requestEditHistory", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),       // references pendingRequests.id
  editedBy: varchar("editedBy", { length: 128 }).notNull(), // worker name who made the edit
  editedByID: varchar("editedByID", { length: 64 }).notNull(), // workerID
  oldQty: int("oldQty").notNull(),              // previous Target Black Qty
  newQty: int("newQty").notNull(),              // new Target Black Qty
  remark: varchar("remark", { length: 512 }),   // reason for edit
  editedAt: timestamp("editedAt").defaultNow().notNull(),
});
export type RequestEditHistory = typeof requestEditHistory.$inferSelect;
export type InsertRequestEditHistory = typeof requestEditHistory.$inferInsert;

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
  adjustmentMethod: mysqlEnum("adjustmentMethod", ["scan", "manual"]), // balance-update source only
  adjustmentNote: text("adjustmentNote"), // optional reason entered for a balance update
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


// In-App Notifications table — real-time activity feed for all users
export const appNotifications = mysqlTable("appNotifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "order_request",
    "order_approved",
    "order_cancelled",
    "order_in_process",
    "order_deleted",
    "out_of_stock",
    "new_order",
    "login",
    "system",
    "chat_message",
    "custom_broadcast",
    "custom_alert",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  // Order context
  orderID: varchar("orderID", { length: 64 }),
  productionOrder: varchar("productionOrder", { length: 64 }),
  jobNo: varchar("jobNo", { length: 64 }),
  qty: int("qty"),
  fluteType: varchar("fluteType", { length: 64 }),
  // Actor
  workerID: varchar("workerID", { length: 64 }),
  workerName: varchar("workerName", { length: 128 }),
  // Tracking
  trackingId: varchar("trackingId", { length: 64 }),
  // Deep link URL for click-to-navigate
  deepLink: varchar("deepLink", { length: 500 }),
  // Target worker for custom_alert (null = all workers for custom_broadcast)
  targetWorkerID: varchar("targetWorkerID", { length: 64 }),
  // Read state — comma-separated workerIDs who have read this
  readBy: varchar("readBy", { length: 2000 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AppNotification = typeof appNotifications.$inferSelect;
export type InsertAppNotification = typeof appNotifications.$inferInsert;

// Announcements table — admin-created banners shown to all users
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "warning", "success", "error"]).notNull().default("info"),
  isActive: boolean("isActive").notNull().default(true),
  createdBy: varchar("createdBy", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// ─── Messaging System ──────────────────────────────────────────────────────────
// Direct Message conversations (1-on-1)
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  worker1ID: varchar("worker1ID", { length: 64 }).notNull(),
  worker2ID: varchar("worker2ID", { length: 64 }).notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Conversation = typeof conversations.$inferSelect;

// Direct messages
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationID: int("conversationID").notNull(),
  senderID: varchar("senderID", { length: 64 }).notNull(),
  text: text("text").notNull(),
  replyToID: int("replyToID"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});
export type ChatMessage = typeof chatMessages.$inferSelect;

// Secure chat file metadata — S3 bytes remain in storage; database stores references only.
export const chatAttachments = mysqlTable("chatAttachments", {
  id: int("id").autoincrement().primaryKey(),
  messageType: mysqlEnum("messageType", ["dm", "group"]).notNull(),
  messageID: int("messageID").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  uploadedBy: varchar("uploadedBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChatAttachment = typeof chatAttachments.$inferSelect;

// Group chats (max 10 members)
export const groupChats = mysqlTable("groupChats", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GroupChat = typeof groupChats.$inferSelect;

// Group chat members
export const groupMembers = mysqlTable("groupMembers", {
  id: int("id").autoincrement().primaryKey(),
  groupID: int("groupID").notNull(),
  workerID: varchar("workerID", { length: 64 }).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});
export type GroupMember = typeof groupMembers.$inferSelect;

// Group messages
export const groupMessages = mysqlTable("groupMessages", {
  id: int("id").autoincrement().primaryKey(),
  groupID: int("groupID").notNull(),
  senderID: varchar("senderID", { length: 64 }).notNull(),
  senderName: varchar("senderName", { length: 128 }).notNull(),
  text: text("text").notNull(),
  replyToID: int("replyToID"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GroupMessage = typeof groupMessages.$inferSelect;

// Short-lived typing state for direct and group conversations. Expiry prevents stale indicators.
export const chatTypingStates = mysqlTable("chatTypingStates", {
  id: int("id").autoincrement().primaryKey(),
  channelType: mysqlEnum("channelType", ["dm", "group"]).notNull(),
  channelID: int("channelID").notNull(),
  workerID: varchar("workerID", { length: 64 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelWorkerUnique: uniqueIndex("chatTypingStates_channel_worker_unique").on(table.channelType, table.channelID, table.workerID),
  expiryIndex: index("chatTypingStates_expiry_idx").on(table.expiresAt),
}));
export type ChatTypingState = typeof chatTypingStates.$inferSelect;

// Emoji reactions on DM and Group messages
export const messageReactions = mysqlTable("messageReactions", {
  id: int("id").autoincrement().primaryKey(),
  messageType: mysqlEnum("messageType", ["dm", "group"]).notNull(),
  messageID: int("messageID").notNull(),
  workerID: varchar("workerID", { length: 64 }).notNull(),
  emoji: varchar("emoji", { length: 8 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MessageReaction = typeof messageReactions.$inferSelect;

// Group message read receipts — tracks which workers have read each group message
export const groupMessageReads = mysqlTable("groupMessageReads", {
  id: int("id").autoincrement().primaryKey(),
  groupMessageID: int("groupMessageID").notNull(),
  workerID: varchar("workerID", { length: 64 }).notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});
export type GroupMessageRead = typeof groupMessageReads.$inferSelect;


// System Settings table — key-value store for app-wide configuration
export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SystemSetting = typeof systemSettings.$inferSelect;

// Customer Samples table — tracks sample requests sent to customers from Production Orders
export const customerSamples = mysqlTable("customerSamples", {
  id: int("id").autoincrement().primaryKey(),
  // Production Order reference
  orderId: int("orderId").notNull(),              // references orders.id
  productionOrderID: varchar("productionOrderID", { length: 64 }).notNull(),  // Production Order string (e.g. A-1181)
  trackingId: varchar("trackingId", { length: 64 }),      // Tracking ID from order
  fluteType: varchar("fluteType", { length: 64 }).notNull(),
  sizeW: int("sizeW").notNull(),                  // Board Size W (auto from order)
  sizeL: int("sizeL").notNull(),                  // Board Size L (auto from order)
  bqComment: text("bqComment").notNull(),         // BQ from order
  currentQty: int("currentQty").notNull(),        // snapshot of qty at request time
  // Sample request fields
  customerName: varchar("customerName", { length: 256 }).notNull(),
  sampleQty: int("sampleQty").notNull().default(1),  // Qty to send as sample
  remark: text("remark"),
  deliveryMold: mysqlEnum("deliveryMold", ["send_to_pp1", "custom"]).notNull(),
  deliveryMoldCustom: varchar("deliveryMoldCustom", { length: 256 }), // when deliveryMold = custom
  // Workflow status
  status: mysqlEnum("status", ["pending", "progress", "delivery"]).default("pending").notNull(),
  // Requester info
  requestedBy: varchar("requestedBy", { length: 64 }).notNull(),   // workerID
  workerName: varchar("workerName", { length: 128 }).notNull(),
  // Progress / Delivery tracking
  progressBy: varchar("progressBy", { length: 128 }),
  progressAt: timestamp("progressAt"),
  deliveryBy: varchar("deliveryBy", { length: 128 }),
  deliveryAt: timestamp("deliveryAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CustomerSample = typeof customerSamples.$inferSelect;
export type InsertCustomerSample = typeof customerSamples.$inferInsert;

// Security Audit Log — records profile/identity changes for security review
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  workerID: varchar("workerID", { length: 64 }).notNull(),   // who made the change
  workerName: varchar("workerName", { length: 128 }).notNull(),
  department: varchar("department", { length: 128 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),       // e.g. "employee_id_changed", "display_name_changed", "profile_picture_changed"
  oldValue: text("oldValue"),                                // previous value (null if not applicable)
  newValue: text("newValue"),                                // new value
  ipAddress: varchar("ipAddress", { length: 64 }),           // request IP (best-effort)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
