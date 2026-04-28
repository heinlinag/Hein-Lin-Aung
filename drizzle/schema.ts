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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Workers table — authenticated by workerID (no password, just ID)
export const workers = mysqlTable("workers", {
  id: int("id").autoincrement().primaryKey(),
  workerID: varchar("workerID", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  department: varchar("department", { length: 128 }).notNull(),
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
