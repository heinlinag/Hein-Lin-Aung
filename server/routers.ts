import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
        return { id: worker.id, workerID: worker.workerID, name: worker.name, department: worker.department };
      }),
    list: publicProcedure.query(async () => {
      return getAllWorkers();
    }),
    add: publicProcedure
      .input(z.object({
        workerID: z.string().min(1).max(64),
        name: z.string().min(1).max(128),
        department: z.string().min(1).max(128),
        adminPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.adminPassword !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });
        }
        const existing = await getWorkerByWorkerID(input.workerID);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Worker ID already exists" });
        await createWorker({ workerID: input.workerID, name: input.name, department: input.department });
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

  // ─── Admin ─────────────────────────────────────────────────────────────────
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
});

export type AppRouter = typeof appRouter;
