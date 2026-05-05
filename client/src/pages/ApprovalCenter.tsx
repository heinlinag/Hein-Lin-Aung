import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw, Trash2, Zap, Info, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNotificationSound } from "@/hooks/useNotificationSound";

type PendingRequest = {
  id: number;
  type: "delete" | "used_update";
  orderId: number;
  orderSnapshot: string;
  requestedBy: string;
  workerName: string;
  actionData: string | null;
  status: "pending" | "approved" | "cancelled";
  reviewedBy: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

type OrderSnapshot = {
  orderID: string;
  fluteType: string;
  sizeW: number;
  sizeL: number;
  qty: number;
  bqComment: string;
};

type ActionData = {
  jobNo: string | null;
  usedQty: number;
  purpose: "job" | "old_stock";
  newQty: number;
};

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClassName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              No, Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors ${confirmClassName}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestCard({
  req,
  onApprove,
  onCancel,
  isProcessing,
  canApprove,
  canCancel,
}: {
  req: PendingRequest;
  onApprove: (id: number, approvedQty?: number) => void;
  onCancel: (id: number, reason: string) => void;
  isProcessing: boolean;
  canApprove: boolean;
  canCancel: boolean;
}) {
  // Cancel reason dialog state (local to card)
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReasonLocal, setCancelReasonLocal] = useState("");
  // Approve with qty dialog state (local to card)
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvedQtyLocal, setApprovedQtyLocal] = useState("");

  let snapshot: OrderSnapshot | null = null;
  let action: ActionData | null = null;
  try { snapshot = JSON.parse(req.orderSnapshot); } catch { /* ignore */ }
  try { if (req.actionData) action = JSON.parse(req.actionData); } catch { /* ignore */ }

  const isDelete = req.type === "delete";
  const isPending = req.status === "pending";

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${
      req.status === "approved" ? "bg-green-50 border-green-200" :
      req.status === "cancelled" ? "bg-gray-50 border-gray-200 opacity-70" :
      "bg-white border-border shadow-sm"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDelete ? "bg-red-100" : "bg-blue-100"}`}>
            {isDelete ? <Trash2 size={14} className="text-red-600" /> : <Zap size={14} className="text-blue-600" />}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {isDelete ? "Delete Request" : "Used Update Request"}
            </p>
            <p className="text-xs text-muted-foreground">
              by <span className="font-semibold">{req.workerName}</span> ({req.requestedBy})
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
          req.status === "pending" ? "bg-orange-100 text-orange-700" :
          req.status === "approved" ? "bg-green-100 text-green-700" :
          "bg-gray-200 text-gray-600"
        }`}>
          {req.status === "pending" ? "Pending" : req.status === "approved" ? "Approved" : "Cancelled"}
        </span>
      </div>

      {/* Order info */}
      {snapshot && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Order ID</span>
            <span className="text-sm font-bold text-primary">{snapshot.orderID}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Flute Type</span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Flute : {snapshot.fluteType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Size</span>
            <span className="text-xs font-mono">{snapshot.sizeW}×{snapshot.sizeL} mm</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current Qty</span>
            <span className="text-sm font-semibold">{snapshot.qty} pcs</span>
          </div>
        </div>
      )}

      {/* Action details for used_update */}
      {!isDelete && action && (
        <div className={`rounded-lg p-3 space-y-1.5 ${action.purpose === "old_stock" ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}>
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            {action.purpose === "old_stock" ? "Old Stock Clear" : "Job Usage"}
          </p>
          {action.jobNo && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Job No</span>
              <span className="text-xs font-mono font-bold">{action.jobNo}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Used Qty</span>
            <span className="text-sm font-semibold text-destructive">-{action.usedQty} pcs</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Remaining After</span>
            <span className="text-sm font-semibold text-green-700">{action.newQty} pcs</span>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground">
        Requested: {new Date(req.createdAt).toLocaleString()}
        {req.reviewedBy && ` · Reviewed by ${req.reviewedBy}`}
      </p>

      {/* Actions */}
      {isPending && (canCancel || canApprove) && (
        <div className="flex gap-2 pt-1">
          {canCancel && (
            <button
              onClick={() => { setShowCancelDialog(true); setCancelReasonLocal(""); }}
              disabled={isProcessing}
              className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-muted-foreground hover:bg-gray-50 hover:text-destructive transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <XCircle size={14} /> Cancel
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => { setShowApproveDialog(true); setApprovedQtyLocal(action?.usedQty ? String(action.usedQty) : ""); }}
              disabled={isProcessing}
              className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Approve
            </button>
          )}
        </div>
      )}

      {/* Approve with Qty Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Approve Request</h3>
              </div>
              {!isDelete && action && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Requested Qty: <strong>{action.usedQty} pcs</strong></p>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Approved Qty (optional — leave blank to use requested)</label>
                  <input
                    type="number"
                    min={1}
                    value={approvedQtyLocal}
                    onChange={e => setApprovedQtyLocal(e.target.value)}
                    placeholder={String(action.usedQty)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
              )}
              {isDelete && <p className="text-sm text-gray-600 mb-4">Are you sure you want to approve this delete request? This action cannot be undone.</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowApproveDialog(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button
                  onClick={() => { const aq = approvedQtyLocal ? parseInt(approvedQtyLocal) : undefined; setShowApproveDialog(false); onApprove(req.id, aq); }}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700"
                >Confirm Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel with Reason Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Cancel Request</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">Please provide a reason for cancelling this request.</p>
              <textarea
                value={cancelReasonLocal}
                onChange={e => setCancelReasonLocal(e.target.value)}
                placeholder="Enter cancel reason..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCancelDialog(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button
                  onClick={() => { if (!cancelReasonLocal.trim()) return; setShowCancelDialog(false); onCancel(req.id, cancelReasonLocal.trim()); }}
                  disabled={!cancelReasonLocal.trim()}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >Confirm Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApprovalCenter() {
  const { worker } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "cancelled" | undefined>("pending");
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  const [processingId, setProcessingId] = useState<number | null>(null);
  // Cancel reason dialog
  const [cancelDialog, setCancelDialog] = useState<{ id: number } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  // Approve with qty dialog
  const [approveDialog, setApproveDialog] = useState<{ id: number; requestedQty: number | null; isDelete: boolean } | null>(null);
  const [approvedQtyInput, setApprovedQtyInput] = useState("");

  const userLevel = worker?.userLevel ?? "2";
  const canApprove = userLevel === "2";

  const requestsQuery = trpc.pendingRequests.list.useQuery(
    { status: statusFilter },
    { refetchInterval: 10000 }
  );
  const actionLogQuery = trpc.pendingRequests.actionLog.useQuery(
    { limit: 100 },
    { enabled: activeTab === "history" }
  );
  const utils = trpc.useUtils();
  const approveMutation = trpc.pendingRequests.approve.useMutation();
  const cancelMutation = trpc.pendingRequests.cancel.useMutation();

  const requests = (requestsQuery.data ?? []) as unknown as PendingRequest[];

  // Notification sound when new pending requests arrive
  const { playChime } = useNotificationSound();
  const prevPendingCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (statusFilter !== "pending") return;
    const currentCount = requests.filter(r => r.status === "pending").length;
    if (prevPendingCountRef.current !== null && currentCount > prevPendingCountRef.current) {
      playChime();
      toast.info(`${currentCount - prevPendingCountRef.current} new pending request(s) arrived.`);
    }
    prevPendingCountRef.current = currentCount;
  }, [requests, statusFilter]);

  const handleApprove = async (id: number, approvedQty?: number) => {
    if (!worker || !canApprove) return;
    setProcessingId(id);
    try {
      await approveMutation.mutateAsync({ id, reviewerWorkerID: worker.workerID, approvedQty });
      toast.success("Request approved and action executed.");
      utils.pendingRequests.list.invalidate();
      utils.orders.list.invalidate();
      if (activeTab === "history") utils.pendingRequests.actionLog.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to approve request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id: number, reason: string) => {
    if (!worker) return;
    setProcessingId(id);
    try {
      await cancelMutation.mutateAsync({ id, reviewerWorkerID: worker.workerID, cancelReason: reason });
      toast.success("Request cancelled. No changes made.");
      utils.pendingRequests.list.invalidate();
      if (activeTab === "history") utils.pendingRequests.actionLog.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to cancel request.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = statusFilter === "pending" ? requests.length : undefined;

  return (
    <AppLayout pageTitle="Approval Center">
      <main className="container lg:max-w-none lg:px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Approval Center</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {canApprove
                ? "Review and approve Level 1 worker requests"
                : "View your submitted requests"}
            </p>
          </div>
          <button
            onClick={() => utils.pendingRequests.list.invalidate()}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Level 1 info banner */}
        {!canApprove && (
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <Info size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700">
              You are a <strong>Level 1</strong> user. You can view all pending requests and cancel your own. Only Level 2 users can approve requests.
            </p>
          </div>
        )}

        {/* Main tab: Requests / History */}
        <div className="flex gap-1 mb-4 border-b border-border">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "requests" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Requests
            {pendingCount !== undefined && pendingCount > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Action History
          </button>
        </div>

        {activeTab === "requests" && (
          <>
            {/* Status filter sub-tabs */}
            <div className="flex gap-1 mb-5">
              {([
                { key: "pending" as const, label: "Pending" },
                { key: "approved" as const, label: "Approved" },
                { key: "cancelled" as const, label: "Cancelled" },
                { key: undefined, label: "All" },
              ]).map(({ key, label }) => (
                <button
                  key={label}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    statusFilter === key
                      ? key === "pending" ? "bg-orange-500 text-white" : key === "approved" ? "bg-green-600 text-white" : key === "cancelled" ? "bg-gray-500 text-white" : "bg-primary text-white"
                      : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {requestsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Clock size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">No {statusFilter ?? ""} requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    onApprove={handleApprove}
                    onCancel={handleCancel}
                    isProcessing={processingId === req.id}
                    canApprove={canApprove}
                    canCancel={canApprove || req.requestedBy === worker?.workerID}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            {actionLogQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : !actionLogQuery.data || actionLogQuery.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Clock size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">No action history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(actionLogQuery.data as unknown as Array<{id:number;actionType:string;requestId:number;requestType:"delete"|"used_update";orderID:string;requestedBy:string;reviewedBy:string;approvedQty:number|null;requestedQty:number|null;cancelReason:string|null;details:string|null;createdAt:Date}>).map(log => {
                  const isDirect = log.actionType.startsWith("direct_");
                  const isApprove = log.actionType === "approve";
                  const isCancel = log.actionType === "cancel";
                  const iconBg = isApprove ? "bg-green-100" : isCancel ? "bg-red-100" : "bg-blue-100";
                  const iconColor = isApprove ? "text-green-600" : isCancel ? "text-red-600" : "text-blue-600";
                  const actionLabel = isApprove ? "Approved Request" : isCancel ? "Cancelled Request" :
                    log.actionType === "direct_used_update" ? "Direct: Used Update" :
                    log.actionType === "direct_old_stock" ? "Direct: Old Stock Clear" :
                    log.actionType === "direct_delete" ? "Direct: Deleted Order" :
                    log.actionType.replace(/_/g, " ");
                  return (
                    <div key={log.id} className="border border-border rounded-xl p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                            {isApprove ? <CheckCircle2 size={13} className={iconColor} /> : isCancel ? <XCircle size={13} className={iconColor} /> : <Zap size={13} className={iconColor} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{actionLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              Order <strong>{log.orderID}</strong>
                              {isDirect ? ` · By ${log.reviewedBy}` : ` · Requested by ${log.requestedBy} · Reviewed by ${log.reviewedBy}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-2 bg-gray-50 rounded-lg p-2">{log.details}</p>
                      )}
                      {isApprove && log.approvedQty !== null && log.requestedQty !== null && log.approvedQty !== log.requestedQty && (
                        <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg p-2">Qty adjusted: {log.requestedQty} → {log.approvedQty} pcs</p>
                      )}
                      {isCancel && log.cancelReason && (
                        <p className="text-xs text-muted-foreground mt-2 bg-gray-50 rounded-lg p-2">Cancel reason: {log.cancelReason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </AppLayout>
  );
}
