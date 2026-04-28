import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getAllWorkers, getWorkerByWorkerID, createWorker, deleteWorker, getAllOrders, createOrder, updateOrderStatus, deleteOrder, logDeletedOrder, getDeletedLogs } from "./db";

const ADMIN_PASSWORD = "Qwer@7090heinann";

export const appRouter = router({
  orders: router({
    list: publicProcedure
      .input(z.object({ status: z.enum(["current", "out_of_stock"]).optional() }))
      .query(async ({ input }) => {
        const orders = await getAllOrders();
        if (input.status) {
          return orders.filter(o => o.status === input.status);
        }
        return orders;
      }),
    submit: publicProcedure
      .input(z.object({
        orderID: z.string().min(1),
        fluteType: z.string().min(1),
        sizeW: z.number().int().positive(),
        sizeL: z.number().int().positive(),
        qty: z.number().int().positive(),
        bqComment: z.string(),
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
    deleteFromHistory: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        workerID: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const worker = await getWorkerByWorkerID(input.workerID);
        if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "Worker ID not found" });
        
        const orders = await getAllOrders();
        const order = orders.find(o => o.id === input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        
        await logDeletedOrder({
          orderID: order.orderID,
          fluteType: order.fluteType,
          sizeW: order.sizeW,
          sizeL: order.sizeL,
          qty: order.qty,
          bqComment: order.bqComment,
          deletedBy: input.workerID,
        });
        
        await deleteOrder(input.id);
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
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
        }
        await updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
  }),
  workers: router({
    list: publicProcedure.query(async () => {
      return getAllWorkers();
    }),
    create: publicProcedure
      .input(z.object({
        workerID: z.string().min(1),
        name: z.string().min(1),
        department: z.string().min(1),
        adminPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.adminPassword !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
        }
        await createWorker({
          workerID: input.workerID,
          name: input.name,
          department: input.department,
        });
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        adminPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.adminPassword !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
        }
        await deleteWorker(input.id);
        return { success: true };
      }),
  }),
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      // Auth logout handled by middleware
      return { success: true };
    }),
  }),
  admin: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
        }
        return { success: true };
      }),
    deletedLogs: publicProcedure.query(async () => {
      return getDeletedLogs();
    }),
  }),
});

export type AppRouter = typeof appRouter;
