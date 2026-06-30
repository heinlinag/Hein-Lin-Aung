import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

import { contactMessages, systemSettings, workers } from "../../drizzle/schema";
import { getDb } from "../db";
import { desc, eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./trpc";
import { ADMIN_PASSWORD, COOKIE_NAME } from "@shared/const";
import { createHeartbeatJob, deleteHeartbeatJob, listHeartbeatJobs } from "./heartbeat";
import { invokeLLM } from "./llm";
import { parse as parseCookie } from "cookie";
// ─── System broadcast: send maintenance notice to all workers via a system group ───
const SYSTEM_MAINTENANCE_SENDER_ID = "SYSTEM_MAINTENANCE";
const SYSTEM_MAINTENANCE_SENDER_NAME = "Scheduled Maintenance";

async function broadcastMaintenanceNotice(startTime: number, endTime: number, message: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Format times in Malaysia Time (UTC+8)
  const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;
  const fmtMYT = (ms: number) => {
    const d = new Date(ms + MYT_OFFSET_MS);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = d.getUTCDate();
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours();
    const minutes = pad(d.getUTCMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return { date: `${month} ${day}, ${year}`, time: `${pad(h12)}:${minutes} ${ampm} MYT` };
  };

  const start = fmtMYT(startTime);
  const end = fmtMYT(endTime);
  const sameDay = start.date === end.date;

  const noticeText = `We perform regular maintenance to ensure optimal system performance and security. During maintenance windows, the system may be temporarily unavailable.\n\nTime : ${start.date}\n${start.time} - ${sameDay ? end.time : `${end.time} (${end.date})`}${message ? `\n\n${message}` : ""}`;

  // Send a DM to each worker individually from SYSTEM_MAINTENANCE
  const allWorkers = await db.select({ workerID: workers.workerID }).from(workers);
  if (allWorkers.length === 0) return;

  const { conversations: convTable, chatMessages: chatMsgsTable } = await import("../../drizzle/schema");
  const { or } = await import("drizzle-orm");

  for (const worker of allWorkers) {
    // Find or create a conversation between SYSTEM_MAINTENANCE and this worker
    const [existing] = await db.select().from(convTable)
      .where(
        or(
          and(eq(convTable.worker1ID, SYSTEM_MAINTENANCE_SENDER_ID), eq(convTable.worker2ID, worker.workerID)),
          and(eq(convTable.worker1ID, worker.workerID), eq(convTable.worker2ID, SYSTEM_MAINTENANCE_SENDER_ID))
        )
      ).limit(1);

    let convID: number;
    if (existing) {
      convID = existing.id;
    } else {
      const [res] = await db.insert(convTable).values({
        worker1ID: SYSTEM_MAINTENANCE_SENDER_ID,
        worker2ID: worker.workerID,
      }).$returningId();
      convID = res.id;
    }

    // Insert the message
    await db.insert(chatMsgsTable).values({
      conversationID: convID,
      senderID: SYSTEM_MAINTENANCE_SENDER_ID,
      text: noticeText,
    });

    // Update conversation lastMessageAt
    await db.update(convTable).set({ lastMessageAt: new Date() }).where(eq(convTable.id, convID));
  }
}

// Track server startup time for uptime calculation
const SERVER_START_TIME = Date.now();
let lastHealthCheckTime = Date.now();
let lastResponseTime = 0;
const responseTimeSamples: number[] = [];

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(({ input }) => {
      const now = Date.now();
      const responseTime = now - input.timestamp;
      
      // Track response time samples (keep last 100)
      responseTimeSamples.push(responseTime);
      if (responseTimeSamples.length > 100) {
        responseTimeSamples.shift();
      }
      
      lastResponseTime = responseTime;
      lastHealthCheckTime = now;
      
      return {
        ok: true,
        timestamp: now,
        responseTime,
      };
    }),

  status: publicProcedure.query(() => {
    const now = Date.now();
    const uptime = now - SERVER_START_TIME;
    
    // Calculate average response time
    const avgResponseTime = responseTimeSamples.length > 0
      ? responseTimeSamples.reduce((a, b) => a + b, 0) / responseTimeSamples.length
      : 0;
    
    // Calculate uptime in hours and minutes
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    // Determine server status based on response time
    const isHealthy = lastResponseTime < 1000; // Less than 1 second
    const status = isHealthy ? "operational" : "degraded";
    
    return {
      timestamp: now,
      uptime: {
        ms: uptime,
        formatted: `${uptimeHours}h ${uptimeMinutes}m`,
        hours: uptimeHours,
        minutes: uptimeMinutes,
      },
      server: {
        status,
        responseTime: Math.round(lastResponseTime),
        avgResponseTime: Math.round(avgResponseTime),
        lastHealthCheck: lastHealthCheckTime,
      },
      database: {
        status: "operational",
        responseTime: Math.round(Math.random() * 100 + 20), // Simulated DB response time
      },
      components: [
        {
          name: "Web Server",
          status: "operational",
          responseTime: Math.round(lastResponseTime),
          lastChecked: lastHealthCheckTime,
        },
        {
          name: "Database",
          status: "operational",
          responseTime: Math.round(Math.random() * 100 + 20),
          lastChecked: now,
        },
        {
          name: "API Gateway",
          status: "operational",
          responseTime: Math.round(Math.random() * 50 + 10),
          lastChecked: now,
        },
        {
          name: "Authentication",
          status: "operational",
          responseTime: Math.round(Math.random() * 150 + 50),
          lastChecked: now,
        },
        {
          name: "File Storage",
          status: "operational",
          responseTime: Math.round(Math.random() * 200 + 100),
          lastChecked: now,
        },
        {
          name: "Notifications",
          status: "operational",
          responseTime: Math.round(Math.random() * 300 + 200),
          lastChecked: now,
        },
      ],
    };
  }),

  /** Get current maintenance mode status (public — needed before login) */
  getMaintenanceStatus: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { maintenanceMode: false, maintenanceMessage: "" };
    const [row] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "maintenanceMode"))
      .limit(1);
    const [msgRow] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "maintenanceMessage"))
      .limit(1);
    return {
      maintenanceMode: row?.value === "true",
      maintenanceMessage: msgRow?.value ?? "",
    };
  }),

  /** Toggle maintenance mode on/off (admin only — verified by admin password) */
  setMaintenanceMode: publicProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        message: z.string().max(500).optional(),
        adminPassword: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [pwRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, "adminPassword")).limit(1);
      const effectivePw = pwRow?.value ?? ADMIN_PASSWORD;
      if (input.adminPassword !== effectivePw) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });
      }
      // Upsert maintenanceMode
      await db
        .insert(systemSettings)
        .values({ key: "maintenanceMode", value: input.enabled ? "true" : "false" })
        .onDuplicateKeyUpdate({ set: { value: input.enabled ? "true" : "false", updatedAt: new Date() } });
      // Upsert maintenanceMessage
      const msg = input.message ?? "";
      await db
        .insert(systemSettings)
        .values({ key: "maintenanceMessage", value: msg })
        .onDuplicateKeyUpdate({ set: { value: msg, updatedAt: new Date() } });
      return { success: true, maintenanceMode: input.enabled };
    }),

  /** Get the effective admin password (DB-stored or fallback to hardcoded default) */
  getAdminPasswordHash: publicProcedure.query(async () => {
    // Only returns whether a custom password is set — never exposes the password itself
    const db = await getDb();
    if (!db) return { hasCustomPassword: false };
    const [row] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "adminPassword"))
      .limit(1);
    return { hasCustomPassword: !!row?.value };
  }),

  /** Change admin password — requires current password verification */
  changeAdminPassword: publicProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // Get current effective password (DB-stored or hardcoded default)
      const [row] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "adminPassword"))
        .limit(1);
      const effectivePassword = row?.value ?? ADMIN_PASSWORD;
      if (input.currentPassword !== effectivePassword) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Current password is incorrect" });
      }
      // Save new password to DB
      await db
        .insert(systemSettings)
        .values({ key: "adminPassword", value: input.newPassword })
        .onDuplicateKeyUpdate({ set: { value: input.newPassword, updatedAt: new Date() } });
      return { success: true };
    }),

  /** Verify admin password (used by login and mutations) */
  verifyAdminPassword: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        // Fallback to hardcoded if DB unavailable
        return { valid: input.password === ADMIN_PASSWORD };
      }
      const [row] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "adminPassword"))
        .limit(1);
      const effectivePassword = row?.value ?? ADMIN_PASSWORD;
      return { valid: input.password === effectivePassword };
    }),

  /** Helper: get effective admin password from DB or fallback */
  // (internal helper, not a procedure)

  /** Get scheduled maintenance info */
  getScheduledMaintenance: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { startTime: null, endTime: null, message: "", startTaskUid: null, endTaskUid: null };
    const keys = ["scheduledMaintenanceStart", "scheduledMaintenanceEnd", "scheduledMaintenanceMessage", "scheduledMaintenanceStartTaskUid", "scheduledMaintenanceEndTaskUid"];
    const rows = await db.select().from(systemSettings).where(eq(systemSettings.key, keys[0])).limit(1);
    const [startRow] = rows;
    const [endRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, keys[1])).limit(1);
    const [msgRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, keys[2])).limit(1);
    const [startUidRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, keys[3])).limit(1);
    const [endUidRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, keys[4])).limit(1);
    return {
      startTime: startRow?.value ? Number(startRow.value) : null,
      endTime: endRow?.value ? Number(endRow.value) : null,
      message: msgRow?.value ?? "",
      startTaskUid: startUidRow?.value ?? null,
      endTaskUid: endUidRow?.value ?? null,
    };
  }),

  /** Schedule maintenance window — creates Heartbeat cron jobs for auto ON/OFF */
  scheduleMaintenanceWindow: publicProcedure
    .input(z.object({
      startTime: z.number(), // UTC ms timestamp
      endTime: z.number(),   // UTC ms timestamp
      message: z.string().max(500).optional(),
      adminPassword: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // Verify admin password
      const [pwRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, "adminPassword")).limit(1);
      const effectivePw = pwRow?.value ?? ADMIN_PASSWORD;
      if (input.adminPassword !== effectivePw) throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });
      if (input.startTime >= input.endTime) throw new TRPCError({ code: "BAD_REQUEST", message: "Start time must be before end time" });
      if (input.startTime <= Date.now()) throw new TRPCError({ code: "BAD_REQUEST", message: "Start time must be in the future" });

      // Delete existing scheduled jobs if any
      const [startUidRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, "scheduledMaintenanceStartTaskUid")).limit(1);
      const [endUidRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, "scheduledMaintenanceEndTaskUid")).limit(1);
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (startUidRow?.value) {
        try { await deleteHeartbeatJob(startUidRow.value, sessionToken); } catch { /* ignore if already deleted */ }
      }
      if (endUidRow?.value) {
        try { await deleteHeartbeatJob(endUidRow.value, sessionToken); } catch { /* ignore if already deleted */ }
      }

      // Convert UTC ms to 6-field cron (sec min hour dom mon dow)
      const toCron = (ms: number): string => {
        const d = new Date(ms);
        return `0 ${d.getUTCMinutes()} ${d.getUTCHours()} ${d.getUTCDate()} ${d.getUTCMonth() + 1} *`;
      };

      // Create start cron (turns maintenance ON)
      const startJob = await createHeartbeatJob({
        name: `maintenance-start-${input.startTime}`,
        cron: toCron(input.startTime),
        path: "/api/scheduled/maintenance-start",
        payload: { message: input.message ?? "" },
        description: `Auto-enable maintenance at ${new Date(input.startTime).toISOString()}`,
      }, sessionToken);

      // Create end cron (turns maintenance OFF)
      const endJob = await createHeartbeatJob({
        name: `maintenance-end-${input.endTime}`,
        cron: toCron(input.endTime),
        path: "/api/scheduled/maintenance-end",
        payload: {},
        description: `Auto-disable maintenance at ${new Date(input.endTime).toISOString()}`,
      }, sessionToken);

      // Save schedule info to DB
      const upsert = async (key: string, value: string) => {
        await db.insert(systemSettings).values({ key, value })
          .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
      };
      await upsert("scheduledMaintenanceStart", String(input.startTime));
      await upsert("scheduledMaintenanceEnd", String(input.endTime));
      await upsert("scheduledMaintenanceMessage", input.message ?? "");
      await upsert("scheduledMaintenanceStartTaskUid", startJob.taskUid);
      await upsert("scheduledMaintenanceEndTaskUid", endJob.taskUid);

      // Broadcast maintenance notice to all workers via System Announcements group
      try {
        await broadcastMaintenanceNotice(input.startTime, input.endTime, input.message ?? "");
      } catch (err) {
        console.error("[Maintenance] Failed to broadcast notice:", err);
        // Non-fatal: schedule still created
      }

      return {
        success: true,
        startTaskUid: startJob.taskUid,
        endTaskUid: endJob.taskUid,
        startNextExecution: startJob.nextExecutionAt,
        endNextExecution: endJob.nextExecutionAt,
      };
    }),

  /** Cancel a scheduled maintenance window */
  cancelScheduledMaintenance: publicProcedure
    .input(z.object({ adminPassword: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [pwRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, "adminPassword")).limit(1);
      const effectivePw = pwRow?.value ?? ADMIN_PASSWORD;
      if (input.adminPassword !== effectivePw) throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });

      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const [startUidRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, "scheduledMaintenanceStartTaskUid")).limit(1);
      const [endUidRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, "scheduledMaintenanceEndTaskUid")).limit(1);
      if (startUidRow?.value) {
        try { await deleteHeartbeatJob(startUidRow.value, sessionToken); } catch { /* ignore */ }
      }
      if (endUidRow?.value) {
        try { await deleteHeartbeatJob(endUidRow.value, sessionToken); } catch { /* ignore */ }
      }
      // Clear schedule keys
      const clearKeys = ["scheduledMaintenanceStart", "scheduledMaintenanceEnd", "scheduledMaintenanceMessage", "scheduledMaintenanceStartTaskUid", "scheduledMaintenanceEndTaskUid"];
      for (const key of clearKeys) {
        await db.insert(systemSettings).values({ key, value: "" })
          .onDuplicateKeyUpdate({ set: { value: "", updatedAt: new Date() } });
      }
      return { success: true };
    }),

  /** Generate maintenance message using AI */
  generateMaintenanceMessage: publicProcedure
    .input(z.object({
      startTime: z.number(),
      endTime: z.number(),
      adminPassword: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [pwRow] = await db.select().from(systemSettings).where(eq(systemSettings.key, "adminPassword")).limit(1);
      const effectivePw = pwRow?.value ?? ADMIN_PASSWORD;
      if (input.adminPassword !== effectivePw) throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });

      const startDate = new Date(input.startTime);
      const endDate = new Date(input.endTime);
      const durationMs = input.endTime - input.startTime;
      const durationMin = Math.round(durationMs / 60000);

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a system administrator writing a brief, professional maintenance notice for users. Write in English only. Be concise (2-3 sentences max). Do not include greetings or sign-offs." },
          { role: "user", content: `Write a maintenance notice for: Start: ${startDate.toUTCString()}, End: ${endDate.toUTCString()}, Duration: approximately ${durationMin} minutes. Include the estimated duration and apologize for any inconvenience.` },
        ],
      });

      const message = (response as any)?.choices?.[0]?.message?.content ?? "";
      return { message: typeof message === "string" ? message.trim() : "" };
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  // Save contact form submission
  submitContactMessage: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email"),
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(10, "Message must be at least 10 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const result = await db
        .insert(contactMessages)
        .values({
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
          status: "new",
        });
      
      // Notify owner about new contact message
      try {
        await notifyOwner({
          title: "New Contact Message",
          content: `New message from ${input.name} (${input.email})\n\nSubject: ${input.subject}\n\nMessage: ${input.message.substring(0, 100)}...`,
        });
      } catch (err) {
        console.error("Failed to notify owner:", err);
      }
      
      return { success: true };
    }),

  // Get all contact messages (admin only)
  getContactMessages: protectedProcedure
    .use(({ ctx, next }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return next({ ctx });
    })
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      return await db
        .select()
        .from(contactMessages)
        .orderBy(desc(contactMessages.createdAt))
        .limit(200);
    }),

  // Mark contact message as read
  markContactMessageAsRead: protectedProcedure
    .use(({ ctx, next }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return next({ ctx });
    })
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db
        .update(contactMessages)
        .set({ status: "read" })
        .where(eq(contactMessages.id, input.id));
      return { success: true };
    }),

  // Mark contact message as replied
  markContactMessageAsReplied: protectedProcedure
    .use(({ ctx, next }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return next({ ctx });
    })
    .input(z.object({ id: z.number(), repliedBy: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db
        .update(contactMessages)
        .set({ status: "replied", repliedBy: input.repliedBy, repliedAt: new Date() })
        .where(eq(contactMessages.id, input.id));
      return { success: true };
    }),
});
