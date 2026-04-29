import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw, Trash2, Zap, Info } from "lucide-react";
import PageHeader from "@/components/PageHeader";

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

function RequestCard({
  req,
  onApprove,
  onCancel,
  isProcessing,
  canApprove,
  canCancel,
}: {
  req: PendingRequest;
  onApprove: (id: number) => void;
  onCancel: (id: number) => void;
  isProcessing: boolean;
  canApprove: boolean;
  canCancel: boolean;
}) {
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
              onClick={() => onCancel(req.id)}
              disabled={isProcessing}
              className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-muted-foreground hover:bg-gray-50 hover:text-destructive transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <XCircle size={14} /> Cancel
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => onApprove(req.id)}
              disabled={isProcessing}
              className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Approve
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalCenter() {
  const { worker } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "cancelled" | undefined>("pending");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const userLevel = worker?.userLevel ?? "2";
  const canApprove = userLevel === "2";

  const requestsQuery = trpc.pendingRequests.list.useQuery(
    { status: statusFilter },
    { refetchInterval: 15000 }
  );
  const utils = trpc.useUtils();
  const approveMutation = trpc.pendingRequests.approve.useMutation();
  const cancelMutation = trpc.pendingRequests.cancel.useMutation();

  const requests = (requestsQuery.data ?? []) as unknown as PendingRequest[];

  const handleApprove = async (id: number) => {
    if (!worker || !canApprove) return;
    setProcessingId(id);
    try {
      await approveMutation.mutateAsync({ id, reviewerWorkerID: worker.workerID });
      toast.success("Request approved and action executed.");
      utils.pendingRequests.list.invalidate();
      utils.orders.list.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to approve request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!worker) return;
    setProcessingId(id);
    try {
      await cancelMutation.mutateAsync({ id, reviewerWorkerID: worker.workerID });
      toast.success("Request cancelled. No changes made.");
      utils.pendingRequests.list.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to cancel request.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = statusFilter === "pending" ? requests.length : undefined;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader showBack backHref="/" />

      <main className="container py-5">
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

        {/* Status filter tabs */}
        <div className="flex gap-1 mb-5 border-b border-border">
          {([
            { key: "pending" as const, label: "Pending" },
            { key: "approved" as const, label: "Approved" },
            { key: "cancelled" as const, label: "Cancelled" },
            { key: undefined, label: "All" },
          ]).map(({ key, label }) => (
            <button
              key={label}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${statusFilter === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {label}
              {key === "pending" && pendingCount !== undefined && pendingCount > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
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
      </main>
    </div>
  );
}
