import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { saveSubscription, sendPushNotification, getAllSubscriptions, getSubscriptionsForWorkers } from "./push";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getAllWorkers,
  getWorkerByWorkerID,
  createWorker,
  deleteWorker,
  getAllOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  logUsageHistory,
  getUsageHistory,
  logDeletedOrder,
  getDeletedLogs,
  createPendingRequest,
  getPendingRequests,
  getPendingRequestById,
  getPendingUsedQtyForOrder,
  updatePendingRequestStatus,
} from "./db";

const ADMIN_PASSWORD = "Qwer@7090heinann";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Workers ───────────────────────────────────────────────────────────────
  workers: router({
    verify: publicProcedure
      .input(z.object({ workerID: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const worker = await getWorkerByWorkerID(input.workerID);
        if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "Worker ID not found" });
        return { id: worker.id, workerID: worker.workerID, name: worker.name, department: worker.department, userLevel: worker.userLevel };
      }),
    list: publicProcedure.query(async () => {
      return getAllWorkers();
    }),
    add: publicProcedure
      .input(z.object({
        workerID: z.string().min(1).max(64),
        name: z.string().min(1).max(128),
        department: z.string().min(1).max(128),
        userLevel: z.enum(["1", "2"]).default("2"),
        adminPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.adminPassword !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });
        }
        const existing = await getWorkerByWorkerID(input.workerID);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Worker ID already exists" });
        await createWorker({ workerID: input.workerID, name: input.name, department: input.department, userLevel: input.userLevel });
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        adminPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.adminPassword !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });
        }
        await deleteWorker(input.id);
        return { success: true };
      }),
  }),

  // ─── Orders ────────────────────────────────────────────────────────────────
  orders: router({
    list: publicProcedure
      .input(z.object({ status: z.enum(["current", "out_of_stock"]).optional() }))
      .query(async ({ input }) => {
        return getAllOrders(input.status);
      }),
    submit: publicProcedure
      .input(z.object({
        orderID: z.string().min(1).max(64),
        fluteType: z.string().min(1).max(64),
        sizeW: z.number().int().positive(),
        sizeL: z.number().int().positive(),
        qty: z.number().int().positive(),
        bqComment: z.string().min(1),
        workerID: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const worker = await getWorkerByWorkerID(input.workerID);
        if (!worker) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Worker ID" });
        await createOrder({
          orderID: input.orderID,
          fluteType: input.fluteType,
          sizeW: input.sizeW,
          sizeL: input.sizeL,
          qty: input.qty,
          bqComment: input.bqComment,
          status: "current",
          submittedBy: input.workerID,
        });
        return { success: true };
      }),
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["current", "out_of_stock"]),
        adminPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.adminPassword !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });
        }
        await updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        orderID: z.string().min(1),
        fluteType: z.string().min(1),
        sizeW: z.number().int(),
        sizeL: z.number().int(),
        qty: z.number().int(),
        bqComment: z.string(),
        workerID: z.string().min(1),
        adminPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.adminPassword !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });
        }
        const worker = await getWorkerByWorkerID(input.workerID);
        if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "Worker ID not found" });
        await logDeletedOrder({
          orderID: input.orderID,
          fluteType: input.fluteType,
          sizeW: input.sizeW,
          sizeL: input.sizeL,
          qty: input.qty,
          bqComment: input.bqComment,
          deletedBy: worker.name,
        });
        await deleteOrder(input.id);
        return { success: true };
      }),
    deleteFromHistory: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        orderID: z.string().min(1),
        fluteType: z.string().min(1),
        sizeW: z.number().int(),
        sizeL: z.number().int(),
        qty: z.number().int(),
        bqComment: z.string(),
        workerID: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const worker = await getWorkerByWorkerID(input.workerID);
        if (!worker) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Worker ID" });
        await logDeletedOrder({
          orderID: input.orderID,
          fluteType: input.fluteType,
          sizeW: input.sizeW,
          sizeL: input.sizeL,
          qty: input.qty,
          bqComment: input.bqComment,
          deletedBy: worker.name,
        });
        await deleteOrder(input.id);
        return { success: true };
      }),
    getDeletedLogs: publicProcedure.query(async () => {
      return getDeletedLogs();
    }),
    logUsage: publicProcedure
      .input(z.object({
        jobNo: z.string().nullable(),
        usedQty: z.number().int().positive(),
        orderID: z.string().min(1),
        fluteType: z.string().min(1),
        bqComment: z.string(),
        purpose: z.enum(["job", "old_stock"]),
        orderId: z.number().int().positive(),
        newQty: z.number().int().min(0),
      }))
      .mutation(async ({ input }) => {
        await logUsageHistory({
          jobNo: input.jobNo,
          usedQty: input.usedQty,
          orderID: input.orderID,
          fluteType: input.fluteType,
          bqComment: input.bqComment,
          purpose: input.purpose,
        });
        // Update the order qty or move to out_of_stock
        if (input.newQty === 0) {
          await updateOrderStatus(input.orderId, "out_of_stock");
        } else {
          // Update qty directly
          const db = await (await import("./db")).getDb();
          if (db) {
            const { orders: ordersTable } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            await db.update(ordersTable).set({ qty: input.newQty }).where(eq(ordersTable.id, input.orderId));
          }
        }
        return { success: true };
      }),
    getUsage: publicProcedure.query(async () => {
      return getUsageHistory();
    }),
  }),

  // ─── Pending Requests ──────────────────────────────────────────────────────────────────────────────
  pendingRequests: router({
    submit: publicProcedure
      .input(z.object({
        type: z.enum(["delete", "used_update"]),
        orderId: z.number().int().positive(),
        orderSnapshot: z.string(), // JSON
        requestedBy: z.string().min(1), // workerID
        actionData: z.string().optional(), // JSON for used_update
      }))
      .mutation(async ({ input }) => {
        const worker = await getWorkerByWorkerID(input.requestedBy);
        if (!worker) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Worker ID" });
        if (worker.userLevel !== "1") throw new TRPCError({ code: "FORBIDDEN", message: "Only Level 1 workers submit requests" });
        await createPendingRequest({
          type: input.type,
          orderId: input.orderId,
          orderSnapshot: input.orderSnapshot,
          requestedBy: input.requestedBy,
          workerName: worker.name,
          actionData: input.actionData,
        });
        return { success: true };
      }),
    list: publicProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "cancelled"]).optional() }))
      .query(async ({ input }) => {
        return getPendingRequests(input.status);
      }),
    getPendingUsedQty: publicProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const pendingUsedQty = await getPendingUsedQtyForOrder(input.orderId);
        return { pendingUsedQty };
      }),
    approve: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        reviewerWorkerID: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const isAdmin = input.reviewerWorkerID === "ADMIN";
        let reviewerName = "Administrator";
        if (!isAdmin) {
          const reviewer = await getWorkerByWorkerID(input.reviewerWorkerID);
          if (!reviewer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Worker ID" });
          if (reviewer.userLevel !== "2") throw new TRPCError({ code: "FORBIDDEN", message: "Only Level 2 workers can approve requests" });
          reviewerName = reviewer.name;
        }
        const req = await getPendingRequestById(input.id);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        if (req.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Request is no longer pending" });
        // Execute the action
        if (req.type === "delete") {
          const snapshot = JSON.parse(req.orderSnapshot);
          await logDeletedOrder({
            orderID: snapshot.orderID,
            fluteType: snapshot.fluteType,
            sizeW: snapshot.sizeW,
            sizeL: snapshot.sizeL,
            qty: snapshot.qty,
            bqComment: snapshot.bqComment,
            deletedBy: req.workerName,
          });
          await deleteOrder(req.orderId);
        } else if (req.type === "used_update" && req.actionData) {
          const action = JSON.parse(req.actionData);
          await logUsageHistory({
            jobNo: action.jobNo ?? null,
            usedQty: action.usedQty,
            orderID: action.orderID,
            fluteType: action.fluteType,
            bqComment: action.bqComment,
            purpose: action.purpose,
          });
          if (action.newQty === 0) {
            await updateOrderStatus(req.orderId, "out_of_stock");
          } else {
            const db = await (await import("./db")).getDb();
            if (db) {
              const { orders: ordersTable } = await import("../drizzle/schema");
              const { eq } = await import("drizzle-orm");
              await db.update(ordersTable).set({ qty: action.newQty }).where(eq(ordersTable.id, req.orderId));
            }
          }
        }
        await updatePendingRequestStatus(input.id, "approved", reviewerName);
        return { success: true };
      }),
    cancel: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        reviewerWorkerID: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const isAdminCancel = input.reviewerWorkerID === "ADMIN";
        let cancellerName = "Administrator";
        if (!isAdminCancel) {
          const reviewer = await getWorkerByWorkerID(input.reviewerWorkerID);
          if (!reviewer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Worker ID" });
          const req2 = await getPendingRequestById(input.id);
          if (!req2) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
          if (req2.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Request is no longer pending" });
          // Level 1 can only cancel their own requests; Level 2 can cancel any
          if (reviewer.userLevel === "1" && req2.requestedBy !== reviewer.workerID) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Level 1 users can only cancel their own requests" });
          }
          if (reviewer.userLevel !== "1" && reviewer.userLevel !== "2") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
          }
          cancellerName = reviewer.name;
        }
        const req = await getPendingRequestById(input.id);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        if (req.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Request is no longer pending" });
        await updatePendingRequestStatus(input.id, "cancelled", cancellerName);
        return { success: true };
      }),
  }),
  // ─── Admin ──────────────────────────────────────────────────────────────────────────────
  admin: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
        }
        return { success: true };
      }),
  }),
  // ─── Push Notifications ─────────────────────────────────────────────────────────────────
  push: router({
    getVapidKey: publicProcedure.query(() => {
      return { publicKey: "BAQN0wvOeqzGaDPxLZm76ZG6Iw2L1IfRZ8h5GzcxYJFFm4AT3RybTyiM0r8825pWeKZJ7MOSz9yZwBZ-_AI1q-g" };
    }),
    subscribe: publicProcedure
      .input(z.object({
        workerID: z.string().min(1),
        subscription: z.object({
          endpoint: z.string(),
          keys: z.object({ p256dh: z.string(), auth: z.string() }),
        }),
      }))
      .mutation(async ({ input }) => {
        await saveSubscription(input.workerID, input.subscription);
        return { success: true };
      }),
    sendToAll: publicProcedure
      .input(z.object({
        title: z.string(),
        body: z.string(),
        tag: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const subs = await getAllSubscriptions();
        await sendPushNotification(subs, { title: input.title, body: input.body, tag: input.tag });
        return { success: true };
      }),
    sendToLevel2: publicProcedure
      .input(z.object({
        title: z.string(),
        body: z.string(),
        tag: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const allWorkers = await (await import("./db")).getAllWorkers();
        const level2IDs = allWorkers.filter((w: { userLevel: string }) => w.userLevel === "2").map((w: { workerID: string }) => w.workerID);
        const subs = await getSubscriptionsForWorkers(level2IDs);
        await sendPushNotification(subs, { title: input.title, body: input.body, tag: input.tag });
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;