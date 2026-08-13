import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("daily inactive worker suspension", () => {
  const schema = read("drizzle/schema.ts");
  const db = read("server/db.ts");
  const routers = read("server/routers.ts");
  const server = read("server/_core/index.ts");
  const login = read("client/src/pages/Login.tsx");
  const admin = read("client/src/pages/AdminPanel.tsx");
  const home = read("client/src/pages/Home.tsx");
  const reminderMigration = read("drizzle/0050_inactivity_push_reminders.sql");

  it("bases the suspension policy on verified device activity while retaining login and device records", () => {
    expect(schema).toContain('accountStatus: mysqlEnum("accountStatus", ["active", "suspended"])');
    expect(schema).toContain('lastLoginAt: timestamp("lastLoginAt")');
    expect(schema).toContain('lastSeenAt: timestamp("lastSeenAt")');
    expect(schema).toContain('suspendedAt: timestamp("suspendedAt")');
    expect(db).toContain("INACTIVITY_SUSPENSION_DAYS = 30");
    expect(db).toContain("lastLoginAt: new Date()");
    expect(db).toContain("lastSeenAt: new Date()");
    expect(db).toContain("getWorkerLastActiveAt");
    expect(db).toContain("lte(workers.lastSeenAt, cutoff)");
    expect(db).toContain("lastSeenAt: new Date(),");
    expect(db).toContain("suspendInactiveWorkers");
    expect(db).toContain("reactivateWorkerAccount");
  });

  it("blocks suspended employee IDs at both worker session activation routes", () => {
    const suspensionGuard = 'worker.accountStatus === "suspended"';
    expect(routers.split(suspensionGuard)).toHaveLength(3);
    expect(routers).toContain("Please contact your Administrator to reactivate your account.");
  });

  it("provides Admin reactivation controls and clear suspended-login guidance", () => {
    expect(routers).toContain("reactivateAccount: publicProcedure");
    expect(admin).toContain("Reactivate Employee ID?");
    expect(admin).toContain("Suspended · Reactivate");
    expect(login).toContain("isSuspendedAccountError");
    expect(login).toContain("Please contact your Administrator to reactivate this Employee ID");
  });

  it("mounts an authenticated and idempotent daily Heartbeat callback", () => {
    expect(server).toContain('app.post("/api/scheduled/suspend-inactive-workers"');
    expect(server).toContain("cronUser.isCron");
    expect(server).toContain("inactiveWorkerSuspensionTaskUid");
    expect(server).toContain("suspendInactiveWorkers()");
  });

  it("sends one browser push reminder at each configured inactivity threshold", () => {
    expect(schema).toContain("inactivityReminderDeliveries");
    expect(schema).toContain("inactivityReminderDeliveries_worker_threshold_activity_unique");
    expect(reminderMigration).toContain("CREATE TABLE `inactivityReminderDeliveries`");
    expect(reminderMigration).toContain("UNIQUE KEY `inactivityReminderDeliveries_worker_threshold_activity_unique`");
    expect(db).toContain("INACTIVITY_REMINDER_DAYS = [7, 3, 1]");
    expect(db).toContain("getInactivityReminderCandidates");
    expect(db).toContain("claimInactivityReminderDelivery");
    expect(server).toContain("sendPushToWorkers");
    expect(server).toContain("remindersSent: notified");
    expect(server).toContain("inactivity-reminder-");
  });

  it("exposes only the active worker's own warning, suspension, and reactivation history", () => {
    expect(db).toContain("getWorkerInactivityHistory");
    expect(db).toContain('inArray(auditLogs.action, ["account_suspended_inactive", "account_reactivated"])');
    expect(routers).toContain("getInactivityHistory: publicProcedure");
    expect(routers).toContain("return getWorkerInactivityHistory(input.workerID)");
  });

  it("shows an authenticated dashboard warning during the final seven days", () => {
    expect(routers).toContain("getAccountStatus: publicProcedure");
    expect(routers).toContain("INACTIVITY_SUSPENSION_DAYS * 24 * 60 * 60 * 1000");
    expect(routers).toContain("worker.lastSeenAt ?? worker.lastLoginAt ?? worker.createdAt");
    expect(routers).toContain("lastActiveAt: activityDate");
    expect(routers).toContain('worker?.accountStatus === "suspended"');
    expect(routers).toContain("worker.activeDeviceToken !== input.deviceToken");
    expect(home).toContain("InactivityWarningBanner");
    expect(home).toContain("daysUntilSuspension <= 7");
    expect(home).toContain('daysUntilSuspension <= 3 ? "urgent"');
    expect(home).toContain('daysUntilSuspension <= 1 ? "critical"');
    expect(home).toContain("3 DAYS LEFT");
    expect(home).toContain("1 DAY LEFT");
    expect(home).toContain("Sign out and sign in again to keep your account active.");
  });

  it("keeps the last active device details after logout for the 30-day policy record", () => {
    expect(db).toContain("activeDeviceToken: null,");
    expect(db).not.toContain("activeDeviceName: null,\n    activeDeviceIP: null,\n    activeLoginAt: null,\n    activeDeviceCountry: null");
  });
});
