import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { claimInactivityReminderDelivery, getDb, getInactivityReminderCandidates, getWorkerByWorkerID, suspendInactiveWorkers } from "../db";
import { systemSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import { sdk } from "./sdk";
import { sendPushToWorkers } from "../push";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  const verifyScannerWorkerSession = async (workerID: string, deviceToken: string) => {
    if (!workerID || !deviceToken) {
      return { ok: false as const, error: "Scanner session missing. Please sign out and sign in again.", code: 10001 };
    }
    const worker = await getWorkerByWorkerID(workerID);
    if (!worker || worker.activeDeviceToken !== deviceToken) {
      return { ok: false as const, error: "Scanner session expired. Please sign out and sign in again.", code: 10001 };
    }
    return { ok: true as const };
  };

  // ─── Scanner Session Health Check ──────────────────────────────────────────
  app.post("/api/scanner-session", async (req, res) => {
    try {
      const workerID = (req.body as Record<string, string>)?.workerID ?? "";
      const deviceToken = (req.body as Record<string, string>)?.deviceToken ?? "";
      const session = await verifyScannerWorkerSession(workerID, deviceToken);
      return res.status(session.ok ? 200 : 401).json(session);
    } catch (err) {
      console.error("[scanner-session] error:", err);
      return res.status(500).json({ ok: false, error: "Unable to verify scanner session. Please try again." });
    }
  });

  // ─── Label Scanner Route (multipart, bypasses tRPC to avoid cookie/batch issues) ───
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
  app.post("/api/scan-label", upload.single("image"), async (req, res) => {
    try {
      // Authenticate via workerID + deviceToken (worker sessions use localStorage, not cookies)
      const workerID = (req.body as Record<string, string>)?.workerID ?? "";
      const deviceToken = (req.body as Record<string, string>)?.deviceToken ?? "";
      const session = await verifyScannerWorkerSession(workerID, deviceToken);
      if (!session.ok) return res.status(401).json(session);
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const base64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype || "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const { invokeLLM } = await import("./llm");
      const result = await invokeLLM({
        model: "gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a precise OCR assistant for GS Paper & Packaging Sdn Bhd production labels. Extract ONLY these fields and return valid JSON. Rules: 1) Check MASTERCARD field - if NOT "PB" set mastercardValid=false and all other fields null. 2) productionOrder: value after "PRODUCTION ORDER:" (e.g. "BA-181"). 3) boardWidth and boardLength: two numbers from "BOARD Wid x Len" (e.g. 1630 and 1800). 4) qty: UNIT QTY value (fallback to ORDER QTY). 5) bqComment: full string after "Comment:" or "BQ" label, WITHOUT the fluteType prefix (e.g. "LR170MP140MP140MP140LR170" not "BA-LR170..."). 6) fluteType: prefix before first "-" in the BQ comment string (e.g. "BA" from "BA-LR170..."). Return ONLY JSON.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the label fields from this image." },
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
            ] as Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }>,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "label_extraction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                mastercardValid: { type: "boolean" },
                mastercardValue: { type: ["string", "null"] },
                productionOrder: { type: ["string", "null"] },
                boardWidth: { type: ["number", "null"] },
                boardLength: { type: ["number", "null"] },
                qty: { type: ["number", "null"] },
                bqComment: { type: ["string", "null"] },
                fluteType: { type: ["string", "null"] },
              },
              required: ["mastercardValid","mastercardValue","productionOrder","boardWidth","boardLength","qty","bqComment","fluteType"],
              additionalProperties: false,
            },
          },
        },
      } as Parameters<typeof invokeLLM>[0]);
      const raw = result.choices[0].message.content;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return res.json(parsed);
    } catch (err) {
      console.error("[scan-label] error:", err);
      return res.status(500).json({ error: String(err) });
    }
  });

  // ─── Chat Attachment Upload (multipart, worker-device authenticated) ────────
  const chatAttachmentMimeTypes = new Set([
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf", "text/plain", "text/csv",
    "application/msword", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]);
  const chatUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post("/api/chat-upload", chatUpload.single("file"), async (req, res) => {
    try {
      const workerID = (req.body as Record<string, string>)?.workerID ?? "";
      const deviceToken = (req.body as Record<string, string>)?.deviceToken ?? "";
      const session = await verifyScannerWorkerSession(workerID, deviceToken);
      if (!session.ok) return res.status(401).json(session);
      if (!req.file) return res.status(400).json({ error: "Choose a file to attach." });
      if (!chatAttachmentMimeTypes.has(req.file.mimetype)) {
        return res.status(415).json({ error: "This file type is not supported. Share an image, PDF, text, CSV, Word, or Excel file." });
      }
      const safeFileName = (req.file.originalname || "attachment")
        .replace(/[^a-zA-Z0-9._() -]/g, "_")
        .slice(0, 180);
      const { storagePut } = await import("../storage");
      const stored = await storagePut(`chat-attachments/${workerID}/${Date.now()}-${safeFileName}`, req.file.buffer, req.file.mimetype);
      return res.json({
        attachment: {
          storageKey: stored.key,
          fileName: safeFileName,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
        },
      });
    } catch (err) {
      console.error("[chat-upload] error:", err);
      return res.status(500).json({ error: "Unable to upload this attachment. Please try again." });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // ─── Scheduled Maintenance Callbacks ───────────────────────────────────────
  // These endpoints are called by Heartbeat cron jobs to auto-enable/disable maintenance.
  app.post("/api/scheduled/maintenance-start", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable" });
      const msg = (req.body as any)?.message ?? "";
      await db.insert(systemSettings).values({ key: "maintenanceMode", value: "true" })
        .onDuplicateKeyUpdate({ set: { value: "true", updatedAt: new Date() } });
      if (msg) {
        await db.insert(systemSettings).values({ key: "maintenanceMessage", value: msg })
          .onDuplicateKeyUpdate({ set: { value: msg, updatedAt: new Date() } });
      }
      // Clear schedule keys so UI shows no pending schedule
      await db.insert(systemSettings).values({ key: "scheduledMaintenanceStartTaskUid", value: "" })
        .onDuplicateKeyUpdate({ set: { value: "", updatedAt: new Date() } });
      console.log("[Scheduled] Maintenance mode AUTO-ENABLED");
      return res.json({ ok: true, action: "maintenance-start" });
    } catch (err) {
      console.error("[Scheduled] maintenance-start error:", err);
      return res.status(500).json({ error: String(err), timestamp: new Date().toISOString() });
    }
  });

  app.post("/api/scheduled/maintenance-end", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable" });
      await db.insert(systemSettings).values({ key: "maintenanceMode", value: "false" })
        .onDuplicateKeyUpdate({ set: { value: "false", updatedAt: new Date() } });
      // Clear schedule keys
      for (const key of ["scheduledMaintenanceStart", "scheduledMaintenanceEnd", "scheduledMaintenanceMessage", "scheduledMaintenanceStartTaskUid", "scheduledMaintenanceEndTaskUid"]) {
        await db.insert(systemSettings).values({ key, value: "" })
          .onDuplicateKeyUpdate({ set: { value: "", updatedAt: new Date() } });
      }
      console.log("[Scheduled] Maintenance mode AUTO-DISABLED");
      return res.json({ ok: true, action: "maintenance-end" });
    } catch (err) {
      console.error("[Scheduled] maintenance-end error:", err);
      return res.status(500).json({ error: String(err), timestamp: new Date().toISOString() });
    }
  });

  // ─── Auto-Delete Expired Out of Stock Orders ──────────────────────────────
  // Called daily by Heartbeat cron job to delete orders out_of_stock for 13+ months
  app.post("/api/scheduled/cleanup-out-of-stock", async (req, res) => {
    try {
      const { deleteExpiredOutOfStockOrders } = await import("../db");
      const result = await deleteExpiredOutOfStockOrders();
      console.log(`[Scheduled] cleanup-out-of-stock: deleted ${result.deletedCount} expired records`);
      return res.json({ ok: true, deletedCount: result.deletedCount, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error("[Scheduled] cleanup-out-of-stock error:", err);
      return res.status(500).json({ error: String(err), stack: String((err as Error).stack), timestamp: new Date().toISOString() });
    }
  });

  // ─── Daily Inactive Worker Suspension ──────────────────────────────────────
  // Heartbeat-only and idempotent: warns workers at 7/3/1 days, then suspends at 30 days.
  app.post("/api/scheduled/suspend-inactive-workers", async (req, res) => {
    try {
      const cronUser = await sdk.authenticateRequest(req);
      if (!cronUser.isCron || !cronUser.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB unavailable", timestamp: new Date().toISOString() });
      const [schedule] = await db.select().from(systemSettings)
        .where(eq(systemSettings.key, "inactiveWorkerSuspensionTaskUid")).limit(1);
      if (!schedule?.value || schedule.value !== cronUser.taskUid) {
        return res.json({ ok: true, skipped: "orphan-or-unconfigured", taskUid: cronUser.taskUid });
      }
      const reminders = await getInactivityReminderCandidates();
      const notified: Array<{ workerID: string; daysUntilSuspension: number }> = [];
      for (const reminder of reminders) {
        const claimed = await claimInactivityReminderDelivery(reminder);
        if (!claimed) continue;
        const isFinalDay = reminder.daysUntilSuspension === 1;
        const isUrgent = reminder.daysUntilSuspension <= 3;
        const dayLabel = `${reminder.daysUntilSuspension} ${reminder.daysUntilSuspension === 1 ? "day" : "days"}`;
        await sendPushToWorkers([reminder.workerID], {
          title: isFinalDay
            ? "Action required: account suspension tomorrow"
            : isUrgent
              ? "Urgent: account suspension in 3 days"
              : "Account activity reminder: 7 days remaining",
          body: `Your Employee ID will be automatically suspended in ${dayLabel} due to inactivity. Sign out and sign in again to keep your account active.`,
          type: "system",
          tag: `inactivity-reminder-${reminder.workerID}-${reminder.daysUntilSuspension}`,
          url: "/",
          requireInteraction: isUrgent,
        });
        notified.push({ workerID: reminder.workerID, daysUntilSuspension: reminder.daysUntilSuspension });
      }

      const result = await suspendInactiveWorkers();
      console.log(`[Scheduled] suspend-inactive-workers: notified ${notified.length} worker(s), suspended ${result.suspendedCount} worker(s)`);
      return res.json({ ok: true, remindersSent: notified, ...result, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error("[Scheduled] suspend-inactive-workers error:", err);
      return res.status(500).json({
        error: String(err),
        stack: String((err as Error).stack),
        context: { url: req.originalUrl },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
