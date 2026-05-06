import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw, Trash2, Zap, Info, AlertTriangle, PlayCircle } from "lucide-react";
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
  processApprovedBy: string | null;
  processApprovedQty: number | null;
  processApprovedAt: Date | null;
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
  masterCard?: string | null;
  boardSizeW?: number | null;
  boardSizeL?: number | null;
  scores?: string | null;
};

function RequestCard({
  req,
  onApprove,
  onCancel,
  onProcessApprove,
  isProcessing,
  canApprove,
  canCancel,
  canProcessApprove,
}: {
  req: PendingRequest;
  onApprove: (id: number, approvedQty?: number) => void;
  onCancel: (id: number, reason: string) => void;
  onProcessApprove: (id: number, processApprovedQty?: number) => void;
  isProcessing: boolean;
  canApprove: boolean;
  canCancel: boolean;
  canProcessApprove: boolean;
}) {
  // Cancel reason dialog state (local to card)
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReasonLocal, setCancelReasonLocal] = useState("");
  // Approve with qty dialog state (local to card)
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvedQtyLocal, setApprovedQtyLocal] = useState("");
  // Process Approve dialog state (local to card)
  const [showProcessApproveDialog, setShowProcessApproveDialog] = useState(false);
  const [processApprovedQtyLocal, setProcessApprovedQtyLocal] = useState("");

  let snapshot: OrderSnapshot | null = null;
  let action: ActionData | null = null;
  try { snapshot = JSON.parse(req.orderSnapshot); } catch { /* ignore */ }
  try { if (req.actionData) action = JSON.parse(req.actionData); } catch { /* ignore */ }

  const isDelete = req.type === "delete";
  const isPending = req.status === "pending";
  const isProcessApproved = !!req.processApprovedBy;

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
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
            req.status === "pending" ? "bg-orange-100 text-orange-700" :
            req.status === "approved" ? "bg-green-100 text-green-700" :
            "bg-gray-200 text-gray-600"
          }`}>
            {req.status === "pending" ? "Pending" : req.status === "approved" ? "Approved" : "Cancelled"}
          </span>
          {/* Process Approved badge */}
          {isProcessApproved && req.status === "pending" && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700 flex-shrink-0">
              In Process
            </span>
          )}
        </div>
      </div>

      {/* Process Approved info */}
      {isProcessApproved && req.status === "pending" && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 flex items-start gap-2">
          <PlayCircle size={13} className="text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-purple-700">
            <span className="font-semibold">Process Approved</span> by {req.processApprovedBy}
            {req.processApprovedQty && <span> · Qty: {req.processApprovedQty} pcs</span>}
            {req.processApprovedAt && <span> · {new Date(req.processApprovedAt).toLocaleString()}</span>}
          </div>
        </div>
      )}

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
          {/* Extra fields: MasterCard, Board Size, Scores */}
          {action.purpose === "job" && (
            <>
              {action.masterCard && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Master Card</span>
                  <span className="text-xs font-mono font-semibold">{action.masterCard}</span>
                </div>
              )}
              {(action.boardSizeW || action.boardSizeL) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Board Size</span>
                  <span className="text-xs font-mono">{action.boardSizeW ?? "—"}×{action.boardSizeL ?? "—"} mm</span>
                </div>
              )}
              {action.scores && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Scores</span>
                  <span className="text-xs font-mono">{action.scores}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground">
        Requested: {new Date(req.createdAt).toLocaleString()}
        {req.reviewedBy && ` · Reviewed by ${req.reviewedBy}`}
      </p>

      {/* Actions */}
      {isPending && (canCancel || canApprove || canProcessApprove) && (
        <div className="flex gap-2 pt-1 flex-wrap">
          {canCancel && (
            <button
              onClick={() => { setShowCancelDialog(true); setCancelReasonLocal(""); }}
              disabled={isProcessing}
              className="flex-1 min-w-[80px] border border-border rounded-lg py-2.5 text-sm font-semibold text-muted-foreground hover:bg-gray-50 hover:text-destructive transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <XCircle size={14} /> Cancel
            </button>
          )}
          {canProcessApprove && !isProcessApproved && (
            <button
              onClick={() => { setShowProcessApproveDialog(true); setProcessApprovedQtyLocal(""); }}
              disabled={isProcessing}
              className="flex-1 min-w-[80px] bg-purple-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
              Process
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => { setShowApproveDialog(true); setApprovedQtyLocal(action?.usedQty ? String(action.usedQty) : ""); }}
              disabled={isProcessing}
              className="flex-1 min-w-[80px] bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Approve
            </button>
          )}
        </div>
      )}

      {/* Process Approve Dialog */}
      {showProcessApproveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <PlayCircle size={20} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Approve Request (process approved request)</h3>
              </div>
              {!isDelete && action && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Requested Qty: <strong>{action.usedQty} pcs</strong></p>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Approved Qty (optional — leave blank to use requested)</label>
                  <input
                    type="number"
                    min={1}
                    value={processApprovedQtyLocal}
                    onChange={e => setProcessApprovedQtyLocal(e.target.value)}
                    placeholder={String(action.usedQty)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              )}
              {isDelete && <p className="text-sm text-gray-600 mb-4">Mark this delete request as currently being processed. Level 2 must still give final approval.</p>}
              <p className="text-xs text-purple-700 bg-purple-50 rounded-lg p-2 mb-4">
                This marks the request as "In Process". Level 2 must still give final Approve or Cancel.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowProcessApproveDialog(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button
                  onClick={() => { const pq = processApprovedQtyLocal ? parseInt(processApprovedQtyLocal) : undefined; setShowProcessApproveDialog(false); onProcessApprove(req.id, pq); }}
                  className="flex-1 bg-purple-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-purple-700"
                >Confirm Process</button>
              </div>
            </div>
          </div>
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
  const [jobNoSearch, setJobNoSearch] = useState("");

  const userLevel = worker?.userLevel ?? "2";
  const canApprove = userLevel === "2";
  const canProcessApprove = userLevel === "1.1";
  const isLevel1 = userLevel === "1";

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
  const processApproveMutation = trpc.pendingRequests.processApprove.useMutation();

  const allRequests = (requestsQuery.data ?? []) as unknown as PendingRequest[];
  
  // Filter by Job No when "All" tab is selected
  const requests = useMemo(() => {
    if (statusFilter !== undefined || !jobNoSearch.trim()) return allRequests;
    
    return allRequests.filter(req => {
      if (req.type !== "used_update") return true; // Show all delete requests
      try {
        const action = JSON.parse(req.actionData || "{}") as ActionData;
        if (!action.jobNo) return true; // Show if no job no
        return action.jobNo.toLowerCase().includes(jobNoSearch.toLowerCase());
      } catch {
        return true;
      }
    });
  }, [allRequests, statusFilter, jobNoSearch]);

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

  const handleProcessApprove = async (id: number, processApprovedQty?: number) => {
    if (!worker || !canProcessApprove) return;
    setProcessingId(id);
    try {
      await processApproveMutation.mutateAsync({ id, reviewerWorkerID: worker.workerID, processApprovedQty });
      toast.success("Request marked as In Process. Level 2 will give final approval.");
      utils.pendingRequests.list.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to process-approve request.");
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
                : canProcessApprove
                ? "View requests and mark them as In Process"
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

        {/* Level info banner */}
        {isLevel1 && (
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <Info size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700">
              You are a <strong>Level 1</strong> user. You can view all pending requests and cancel your own. Only Level 2 users can approve requests.
            </p>
          </div>
        )}
        {canProcessApprove && (
          <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <Info size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-purple-700">
              You are a <strong>Level 1.1</strong> user. You can mark Level 1 requests as <strong>In Process</strong> (currently being processed). Level 2 must still give final Approve or Cancel.
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
                  onClick={() => { setStatusFilter(key); setJobNoSearch(""); }}
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
            
            {/* Job No search when All tab is selected */}
            {statusFilter === undefined && (
              <div className="relative w-full mb-4 max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search Job No..."
                  value={jobNoSearch}
                  onChange={e => setJobNoSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

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
                <p className="text-sm text-muted-foreground">
                  {jobNoSearch ? `No requests found for Job No "${jobNoSearch}"` : `No ${statusFilter ?? ""} requests found`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    onApprove={handleApprove}
                    onCancel={handleCancel}
                    onProcessApprove={handleProcessApprove}
                    isProcessing={processingId === req.id}
                    canApprove={canApprove}
                    canCancel={canApprove || canProcessApprove || req.requestedBy === worker?.workerID}
                    canProcessApprove={canProcessApprove}
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
                    log.actionType;
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
