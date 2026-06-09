import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { saveSubscription, sendPushNotification, getAllSubscriptions, getSubscriptionsForWorkers, sendPushToWorkers } from "./push";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getAllWorkers,
  getWorkerByWorkerID,
  createWorker,
  deleteWorker,
  updateWorkerById,
  getAllOrders,
  createOrder,
  getOrderByOrderID,
  getOrderByTrackingId,
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
  getInProcessQtyForOrder,
  updatePendingRequestStatus,
  processApprovePendingRequest,
  createApprovalActionLog,
  getApprovalActionLog,
  toggleUrgent,
  reviewPendingRequest,
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
        if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "Employee ID not found" });
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
        userLevel: z.enum(["1", "1.1", "2"]).default("2"),
        adminPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.adminPassword !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });
        }
        const existing = await getWorkerByWorkerID(input.workerID);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Employee ID already exists" });
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
    update: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        workerID: z.string().min(1).max(64),
        name: z.string().min(1).max(128),
        department: z.string().min(1).max(128),
        userLevel: z.enum(["1", "1.1", "2"]),
        confirmWorkerID: z.string().min(1), // must match the new workerID
        adminPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.adminPassword !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin password" });
        }
        if (input.confirmWorkerID !== input.workerID) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Employee ID confirmation does not match" });
        }
        // Check if new workerID conflicts with another worker (excluding current)
        const existing = await getWorkerByWorkerID(input.workerID);
        if (existing && existing.id !== input.id) {
          throw new TRPCError({ code: "CONFLICT", message: "Employee ID already used by another worker" });
        }
        await updateWorkerById(input.id, {
          workerID: input.workerID,
          name: input.name,
          department: input.department,
          userLevel: input.userLevel,
        });
        return { success: true };
      }),
  }),

  // ─── Orders ────────────────────────────────────────────────────────────────
  orders: router({
    adminStats: publicProcedure
      .query(async () => {
        const LOW_STOCK_THRESHOLD = 50;
        const [allOrders, pendingReqs] = await Promise.all([
          getAllOrders(),
          getPendingRequests("pending"),
        ]);
        const currentOrders = allOrders.filter(o => o.status === "current");
        const outOfStockOrders = allOrders.filter(o => o.status === "out_of_stock");
        const lowStockOrders = currentOrders.filter(o => o.qty <= LOW_STOCK_THRESHOLD);
        return {
          totalCurrent: currentOrders.length,
          totalOutOfStock: outOfStockOrders.length,
          pendingRequests: pendingReqs.length,
          lowStockCount: lowStockOrders.length,
          lowStockThreshold: LOW_STOCK_THRESHOLD,
        };
      }),
    checkOrderId: publicProcedure
      .input(z.object({ orderID: z.string().min(1) }))
      .query(async ({ input }) => {
        const existing = await getOrderByOrderID(input.orderID.trim());
        return { exists: !!existing };
      }),
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
        if (!worker) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Employee ID" });
        const { generateTrackingId } = await import("./db");
        const trackingId = generateTrackingId(input.orderID);
        await createOrder({
          orderID: input.orderID,
          trackingId: trackingId,
          fluteType: input.fluteType,
          sizeW: input.sizeW,
          sizeL: input.sizeL,
          qty: input.qty,
          bqComment: input.bqComment,
          status: "current",
          submittedBy: input.workerID,
        });
        return { success: true, trackingId };
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
        if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "Employee ID not found" });
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
        if (!worker) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Employee ID" });
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
        performedBy: z.string().optional(), // workerID of Level 2 who did the direct action
        masterCard: z.string().optional().nullable(),
        boardSizeW: z.number().int().positive().optional().nullable(),
        boardSizeL: z.number().int().positive().optional().nullable(),
        scores: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        await logUsageHistory({
          jobNo: input.jobNo,
          usedQty: input.usedQty,
          orderID: input.orderID,
          fluteType: input.fluteType,
          bqComment: input.bqComment,
          purpose: input.purpose,
          masterCard: input.masterCard ?? null,
          boardSizeW: input.boardSizeW ?? null,
          boardSizeL: input.boardSizeL ?? null,
          scores: input.scores ?? null,
        });
        // Log direct Level 2 action into approval_action_log
        if (input.performedBy) {
          const actionType = input.purpose === "old_stock" ? "direct_old_stock" : "direct_used_update";
          const details = input.purpose === "old_stock"
            ? `Direct: Cleared stock to 0 (Out of Stock) for Order ${input.orderID}`
            : `Direct: Used ${input.usedQty} pcs for Job No ${input.jobNo ?? "N/A"} on Order ${input.orderID}. Remaining: ${input.newQty} pcs`;
          await createApprovalActionLog({
            actionType: actionType as "approve" | "cancel",
            requestId: 0,
            requestType: "used_update",
            orderID: input.orderID,
            requestedBy: input.performedBy,
            reviewedBy: input.performedBy,
            approvedQty: input.usedQty,
            requestedQty: input.usedQty,
            cancelReason: null,
            details,
          });
        }
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
    qrVerify: publicProcedure
      .input(z.object({ orderID: z.string().min(1) }))
      .query(async ({ input }) => {
        const order = await getOrderByOrderID(input.orderID.trim().toUpperCase());
        if (!order) return { found: false, order: null };
        return { found: true, order };
      }),
    qrVerifyByTrackingId: publicProcedure
      .input(z.object({ trackingId: z.string().min(1) }))
      .query(async ({ input }) => {
        const order = await getOrderByTrackingId(input.trackingId.trim().toUpperCase());
        if (!order) return { found: false, order: null };
        return { found: true, order };
      }),
    qrUpdateBalance: publicProcedure
      .input(z.object({
        orderId: z.number().int().positive(),
        orderStringId: z.string().min(1), // Production Order string for logging
        newQty: z.number().int().min(0),
        oldQty: z.number().int().min(0),
        employeeId: z.string().min(1),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const worker = await getWorkerByWorkerID(input.employeeId.trim().toUpperCase());
        if (!worker) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Employee ID" });
        const db = await (await import("./db")).getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { orders: ordersTable, qrScanLog } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(ordersTable).set({ qty: input.newQty }).where(eq(ordersTable.id, input.orderId));
        // Log the balance update event
        await db.insert(qrScanLog).values({
          orderId: input.orderStringId,
          scannedBy: worker.workerID,
          scannedByName: worker.name,
          action: "balance_update",
          oldQty: input.oldQty,
          newQty: input.newQty,
        });
        return { success: true, workerName: worker.name };
      }),
    logQrScan: publicProcedure
      .input(z.object({
        orderId: z.string().min(1),
        scannedBy: z.string().min(1),   // workerID
        scannedByName: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const db = await (await import("./db")).getDb();
        if (!db) return { success: false };
        const { qrScanLog } = await import("../drizzle/schema");
        await db.insert(qrScanLog).values({
          orderId: input.orderId,
          scannedBy: input.scannedBy,
          scannedByName: input.scannedByName,
          action: "scan",
        });
        return { success: true };
      }),
    getQrScanHistory: publicProcedure
      .query(async () => {
        const db = await (await import("./db")).getDb();
        if (!db) return [];
        const { qrScanLog } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        return db.select().from(qrScanLog).orderBy(desc(qrScanLog.createdAt)).limit(200);
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
        if (!worker) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Employee ID" });
        if (worker.userLevel !== "1" && worker.userLevel !== "1.1") throw new TRPCError({ code: "FORBIDDEN", message: "Only Level 1 and Level 1.1 workers submit requests" });
        const insertedId = await createPendingRequest({
          type: input.type,
          orderId: input.orderId,
          orderSnapshot: input.orderSnapshot,
          requestedBy: input.requestedBy,
          workerName: worker.name,
          actionData: input.actionData,
        });
        // Level 1.1: auto process-approve immediately after submission (preview only, no stock deduction)
        // Actual stock deduction happens when Level 2 final-approves
        if (worker.userLevel === "1.1" && insertedId) {
          // Extract qty from actionData for used_update requests
          let selfProcessQty: number | undefined;
          if (input.type === "used_update" && input.actionData) {
            const action = JSON.parse(input.actionData);
            selfProcessQty = action.usedQty as number | undefined;
          }
          if (!selfProcessQty || selfProcessQty <= 0) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Please enter how many pcs you used from this order." });
          }
          // Just record the process-approval metadata, no stock changes
          await processApprovePendingRequest(insertedId, worker.name, selfProcessQty);
        }
        return { success: true, autoProcessApproved: worker.userLevel === "1.1" };
      }),
    list: publicProcedure
      .input(z.object({ status: z.enum(["under_review", "pending", "approved", "cancelled"]).optional() }))
      .query(async ({ input }) => {
        return getPendingRequests(input.status);
      }),
    review: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        reviewerWorkerID: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const reviewer = await getWorkerByWorkerID(input.reviewerWorkerID);
        if (!reviewer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Employee ID" });
        if (reviewer.userLevel !== "2") throw new TRPCError({ code: "FORBIDDEN", message: "Only Level 2 workers can review requests" });
        const req = await getPendingRequestById(input.id);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        if (req.status !== "under_review") throw new TRPCError({ code: "BAD_REQUEST", message: "Request is not under review" });
        await reviewPendingRequest(input.id, reviewer.name);
        return { success: true };
      }),
    getPendingUsedQty: publicProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const pendingUsedQty = await getPendingUsedQtyForOrder(input.orderId);
        return { pendingUsedQty };
      }),
    getInProcessQty: publicProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const inProcessQty = await getInProcessQtyForOrder(input.orderId);
        return { inProcessQty };
      }),
    approve: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        reviewerWorkerID: z.string().min(1),
        approvedQty: z.number().int().positive().optional(), // Level 2 can override qty
      }))
      .mutation(async ({ input }) => {
        const isAdmin = input.reviewerWorkerID === "ADMIN";
        let reviewerName = "Administrator";
        if (!isAdmin) {
          const reviewer = await getWorkerByWorkerID(input.reviewerWorkerID);
          if (!reviewer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Employee ID" });
          if (reviewer.userLevel !== "2") throw new TRPCError({ code: "FORBIDDEN", message: "Only Level 2 workers can approve requests" });
          reviewerName = reviewer.name;
        }
        const req = await getPendingRequestById(input.id);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        if (req.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Request is no longer pending" });

        let requestedQty: number | undefined;
        let finalApprovedQty: number | undefined;

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
          requestedQty = action.usedQty;
          // If Level 1.1 already process-approved (stock already deducted), skip stock deduction
          const alreadyProcessed = !!(req as { processApprovedBy?: string | null }).processApprovedBy;
          if (!alreadyProcessed) {
            // Level 1 direct path: Level 2 approves without Level 1.1 processing
            const usedQtyFinal = input.approvedQty ?? action.usedQty;
            finalApprovedQty = usedQtyFinal;
            const snapshot = JSON.parse(req.orderSnapshot);
            const newQty = Math.max(0, (snapshot.qty ?? action.newQty + action.usedQty) - usedQtyFinal);
            await logUsageHistory({
              jobNo: action.jobNo ?? null,
              usedQty: usedQtyFinal,
              orderID: action.orderID,
              fluteType: action.fluteType,
              bqComment: action.bqComment,
              purpose: action.purpose,
              masterCard: action.masterCard ?? null,
              boardSizeW: action.boardSizeW ?? null,
              boardSizeL: action.boardSizeL ?? null,
              scores: action.scores ?? null,
            });
            if (newQty === 0) {
              await updateOrderStatus(req.orderId, "out_of_stock");
            } else {
              const db = await (await import("./db")).getDb();
              if (db) {
                const { orders: ordersTable } = await import("../drizzle/schema");
                const { eq } = await import("drizzle-orm");
                await db.update(ordersTable).set({ qty: newQty }).where(eq(ordersTable.id, req.orderId));
              }
            }
          } else {
            // Level 1.1 already process-approved — Level 2 now deducts stock based on processApprovedQty
            const processApprovedQty = (req as { processApprovedQty?: number | null }).processApprovedQty ?? action.usedQty;
            finalApprovedQty = processApprovedQty;
            const snapshot = JSON.parse(req.orderSnapshot);
            const newQty = Math.max(0, snapshot.qty - processApprovedQty);
            await logUsageHistory({
              jobNo: action.jobNo ?? null,
              usedQty: processApprovedQty,
              orderID: action.orderID,
              fluteType: action.fluteType,
              bqComment: action.bqComment,
              purpose: action.purpose,
              masterCard: action.masterCard ?? null,
              boardSizeW: action.boardSizeW ?? null,
              boardSizeL: action.boardSizeL ?? null,
              scores: action.scores ?? null,
            });
            if (newQty === 0) {
              await updateOrderStatus(req.orderId, "out_of_stock");
            } else {
              const db = await (await import("./db")).getDb();
              if (db) {
                const { orders: ordersTable } = await import("../drizzle/schema");
                const { eq } = await import("drizzle-orm");
                await db.update(ordersTable).set({ qty: newQty }).where(eq(ordersTable.id, req.orderId));
              }
            }
          }
        }
        await updatePendingRequestStatus(input.id, "approved", reviewerName, { approvedQty: finalApprovedQty });
        // Log the action
        const snapshot = JSON.parse(req.orderSnapshot);
        await createApprovalActionLog({
          actionType: "approve",
          requestId: req.id,
          requestType: req.type,
          orderID: snapshot.orderID ?? "",
          requestedBy: req.workerName,
          reviewedBy: reviewerName,
          approvedQty: finalApprovedQty ?? null,
          requestedQty: requestedQty ?? null,
          cancelReason: null,
        });
        return { success: true };
      }),
    cancel: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        reviewerWorkerID: z.string().min(1),
        cancelReason: z.string().min(1, "Cancel reason is required").max(500),
      }))
      .mutation(async ({ input }) => {
        const isAdminCancel = input.reviewerWorkerID === "ADMIN";
        let cancellerName = "Administrator";
        if (!isAdminCancel) {
          const reviewer = await getWorkerByWorkerID(input.reviewerWorkerID);
          if (!reviewer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Employee ID" });
          const req2 = await getPendingRequestById(input.id);
          if (!req2) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
          if (req2.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Request is no longer pending" });
          // Level 1 can only cancel their own requests; Level 2 can cancel any
          if ((reviewer.userLevel === "1" || reviewer.userLevel === "1.1") && req2.requestedBy !== reviewer.workerID) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Level 1 users can only cancel their own requests" });
          }
          if (reviewer.userLevel !== "1" && reviewer.userLevel !== "1.1" && reviewer.userLevel !== "2") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
          }
          cancellerName = reviewer.name;
        }
        const req = await getPendingRequestById(input.id);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        if (req.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Request is no longer pending" });
        await updatePendingRequestStatus(input.id, "cancelled", cancellerName, { cancelReason: input.cancelReason });
        // Log the action (only for Level 2 cancels — Level 1 cancels their own request)
        const snapshot = JSON.parse(req.orderSnapshot);
        const action = req.actionData ? JSON.parse(req.actionData) : null;
        await createApprovalActionLog({
          actionType: "cancel",
          requestId: req.id,
          requestType: req.type,
          orderID: snapshot.orderID ?? "",
          requestedBy: req.workerName,
          reviewedBy: cancellerName,
          approvedQty: null,
          requestedQty: action?.usedQty ?? null,
          cancelReason: input.cancelReason,
        });
        return { success: true };
      }),
    processApprove: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        reviewerWorkerID: z.string().min(1),
        processApprovedQty: z.number().int().positive().optional(), // Level 1.1 optional qty override
      }))
      .mutation(async ({ input }) => {
        const reviewer = await getWorkerByWorkerID(input.reviewerWorkerID);
        if (!reviewer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Employee ID" });
        if (reviewer.userLevel !== "1.1" && reviewer.userLevel !== "2") throw new TRPCError({ code: "FORBIDDEN", message: "Only Level 1.1 and Level 2 workers can process-approve requests" });
        const req = await getPendingRequestById(input.id);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        if (req.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Request is no longer pending" });
        // Level 1.1 process-approve: validate qty but do NOT deduct stock (preview only)
        // Actual stock deduction happens when Level 2 final-approves
        const processQty = input.processApprovedQty;
        if (!processQty || processQty <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Please enter how many pcs you used from this order." });
        }
        // Just record the process-approval metadata, no stock changes
        await processApprovePendingRequest(input.id, reviewer.name, processQty);
        return { success: true };
      }),
    actionLog: publicProcedure
      .input(z.object({ limit: z.number().int().positive().max(200).default(100) }))
      .query(async ({ input }) => {
        return getApprovalActionLog(input.limit);
      }),
    toggleUrgent: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        workerID: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const worker = await getWorkerByWorkerID(input.workerID);
        if (!worker) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Employee ID" });
        if (worker.userLevel !== "1") throw new TRPCError({ code: "FORBIDDEN", message: "Only Level 1 workers can mark as urgent" });
        const req = await getPendingRequestById(input.id);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        if (req.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Request is no longer pending" });
        if (req.requestedBy !== input.workerID) throw new TRPCError({ code: "FORBIDDEN", message: "You can only mark your own requests as urgent" });
        const newUrgentStatus = await toggleUrgent(input.id);
        return { success: true, isUrgent: newUrgentStatus };
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
      const key = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "";
      return { publicKey: key };
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
    unsubscribe: publicProcedure
      .input(z.object({ workerID: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { removeSubscription } = await import("./push");
        await removeSubscription(input.workerID);
        return { success: true };
      }),
    sendToAll: publicProcedure
      .input(z.object({
        title: z.string(),
        body: z.string(),
        type: z.enum(["general", "approval", "order", "scanner", "system"]).optional(),
        url: z.string().optional(),
        tag: z.string().optional(),
        orderID: z.string().optional(),
        jobNo: z.string().optional(),
        requireInteraction: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const subs = await getAllSubscriptions();
        await sendPushNotification(subs, {
          title: input.title,
          body: input.body,
          tag: input.tag,
          type: input.type || "order",
          url: input.url || "/stock-history",
          requireInteraction: input.requireInteraction ?? true,
        });
        return { success: true };
      }),
    sendToWorkers: publicProcedure
      .input(z.object({
        workerIDs: z.array(z.string()),
        title: z.string(),
        body: z.string(),
        type: z.enum(["general", "approval", "order", "scanner", "system"]).optional(),
        url: z.string().optional(),
        tag: z.string().optional(),
        orderID: z.string().optional(),
        jobNo: z.string().optional(),
        requireInteraction: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const subs = await getSubscriptionsForWorkers(input.workerIDs);
        await sendPushNotification(subs, {
          title: input.title,
          body: input.body,
          tag: input.tag,
          type: input.type || "order",
          url: input.url || "/stock-history",
          requireInteraction: input.requireInteraction ?? true,
        });
        return { success: true };
      }),
    sendToLevel2: publicProcedure
      .input(z.object({
        title: z.string(),
        body: z.string(),
        type: z.enum(["general", "approval", "order", "scanner", "system"]).optional(),
        url: z.string().optional(),
        tag: z.string().optional(),
        requireInteraction: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const allWorkers = await (await import("./db")).getAllWorkers();
        const level2IDs = allWorkers.filter((w: { userLevel: string }) => w.userLevel === "2").map((w: { workerID: string }) => w.workerID);
        const subs = await getSubscriptionsForWorkers(level2IDs);
        await sendPushNotification(subs, {
          title: input.title,
          body: input.body,
          tag: input.tag,
          type: input.type || "order",
          url: input.url || "/stock-history",
          requireInteraction: input.requireInteraction ?? true,
        });
        return { success: true };
      }),
  }),

  // ─── In-App Notifications ──────────────────────────────────────────────────────────────────────────────────
  notifications: router({
    // Get recent notifications (last 50)
    list: publicProcedure.query(async () => {
      const { getRecentNotifications } = await import("./db");
      return await getRecentNotifications(50);
    }),

    // Create a new notification (called from frontend on events)
    create: publicProcedure
      .input(z.object({
        type: z.enum(["order_request", "order_approved", "order_cancelled", "order_in_process", "order_deleted", "out_of_stock", "new_order", "login", "system"]),
        title: z.string(),
        message: z.string(),
        orderID: z.string().optional(),
        productionOrder: z.string().optional(),
        jobNo: z.string().optional(),
        qty: z.number().optional(),
        fluteType: z.string().optional(),
        workerID: z.string().optional(),
        workerName: z.string().optional(),
        trackingId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createAppNotification } = await import("./db");
        await createAppNotification(input);
        return { success: true };
      }),

    // Mark notifications as read for a worker
    markRead: publicProcedure
      .input(z.object({
        workerID: z.string(),
        ids: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const { markNotificationsRead } = await import("./db");
        await markNotificationsRead(input.workerID, input.ids);
        return { success: true };
      }),

    // Get unread count for a worker
    unreadCount: publicProcedure
      .input(z.object({ workerID: z.string() }))
      .query(async ({ input }) => {
        const { getUnreadCount } = await import("./db");
        const count = await getUnreadCount(input.workerID);
        return { count };
      }),
  }),

  // ─── Announcements ─────────────────────────────────────────────────────────
  announcements: router({
    // Get all active (non-expired) announcements — public
    listActive: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { announcements } = await import("../drizzle/schema");
      const { and, eq, or, isNull, gt } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return [];
      const now = new Date();
      const rows = await db
        .select()
        .from(announcements)
        .where(
          and(
            eq(announcements.isActive, true),
            or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now))
          )
        )
        .orderBy(announcements.createdAt);
      return rows;
    }),
    // Admin: list all announcements (including inactive)
    listAll: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { announcements } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    }),
    // Admin: create a new announcement
    create: publicProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        message: z.string().min(1),
        type: z.enum(["info", "warning", "success", "error"]).default("info"),
        createdBy: z.string(),
        expiresAt: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { announcements } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(announcements).values({
          title: input.title,
          message: input.message,
          type: input.type,
          createdBy: input.createdBy,
          isActive: true,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        });
        return { success: true };
      }),
    // Admin: toggle active/inactive
    setActive: publicProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { announcements } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.update(announcements).set({ isActive: input.isActive }).where(eq(announcements.id, input.id));
        return { success: true };
      }),
    // Admin: delete announcement
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { announcements } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.delete(announcements).where(eq(announcements.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Direct Message Chat ────────────────────────────────────────────────────
  chat: router({
    // Get all conversations for the current worker
    getConversations: publicProcedure
      .input(z.object({ workerID: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { conversations, chatMessages, workers } = await import("../drizzle/schema");
        const { eq, or, desc, and, ne } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        const convs = await db.select().from(conversations)
          .where(or(eq(conversations.worker1ID, input.workerID), eq(conversations.worker2ID, input.workerID)))
          .orderBy(desc(conversations.lastMessageAt));
        // Enrich with other worker info and last message
        const enriched = await Promise.all(convs.map(async (conv) => {
          const otherID = conv.worker1ID === input.workerID ? conv.worker2ID : conv.worker1ID;
          const [other] = await db.select().from(workers).where(eq(workers.workerID, otherID)).limit(1);
          const [lastMsg] = await db.select().from(chatMessages)
            .where(eq(chatMessages.conversationID, conv.id))
            .orderBy(desc(chatMessages.createdAt)).limit(1);
          const unreadCount = await db.select().from(chatMessages)
            .where(and(eq(chatMessages.conversationID, conv.id), ne(chatMessages.senderID, input.workerID)))
            .then(rows => rows.filter(r => !r.readAt).length);
          return { ...conv, otherWorker: other || null, lastMessage: lastMsg || null, unreadCount };
        }));
        return enriched;
      }),

    // Get or create a DM conversation
    getOrCreate: publicProcedure
      .input(z.object({ workerID: z.string(), otherWorkerID: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { conversations } = await import("../drizzle/schema");
        const { eq, or, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const [existing] = await db.select().from(conversations)
          .where(or(
            and(eq(conversations.worker1ID, input.workerID), eq(conversations.worker2ID, input.otherWorkerID)),
            and(eq(conversations.worker1ID, input.otherWorkerID), eq(conversations.worker2ID, input.workerID))
          )).limit(1);
        if (existing) return existing;
        const [result] = await db.insert(conversations).values({
          worker1ID: input.workerID,
          worker2ID: input.otherWorkerID,
        }).$returningId();
        const [created] = await db.select().from(conversations).where(eq(conversations.id, result.id)).limit(1);
        return created;
      }),

    // Get messages for a conversation (latest 200)
    getMessages: publicProcedure
      .input(z.object({ conversationID: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { chatMessages } = await import("../drizzle/schema");
        const { eq, asc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        return db.select().from(chatMessages)
          .where(eq(chatMessages.conversationID, input.conversationID))
          .orderBy(asc(chatMessages.createdAt)).limit(200);
      }),

    // Send a DM
    sendMessage: publicProcedure
      .input(z.object({ conversationID: z.number(), senderID: z.string(), senderName: z.string().optional(), text: z.string().min(1).max(2000) }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { chatMessages, conversations, workers } = await import("../drizzle/schema");
        const { eq, or, and, ne } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(chatMessages).values({ conversationID: input.conversationID, senderID: input.senderID, text: input.text });
        await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, input.conversationID));
        // Push notification to recipient
        try {
          const [conv] = await db.select().from(conversations).where(eq(conversations.id, input.conversationID)).limit(1);
          if (conv) {
            const recipientID = conv.worker1ID === input.senderID ? conv.worker2ID : conv.worker1ID;
            const senderName = input.senderName || input.senderID;
            const preview = input.text.length > 60 ? input.text.slice(0, 57) + "..." : input.text;
            await sendPushToWorkers([recipientID], {
              title: `New message from ${senderName}`,
              body: preview,
              type: "general",
              url: "/chat",
              tag: `dm-${input.conversationID}`,
              requireInteraction: false,
            });
          }
        } catch (_) { /* non-critical */ }
        return { success: true };
      }),

    // Mark messages as read
    markRead: publicProcedure
      .input(z.object({ conversationID: z.number(), workerID: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { chatMessages } = await import("../drizzle/schema");
        const { eq, and, isNull, ne } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return { success: false };
        await db.update(chatMessages)
          .set({ readAt: new Date() })
          .where(and(eq(chatMessages.conversationID, input.conversationID), ne(chatMessages.senderID, input.workerID), isNull(chatMessages.readAt)));
        return { success: true };
      }),

    // Get total unread DM count for a worker
    getUnreadCount: publicProcedure
      .input(z.object({ workerID: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { chatMessages, conversations } = await import("../drizzle/schema");
        const { eq, or, and, isNull, ne } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return { count: 0 };
        const convs = await db.select().from(conversations)
          .where(or(eq(conversations.worker1ID, input.workerID), eq(conversations.worker2ID, input.workerID)));
        let total = 0;
        for (const conv of convs) {
          const unread = await db.select().from(chatMessages)
            .where(and(eq(chatMessages.conversationID, conv.id), ne(chatMessages.senderID, input.workerID), isNull(chatMessages.readAt)));
          total += unread.length;
        }
        return { count: total };
      }),

    // Get all workers (for new conversation picker)
    getWorkers: publicProcedure
      .input(z.object({ workerID: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { workers } = await import("../drizzle/schema");
        const { ne, asc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        return db.select().from(workers).where(ne(workers.workerID, input.workerID)).orderBy(asc(workers.name));
      }),
  }),

  // ─── Group Chat ─────────────────────────────────────────────────────────────
  groupChat: router({
    // Get all groups the worker is a member of
    getGroups: publicProcedure
      .input(z.object({ workerID: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { groupChats, groupMembers, groupMessages } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        const memberships = await db.select().from(groupMembers).where(eq(groupMembers.workerID, input.workerID));
        const groups = await Promise.all(memberships.map(async (m) => {
          const [group] = await db.select().from(groupChats).where(eq(groupChats.id, m.groupID)).limit(1);
          if (!group) return null;
          const members = await db.select().from(groupMembers).where(eq(groupMembers.groupID, group.id));
          const [lastMsg] = await db.select().from(groupMessages)
            .where(eq(groupMessages.groupID, group.id))
            .orderBy(desc(groupMessages.createdAt)).limit(1);
          return { ...group, memberCount: members.length, memberIDs: members.map(x => x.workerID), lastMessage: lastMsg || null };
        }));
        return groups.filter(Boolean).sort((a, b) => new Date(b!.lastMessageAt).getTime() - new Date(a!.lastMessageAt).getTime());
      }),

    // Create a group (max 10 members including creator)
    create: publicProcedure
      .input(z.object({ name: z.string().min(1).max(128), createdBy: z.string(), memberIDs: z.array(z.string()).min(1).max(9) }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { groupChats, groupMembers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const [result] = await db.insert(groupChats).values({ name: input.name, createdBy: input.createdBy }).$returningId();
        const allMembers = [input.createdBy, ...input.memberIDs.filter(id => id !== input.createdBy)];
        await db.insert(groupMembers).values(allMembers.map(workerID => ({ groupID: result.id, workerID })));
        const [group] = await db.select().from(groupChats).where(eq(groupChats.id, result.id)).limit(1);
        return group;
      }),

    // Get messages for a group (latest 200)
    getMessages: publicProcedure
      .input(z.object({ groupID: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { groupMessages } = await import("../drizzle/schema");
        const { eq, asc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        return db.select().from(groupMessages)
          .where(eq(groupMessages.groupID, input.groupID))
          .orderBy(asc(groupMessages.createdAt)).limit(200);
      }),

    // Send a group message
    sendMessage: publicProcedure
      .input(z.object({ groupID: z.number(), senderID: z.string(), senderName: z.string(), text: z.string().min(1).max(2000) }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { groupMessages, groupChats, groupMembers } = await import("../drizzle/schema");
        const { eq, ne } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(groupMessages).values({ groupID: input.groupID, senderID: input.senderID, senderName: input.senderName, text: input.text });
        await db.update(groupChats).set({ lastMessageAt: new Date() }).where(eq(groupChats.id, input.groupID));
        // Push notification to all group members except sender
        try {
          const [group] = await db.select().from(groupChats).where(eq(groupChats.id, input.groupID)).limit(1);
          const members = await db.select().from(groupMembers)
            .where(eq(groupMembers.groupID, input.groupID));
          const recipientIDs = members.map(m => m.workerID).filter(id => id !== input.senderID);
          if (recipientIDs.length > 0 && group) {
            const preview = input.text.length > 60 ? input.text.slice(0, 57) + "..." : input.text;
            await sendPushToWorkers(recipientIDs, {
              title: `${input.senderName} in ${group.name}`,
              body: preview,
              type: "general",
              url: "/chat",
              tag: `group-${input.groupID}`,
              requireInteraction: false,
            });
          }
        } catch (_) { /* non-critical */ }
        return { success: true };
      }),

    // Mark group messages as read by a worker
    markGroupRead: publicProcedure
      .input(z.object({ groupID: z.number(), workerID: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { groupMessages, groupMessageReads } = await import("../drizzle/schema");
        const { eq, and, notInArray } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return { success: false };
        // Get all messages in group
        const msgs = await db.select({ id: groupMessages.id }).from(groupMessages)
          .where(eq(groupMessages.groupID, input.groupID));
        if (msgs.length === 0) return { success: true };
        // Find which ones this worker hasn't read yet
        const alreadyRead = await db.select({ groupMessageID: groupMessageReads.groupMessageID })
          .from(groupMessageReads)
          .where(and(eq(groupMessageReads.workerID, input.workerID)));
        const readSet = new Set(alreadyRead.map(r => r.groupMessageID));
        const toInsert = msgs.filter(m => !readSet.has(m.id)).map(m => ({ groupMessageID: m.id, workerID: input.workerID }));
        if (toInsert.length > 0) {
          await db.insert(groupMessageReads).values(toInsert);
        }
        return { success: true };
      }),

    // Get unread group message count for a worker
    getGroupUnreadCount: publicProcedure
      .input(z.object({ workerID: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { groupMembers, groupMessages, groupMessageReads } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return { count: 0 };
        const memberships = await db.select().from(groupMembers).where(eq(groupMembers.workerID, input.workerID));
        let total = 0;
        for (const m of memberships) {
          const msgs = await db.select({ id: groupMessages.id }).from(groupMessages)
            .where(eq(groupMessages.groupID, m.groupID));
          const readRows = await db.select({ groupMessageID: groupMessageReads.groupMessageID })
            .from(groupMessageReads)
            .where(and(eq(groupMessageReads.workerID, input.workerID)));
          const readSet = new Set(readRows.map(r => r.groupMessageID));
          total += msgs.filter(msg => !readSet.has(msg.id)).length;
        }
        return { count: total };
      }),

    // Get members of a group
    getMembers: publicProcedure
      .input(z.object({ groupID: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { groupMembers, workers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        const members = await db.select().from(groupMembers).where(eq(groupMembers.groupID, input.groupID));
        const enriched = await Promise.all(members.map(async (m) => {
          const [worker] = await db.select().from(workers).where(eq(workers.workerID, m.workerID)).limit(1);
          return { ...m, worker: worker || null };
        }));
        return enriched;
      }),

    // Leave a group
    leave: publicProcedure
      .input(z.object({ groupID: z.number(), workerID: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { groupMembers } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.delete(groupMembers).where(and(eq(groupMembers.groupID, input.groupID), eq(groupMembers.workerID, input.workerID)));
        return { success: true };
      }),
  }),

  // ─── Message Reactions ──────────────────────────────────────────────────────
  reactions: router({
    // Add or toggle a reaction (if same emoji already exists, remove it)
    toggle: publicProcedure
      .input(z.object({ messageType: z.enum(["dm", "group"]), messageID: z.number(), workerID: z.string(), emoji: z.string().max(8) }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { messageReactions } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const [existing] = await db.select().from(messageReactions)
          .where(and(
            eq(messageReactions.messageType, input.messageType),
            eq(messageReactions.messageID, input.messageID),
            eq(messageReactions.workerID, input.workerID),
            eq(messageReactions.emoji, input.emoji)
          )).limit(1);
        if (existing) {
          await db.delete(messageReactions).where(eq(messageReactions.id, existing.id));
          return { action: "removed" };
        } else {
          await db.insert(messageReactions).values({ messageType: input.messageType, messageID: input.messageID, workerID: input.workerID, emoji: input.emoji });
          return { action: "added" };
        }
      }),

    // Get reactions for a list of message IDs
    getForMessages: publicProcedure
      .input(z.object({ messageType: z.enum(["dm", "group"]), messageIDs: z.array(z.number()) }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { messageReactions } = await import("../drizzle/schema");
        const { eq, and, inArray } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        if (input.messageIDs.length === 0) return [];
        return db.select().from(messageReactions)
          .where(and(
            eq(messageReactions.messageType, input.messageType),
            inArray(messageReactions.messageID, input.messageIDs)
          ));
      }),
  }),
});
export type AppRouter = typeof appRouter
