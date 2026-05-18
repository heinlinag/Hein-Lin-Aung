import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, RefreshCw, Trash2, Loader2, Package, Zap, X, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import AppLayout from "@/components/AppLayout";
import { A4Label } from "@/components/A4Label";

const LOW_STOCK_THRESHOLD = 50;

type Order = {
  id: number; orderID: string; trackingId?: string; fluteType: string; sizeW: number; sizeL: number;
  qty: number; bqComment: string; status: "current" | "out_of_stock";
  submittedBy: string | null; createdAt: Date;
};

// ─── Used Update Dialog (Level 2: direct action) ───────────────────────────────
function UsedUpdateDialog({ order, onClose, onSuccess }: {
  order: Order; onClose: () => void; onSuccess: () => void;
}) {
  const [step, setStep] = useState<"choose" | "job" | "old_stock">("choose");
  const [jobNo, setJobNo] = useState("");
  const [useQty, setUseQty] = useState("");
  const [jobError, setJobError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [showOldConfirm, setShowOldConfirm] = useState(false);
  const [showJobConfirm, setShowJobConfirm] = useState(false);
  const [masterCard, setMasterCard] = useState("");
  const [boardSizeW, setBoardSizeW] = useState("");
  const [boardSizeL, setBoardSizeL] = useState("");
  const [scores, setScores] = useState("");
  const logUsage = trpc.orders.logUsage.useMutation();
  const notifyAll = trpc.push.sendToAll.useMutation();
  const utils = trpc.useUtils();
  const inProcessQtyQuery = trpc.pendingRequests.getInProcessQty.useQuery({ orderId: order.id });
  const inProcessQty = inProcessQtyQuery.data?.inProcessQty ?? 0;
  const pendingRequestsQuery = trpc.pendingRequests.list.useQuery({ status: "pending" });
  const pendingRequestsForOrder = (pendingRequestsQuery.data ?? []).filter((req: any) => req.orderID === order.orderID);
  const pendingRequestCount = pendingRequestsForOrder.length;
  const availableQty = remaining !== null ? remaining : order.qty;

  const handleJobSubmit = async () => {
    setJobError("");
    if (!/^\d{8}$/.test(jobNo)) { setJobError("Job No must be exactly 8 digits (e.g. 02123456)."); return; }
    if (!masterCard.trim()) { setJobError("MasterCard is required."); return; }
    if (!boardSizeW || !boardSizeL) { setJobError("Board Size (W × L) is required."); return; }
    const qty = parseInt(useQty);
    if (!qty || qty <= 0) { setJobError("Enter a valid quantity."); return; }
    if (qty > availableQty) { setJobError(`Cannot exceed available quantity (${availableQty} pcs).`); return; }
    const newQty = availableQty - qty;
    try {
      await logUsage.mutateAsync({ jobNo, usedQty: qty, orderID: order.orderID, fluteType: order.fluteType, bqComment: order.bqComment, purpose: "job", orderId: order.id, newQty, masterCard: masterCard || null, boardSizeW: boardSizeW ? parseInt(boardSizeW) : null, boardSizeL: boardSizeL ? parseInt(boardSizeL) : null, scores: scores || null });
      toast.success(`Used ${qty} pcs for Job ${jobNo}. Remaining: ${newQty} pcs.`);
      notifyAll.mutate({
        title: "⚡ Stock Used (Job No)",
        body: `Order ${order.orderID}: ${qty} pcs used for Job ${jobNo}. Remaining: ${newQty} pcs.`,
        tag: "used-update"
      });
      setRemaining(newQty);
      setJobNo(""); setUseQty(""); setMasterCard(""); setBoardSizeW(""); setBoardSizeL(""); setScores("");
      utils.orders.list.invalidate();
      utils.orders.getUsage.invalidate();
      if (newQty === 0) onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setJobError(e?.message ?? "Failed to log usage.");
    }
  };

  const handleOldStockSubmit = async () => {
    try {
      await logUsage.mutateAsync({ jobNo: null, usedQty: order.qty, orderID: order.orderID, fluteType: order.fluteType, bqComment: order.bqComment, purpose: "old_stock", orderId: order.id, newQty: 0 });
      toast.success("Order cleared and moved to Out of Stock.");
      notifyAll.mutate({
        title: "📦 Old Stock Cleared",
        body: `Order ${order.orderID} (${order.qty} pcs) has been cleared and moved to Out of Stock.`,
        tag: "used-update"
      });
      utils.orders.list.invalidate();
      utils.orders.getUsage.invalidate();
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to clear order.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex-1">
            <h3 className="font-bold text-foreground mb-2">Purchase Order</h3>
            <div className="space-y-1 text-xs">
              <p className="text-muted-foreground">Production Order: <span className="font-semibold text-primary">{order.orderID}</span></p>
              <p className="text-muted-foreground">Tracking ID: <span className="font-mono font-semibold text-foreground text-[10px]">{order.trackingId || "N/A"}</span></p>
              <p className="text-muted-foreground">Flute Type: <span className="font-semibold text-foreground">{order.fluteType}</span></p>
              <p className="text-muted-foreground">BQ: <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono font-semibold text-[10px]">{order.bqComment.length > 18 ? order.bqComment.slice(0, 18) + "…" : order.bqComment}</span></p>
              <p className="text-blue-600 font-semibold">Available Quantity: {availableQty} <span className="text-xs font-normal">pcs</span></p>
              <p className="text-muted-foreground text-[10px] leading-tight">(Stock: {order.qty} pcs − In Process: {inProcessQty} pcs = Available: {availableQty} pcs)</p>
              <p className="text-muted-foreground">Pending Request Purchase: <span className="font-semibold text-foreground">{pendingRequestCount > 0 ? `${pendingRequestCount} job${pendingRequestCount > 1 ? "s" : ""}` : "N/A"}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Zap size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700"><strong>Level 2:</strong> Stock will be <strong>deducted immediately</strong> when you submit.</p>
          </div>

          {step === "choose" && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">What do you want to use it for?</p>
              <div className="space-y-2">
                <button onClick={() => setStep("job")} className="w-full flex items-center gap-3 p-3 border-2 border-border rounded-xl hover:border-primary hover:bg-blue-50 transition-all text-left">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><Zap size={16} className="text-primary" /></div>
                  <div><p className="text-sm font-semibold text-foreground">Job No</p><p className="text-xs text-muted-foreground">Use for a specific job order</p></div>
                </button>
                <button onClick={() => setStep("old_stock")} className="w-full flex items-center gap-3 p-3 border-2 border-border rounded-xl hover:border-destructive hover:bg-red-50 transition-all text-left">
                  <div className="w-9 h-9 bg-destructive/10 rounded-lg flex items-center justify-center"><Package size={16} className="text-destructive" /></div>
                  <div><p className="text-sm font-semibold text-foreground">Old Stock</p><p className="text-xs text-muted-foreground">Clear entire order (move to Out of Stock)</p></div>
                </button>
              </div>
            </div>
          )}

          {step === "job" && (
            <div>
              <button onClick={() => { setStep("choose"); setJobError(""); }} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">← Back</button>
              <div className="space-y-2.5">
                {/* Row 1: Job No */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Job No (8 digits)</label>
                  <input type="text" value={jobNo} onChange={e => { setJobNo(e.target.value.replace(/\D/g, "").slice(0, 8)); setJobError(""); }} placeholder="02123456" maxLength={8} className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
                </div>
                {/* Row 2: MasterCard + Board Size side by side on desktop, stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">MasterCard <span className="text-destructive">*</span></label>
                    <input type="text" value={masterCard} onChange={e => setMasterCard(e.target.value.toUpperCase())} placeholder="e.g. PABC00001A" className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Board Size (W × L) <span className="text-destructive">*</span></label>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={boardSizeW} onChange={e => setBoardSizeW(e.target.value)} placeholder="W" min={1} className="w-0 flex-1 border border-border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                      <span className="text-muted-foreground text-xs font-bold shrink-0">×</span>
                      <input type="number" value={boardSizeL} onChange={e => setBoardSizeL(e.target.value)} placeholder="L" min={1} className="w-0 flex-1 border border-border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
                {/* Row 3: Scores + Qty side by side on desktop, stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Scores <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span></label>
                    <input type="text" value={scores} onChange={e => setScores(e.target.value)} placeholder="e.g. 184 275 184" className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Qty to Use (max {availableQty})</label>
                    <input type="number" value={useQty} onChange={e => { setUseQty(e.target.value); setJobError(""); }} placeholder="e.g. 15" min={1} max={availableQty} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                {useQty && !isNaN(parseInt(useQty)) && parseInt(useQty) > 0 && parseInt(useQty) <= availableQty && (
                  <p className="text-xs text-green-600 font-medium">Remaining after use: {availableQty - parseInt(useQty)} pcs</p>
                )}
                {jobError && <p className="text-xs text-destructive">{jobError}</p>}
                {!showJobConfirm ? (
                  <button onClick={() => {
                    setJobError("");
                    if (!/^\d{8}$/.test(jobNo)) { setJobError("Job No must be exactly 8 digits (e.g. 02123456)."); return; }
                    if (!masterCard.trim()) { setJobError("MasterCard is required."); return; }
                    if (!boardSizeW || !boardSizeL) { setJobError("Board Size (W × L) is required."); return; }
                    const qty = parseInt(useQty);
                    if (!qty || qty <= 0) { setJobError("Enter a valid quantity."); return; }
                    if (qty > availableQty) { setJobError(`Cannot exceed available quantity (${availableQty} pcs).`); return; }
                    setShowJobConfirm(true);
                  }} className="w-full gspp-gradient text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                    <Zap size={14} /> Submit Usage
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <AlertTriangle size={16} className="text-orange-600 flex-shrink-0" />
                      <p className="text-xs text-orange-700">Use <strong>{useQty} pcs</strong> for Job <strong>{jobNo}</strong>? This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowJobConfirm(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">No, Cancel</button>
                      <button onClick={handleJobSubmit} disabled={logUsage.isPending} className="flex-1 gspp-gradient text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                        {logUsage.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        Yes, Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "old_stock" && !showOldConfirm && (
            <div>
              <button onClick={() => setStep("choose")} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">← Back</button>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-destructive mb-1">⚠ Warning</p>
                <p className="text-sm text-red-700">Order will be completely cleared. All {order.qty} pcs will be marked as used and the order will move to <strong>Out of Stock</strong>.</p>
              </div>
              <button onClick={() => setShowOldConfirm(true)} className="w-full bg-destructive text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2">
                <Package size={14} /> Clear Order (Old Stock)
              </button>
            </div>
          )}

          {step === "old_stock" && showOldConfirm && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                <p className="text-sm font-bold text-gray-900">Are you sure?</p>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Order <strong>{order.orderID}</strong> will be set to Qty 0 and moved to Out of Stock. This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowOldConfirm(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">No, Cancel</button>
                <button onClick={handleOldStockSubmit} disabled={logUsage.isPending} className="flex-1 bg-destructive text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {logUsage.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Yes, Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Level 1: Used Update Request Dialog (sends to approval queue) ─────────────
function UsedUpdateRequestDialog({ order, workerID, userLevel, onClose, onSuccess }: {
  order: Order; workerID: string; userLevel: string; onClose: () => void; onSuccess: () => void;
}) {
  const [step, setStep] = useState<"choose" | "job" | "old_stock">("choose");
  const [jobNo, setJobNo] = useState("");
  const [useQty, setUseQty] = useState("");
  const [jobError, setJobError] = useState("");
  const [showOldConfirm, setShowOldConfirm] = useState(false);
  const [showJobConfirm, setShowJobConfirm] = useState(false);
  const [masterCard, setMasterCard] = useState("");
  const [boardSizeW, setBoardSizeW] = useState("");
  const [boardSizeL, setBoardSizeL] = useState("");
  const [scores, setScores] = useState("");
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);
  const submitRequest = trpc.pendingRequests.submit.useMutation();
  const notifyAll = trpc.push.sendToAll.useMutation();
  const inProcessQtyQuery = trpc.pendingRequests.getInProcessQty.useQuery({ orderId: order.id });
  const inProcessQty = inProcessQtyQuery.data?.inProcessQty ?? 0;
  const availableQty = Math.max(0, order.qty - inProcessQty);
  const pendingRequestsQuery = trpc.pendingRequests.list.useQuery({ status: "pending" });
  const pendingRequestsForOrder = (pendingRequestsQuery.data ?? []).filter((req: any) => req.orderID === order.orderID);
  const pendingRequestCount = pendingRequestsForOrder.length;

  const handleJobRequest = async () => {
    setJobError("");
    if (!/^\d{8}$/.test(jobNo)) { setJobError("Job No must be exactly 8 digits (e.g. 02123456)."); return; }
    if (!masterCard.trim()) { setJobError("MasterCard is required."); return; }
    if (!boardSizeW || !boardSizeL) { setJobError("Board Size (W × L) is required."); return; }
    const qty = parseInt(useQty);
    if (!qty || qty <= 0) { setJobError("Enter a valid quantity."); return; }
    // Level 1 request: no qty limit (user requests target qty, Level 1.1/2 decide how much to approve)
    const newQty = order.qty - qty;
    try {
      const jobResult = await submitRequest.mutateAsync({
        type: "used_update",
        orderId: order.id,
        orderSnapshot: JSON.stringify(order),
        requestedBy: workerID,
        actionData: JSON.stringify({ jobNo, usedQty: qty, orderID: order.orderID, fluteType: order.fluteType, bqComment: order.bqComment, purpose: "job", newQty, masterCard: masterCard || null, boardSizeW: boardSizeW ? parseInt(boardSizeW) : null, boardSizeL: boardSizeL ? parseInt(boardSizeL) : null, scores: scores || null }),
      });
      if (jobResult.autoProcessApproved) {
        toast.success("Request submitted & auto process-approved! Awaiting Level 2 final approval.");
      } else {
        toast.success("Request submitted! Awaiting Level 2 approval.");
      }
      const isProcessed = jobResult.autoProcessApproved;
      notifyAll.mutate({
        title: isProcessed ? "🔄 Request In Process" : "📋 New Approval Request",
        body: isProcessed
          ? `${workerID} submitted Used Update for Order ${order.orderID} — auto process-approved. Awaiting Level 2.`
          : `${workerID} submitted a Used Update request for Order ${order.orderID}. Pending Level 2 approval.`,
        tag: "pending-request"
      });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setJobError(e?.message ?? "Failed to submit request.");
    }
  };

  const handleOldStockRequest = async () => {
    try {
      const oldResult = await submitRequest.mutateAsync({
        type: "used_update",
        orderId: order.id,
        orderSnapshot: JSON.stringify(order),
        requestedBy: workerID,
        actionData: JSON.stringify({ jobNo: null, usedQty: order.qty, orderID: order.orderID, fluteType: order.fluteType, bqComment: order.bqComment, purpose: "old_stock", newQty: 0 }),
      });
      if (oldResult.autoProcessApproved) {
        toast.success("Request submitted & auto process-approved! Awaiting Level 2 final approval.");
        notifyAll.mutate({
          title: "🔄 Request In Process",
          body: `${workerID} submitted Old Stock clear for Order ${order.orderID} — auto process-approved. Awaiting Level 2.`,
          tag: "pending-request"
        });
      } else {
        toast.success("Request submitted! Awaiting Level 2 approval.");
        notifyAll.mutate({
          title: "📋 New Approval Request",
          body: `${workerID} submitted an Old Stock clear request for Order ${order.orderID}. Pending Level 2 approval.`,
          tag: "pending-request"
        });
      }
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to submit request.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex-1">
            <h3 className="font-bold text-foreground mb-2">Purchase Order</h3>
            <div className="space-y-1 text-xs">
              <p className="text-muted-foreground">Production Order: <span className="font-semibold text-primary">{order.orderID}</span></p>
              <p className="text-muted-foreground">Tracking ID: <span className="font-mono font-semibold text-foreground text-[10px]">{order.trackingId || "N/A"}</span></p>
              <p className="text-muted-foreground">Flute Type: <span className="font-semibold text-foreground">{order.fluteType}</span></p>
              <p className="text-muted-foreground">BQ: <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono font-semibold text-[10px]">{order.bqComment.length > 18 ? order.bqComment.slice(0, 18) + "…" : order.bqComment}</span></p>
              <p className="text-blue-600 font-semibold">Available Quantity: {availableQty} <span className="text-xs font-normal">pcs</span></p>
              <p className="text-muted-foreground text-[10px] leading-tight">(Stock: {order.qty} pcs − In Process: {inProcessQty} pcs = Available: {availableQty} pcs)</p>
              <p className="text-muted-foreground">Pending Request Purchase: <span className="font-semibold text-foreground">{pendingRequestCount > 0 ? `${pendingRequestCount} job${pendingRequestCount > 1 ? "s" : ""}` : "N/A"}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">

          {userLevel === "1.1" ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <Zap size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-purple-700"><strong>Level 1.1:</strong> Stock will be <strong>deducted immediately</strong> when you submit. Your request will then await Level 2 final approval.</p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <Clock size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700">Your request will be sent to a <strong>Level 1.1 user</strong> for processing, then a <strong>Level 2 user</strong> for final approval before taking effect.</p>
            </div>
          )}

          {step === "choose" && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">What do you want to use it for?</p>
              <div className="space-y-2">
                <button onClick={() => setStep("job")} className="w-full flex items-center gap-3 p-3 border-2 border-border rounded-xl hover:border-primary hover:bg-blue-50 transition-all text-left">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><Zap size={16} className="text-primary" /></div>
                  <div><p className="text-sm font-semibold text-foreground">Job No</p><p className="text-xs text-muted-foreground">Use for a specific job order</p></div>
                </button>
                <button onClick={() => {
                  if (userLevel === "1") {
                    setShowPermissionDenied(true);
                  } else {
                    setStep("old_stock");
                  }
                }} className="w-full flex items-center gap-3 p-3 border-2 border-border rounded-xl hover:border-destructive hover:bg-red-50 transition-all text-left">
                  <div className="w-9 h-9 bg-destructive/10 rounded-lg flex items-center justify-center"><Package size={16} className="text-destructive" /></div>
                  <div><p className="text-sm font-semibold text-foreground">Old Stock</p><p className="text-xs text-muted-foreground">Clear entire order (move to Out of Stock)</p></div>
                </button>
              </div>
            </div>
          )}

          {step === "job" && (
            <div>
              <button onClick={() => { setStep("choose"); setJobError(""); }} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">← Back</button>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Job No (8 digits)</label>
                  <input type="text" value={jobNo} onChange={e => { setJobNo(e.target.value.replace(/\D/g, "").slice(0, 8)); setJobError(""); }} placeholder="02123456" maxLength={8} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
                </div>
                {/* Row 2: MasterCard + Board Size side by side on desktop, stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">MasterCard <span className="text-destructive">*</span></label>
                    <input type="text" value={masterCard} onChange={e => setMasterCard(e.target.value.toUpperCase())} placeholder="e.g. PABC00001A" className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Board Size (W × L) <span className="text-destructive">*</span></label>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={boardSizeW} onChange={e => setBoardSizeW(e.target.value)} placeholder="W" min={1} className="w-0 flex-1 border border-border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                      <span className="text-muted-foreground text-xs font-bold shrink-0">×</span>
                      <input type="number" value={boardSizeL} onChange={e => setBoardSizeL(e.target.value)} placeholder="L" min={1} className="w-0 flex-1 border border-border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
                {/* Row 3: Scores + Qty side by side on desktop, stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Scores <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span></label>
                    <input type="text" value={scores} onChange={e => setScores(e.target.value)} placeholder="e.g. 184 275 184" className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1 block">For This Modify Target Black How Many Pcs? <span className="text-destructive">*</span></label>
                    <input type="number" value={useQty} onChange={e => { setUseQty(e.target.value); setJobError(""); }} placeholder="e.g. 15" min={1} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    {userLevel === "1.1" && useQty && parseInt(useQty) > 0 ? (
                      <div className="mt-1.5 flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs text-purple-600 font-semibold">Remaining After:</span>
                        <span className="text-xs text-purple-800 font-bold">{Math.max(0, availableQty - parseInt(useQty))} pcs</span>
                        {parseInt(useQty) > availableQty && <span className="text-xs text-destructive font-semibold ml-1">⚠ Exceeds available!</span>}
                      </div>
                    ) : userLevel === "1" ? (
                      <p className="text-xs text-muted-foreground mt-1">This is your target request qty. Stock will be updated only after Level 1.1 processes it.</p>
                    ) : null}
                  </div>
                </div>
                {jobError && <p className="text-xs text-destructive">{jobError}</p>}
                {!showJobConfirm ? (
                  <button onClick={() => {
                    setJobError("");
                    if (!/^\d{8}$/.test(jobNo)) { setJobError("Job No must be exactly 8 digits (e.g. 02123456)."); return; }
                    if (!masterCard.trim()) { setJobError("MasterCard is required."); return; }
                    if (!boardSizeW || !boardSizeL) { setJobError("Board Size (W × L) is required."); return; }
                    const qty = parseInt(useQty);
                    if (!qty || qty <= 0) { setJobError("Enter a valid quantity."); return; }
                    setShowJobConfirm(true);
                  }} className="w-full bg-orange-500 text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                    <Clock size={14} /> Submit for Approval
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 rounded-lg p-3 ${userLevel === "1.1" ? "bg-purple-50 border border-purple-200" : "bg-orange-50 border border-orange-200"}`}>
                      <AlertTriangle size={16} className={`flex-shrink-0 ${userLevel === "1.1" ? "text-purple-600" : "text-orange-600"}`} />
                      {userLevel === "1.1" ? (
                        <p className="text-xs text-purple-700">Submit to use <strong>{useQty} pcs</strong> for Job <strong>{jobNo}</strong>? Stock will be <strong>deducted immediately</strong>. Awaiting Level 2 final approval.</p>
                      ) : (
                        <p className="text-xs text-orange-700">Submit request to use <strong>{useQty} pcs</strong> for Job <strong>{jobNo}</strong>? This will be sent for Level 1.1 processing, then Level 2 approval.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowJobConfirm(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">No, Cancel</button>
                      <button onClick={handleJobRequest} disabled={submitRequest.isPending} className="flex-1 bg-orange-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                        {submitRequest.isPending ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                        Yes, Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "old_stock" && !showOldConfirm && (
            <div>
              <button onClick={() => setStep("choose")} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">← Back</button>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-destructive mb-1">⚠ Warning</p>
                <p className="text-sm text-red-700">Request to clear all {availableQty} pcs and move to Out of Stock will be sent for approval.</p>
              </div>
              <button onClick={() => setShowOldConfirm(true)} className="w-full bg-orange-500 text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2">
                <Package size={14} /> Request Old Stock Clear
              </button>
            </div>
          )}

          {step === "old_stock" && showOldConfirm && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-orange-600" />
                </div>
                <p className="text-sm font-bold text-gray-900">Confirm Request</p>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Submit a request to clear order <strong>{order.orderID}</strong> as Old Stock? A Level 2 user must approve before it takes effect.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowOldConfirm(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">No, Cancel</button>
                <button onClick={handleOldStockRequest} disabled={submitRequest.isPending} className="flex-1 bg-orange-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitRequest.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Yes, Submit Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Permission Denied Dialog */}
      <Dialog open={showPermissionDenied} onOpenChange={setShowPermissionDenied}>
        <DialogContent className="w-full max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-destructive" />
              Access Restricted
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-3">
            <p className="text-sm text-foreground">You are not authorized to access this feature.</p>
            <p className="text-sm text-muted-foreground">Please contact your Administrator via WhatsApp for assistance.</p>
          </DialogDescription>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPermissionDenied(false)} className="flex-1">
              OK, Understood
            </Button>
            <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white">
              <a href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Contact Admin
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Delete Permission Denied Dialog (Level 1: no delete access) ────────────────
function DeletePermissionDeniedDialog({ onClose }: { onClose: () => void; }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-destructive" />
            Access Restricted
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="space-y-3">
          <p className="text-sm text-foreground">You are not authorized to access this feature.</p>
          <p className="text-sm text-muted-foreground">Please contact your Administrator via WhatsApp for assistance.</p>
        </DialogDescription>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            OK, Understood
          </Button>
          <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white">
            <a href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Contact Admin
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog (Level 2: direct delete) ───────────────────────────
function DeleteDialog({ order, onClose, onSuccess }: { order: Order; onClose: () => void; onSuccess: () => void; }) {
  const [workerID, setWorkerID] = useState("");
  const [error, setError] = useState("");
  const deleteOrder = trpc.orders.deleteFromHistory.useMutation();

  const handleDelete = async () => {
    setError("");
    if (!workerID.trim()) { setError("Employee ID is required."); return; }
    try {
      await deleteOrder.mutateAsync({ id: order.id, orderID: order.orderID, fluteType: order.fluteType, sizeW: order.sizeW, sizeL: order.sizeL, qty: order.qty, bqComment: order.bqComment, workerID: workerID.trim() });
      toast.success("Order deleted.");
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Invalid Employee ID or failed to delete.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-bold text-foreground mb-2">Delete Order</h3>
        <p className="text-sm text-muted-foreground mb-4">Enter your Employee ID to confirm deletion of order <strong className="text-foreground">{order.orderID}</strong>.</p>
        <input type="text" value={workerID} onChange={e => { setWorkerID(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleDelete()} placeholder="Employee ID" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive mb-1" autoFocus />
        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={deleteOrder.isPending} className="flex-1 bg-destructive text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            {deleteOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─// ─── Level 1: Delete Request Dialog (sends to approval queue) ─────────────
function DeleteRequestDialog({ order, workerID, onClose, onSuccess }: { order: Order; workerID: string; onClose: () => void; onSuccess: () => void; }) {
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const submitRequest = trpc.pendingRequests.submit.useMutation();
  const notifyAll = trpc.push.sendToAll.useMutation();

  const handleRequest = async () => {
    setError("");
    try {
      const delResult = await submitRequest.mutateAsync({
        type: "delete",
        orderId: order.id,
        orderSnapshot: JSON.stringify(order),
        requestedBy: workerID,
      });
      if (delResult.autoProcessApproved) {
        toast.success("Delete request submitted & auto process-approved! Awaiting Level 2 final approval.");
        notifyAll.mutate({
          title: "🔄 Delete Request In Process",
          body: `${workerID} submitted a Delete request for Order ${order.orderID} — auto process-approved. Awaiting Level 2.`,
          tag: "pending-request"
        });
      } else {
        toast.success("Delete request submitted! Awaiting Level 2 approval.");
        notifyAll.mutate({
          title: "🗑️ New Delete Request",
          body: `${workerID} submitted a Delete request for Order ${order.orderID}. Pending Level 2 approval.`,
          tag: "pending-request"
        });
      }
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Failed to submit request.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-bold text-foreground mb-2">Request Delete</h3>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <Clock size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-orange-700">Your delete request will be sent to a <strong>Level 2 user</strong> for approval.</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Are you sure you want to request deletion of order <strong className="text-foreground">{order.orderID}</strong>?</p>
        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
        {!showConfirm ? (
          <div className="flex gap-2 mt-3">
            <button onClick={onClose} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">No, Cancel</button>
            <button onClick={() => setShowConfirm(true)} className="flex-1 bg-orange-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2">
              <Clock size={14} /> Submit Request
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <AlertTriangle size={16} className="text-orange-600 flex-shrink-0" />
              <p className="text-xs text-orange-700">A delete request for order <strong>{order.orderID}</strong> will be sent to a Level 2 user for approval. Are you sure?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">No, Cancel</button>
              <button onClick={handleRequest} disabled={submitRequest.isPending} className="flex-1 bg-orange-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {submitRequest.isPending ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                Yes, Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main StockHistory ─────────────────────────────────────────────────────────
function RefreshButton({ onRefresh, size = 16 }: { onRefresh: () => void; size?: number }) {
  const [spinning, setSpinning] = useState(false);
  return (
    <button
      onClick={async () => { setSpinning(true); await onRefresh(); setTimeout(() => setSpinning(false), 700); }}
      className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-gray-100 ml-auto transition-colors"
      title="Refresh"
    >
      <RefreshCw size={size} className={spinning ? "animate-spin" : "transition-transform"} />
    </button>
  );
}

export default function StockHistory() {

  const { worker } = useAuth();
  const userLevel = worker?.userLevel ?? "2";

  const [activeTab, setActiveTab] = useState<"current" | "out_of_stock">("current");
  const [searchOrderID, setSearchOrderID] = useState("");
  const [searchFlute, setSearchFlute] = useState("");
  const [searchBQ, setSearchBQ] = useState("");
  const [usedUpdateOrder, setUsedUpdateOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [showDeletePermissionDenied, setShowDeletePermissionDenied] = useState(false);

  const ordersQuery = trpc.orders.list.useQuery({ status: activeTab });
  const utils = trpc.useUtils();
  const orders = (ordersQuery.data ?? []) as Order[];

  const filtered = useMemo(() => orders.filter(o => {
    const matchID = !searchOrderID || o.orderID.toLowerCase().includes(searchOrderID.toLowerCase());
    const matchFlute = !searchFlute || o.fluteType.toLowerCase().includes(searchFlute.toLowerCase());
    const matchBQ = !searchBQ || o.bqComment.toLowerCase().includes(searchBQ.toLowerCase());
    return matchID && matchFlute && matchBQ;
  }), [orders, searchOrderID, searchFlute, searchBQ]);

  return (
    <AppLayout pageTitle="Stock History">
      <div className="flex justify-between items-center px-4 lg:px-8 pt-4">
        {(userLevel === "1" || userLevel === "1.1") && (
          <div className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
            <Clock size={12} /> {userLevel === "1.1" ? "Level 1.1 — Requests auto process-approved, awaiting Level 2" : "Level 1 — Actions require approval"}
          </div>
        )}
        {userLevel === "2" && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
            Level 2 — Direct actions enabled
          </div>
        )}
        <RefreshButton onRefresh={() => utils.orders.list.invalidate()} />
      </div>

      <main className="container lg:max-w-none lg:px-8 py-5">
        <div className="flex gap-1 mb-5 border-b border-border">
          <button onClick={() => setActiveTab("current")} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "current" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            Current Stock
          </button>
          <button onClick={() => setActiveTab("out_of_stock")} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "out_of_stock" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            Out of Stock
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={searchOrderID} onChange={e => setSearchOrderID(e.target.value)} placeholder="Search Production Order…" className="w-full border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={searchFlute} onChange={e => setSearchFlute(e.target.value)} placeholder="Search Flute Type…" className="w-full border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={searchBQ} onChange={e => setSearchBQ(e.target.value)} placeholder="Search BQ Comment…" className="w-full border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>
          {activeTab === "current" && filtered.some(o => o.qty < LOW_STOCK_THRESHOLD) && (
            <div className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
              <AlertTriangle size={12} />
              {filtered.filter(o => o.qty < LOW_STOCK_THRESHOLD).length} low stock
            </div>
          )}
        </div>

        {ordersQuery.isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={40} className="text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    {["Tracking ID","Production Order","Flute Type","Size (W×L)","Qty","BQ","Date","Actions"].map(h => (
                      <th key={h} className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-left pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const isLowStock = activeTab === "current" && order.qty < LOW_STOCK_THRESHOLD;
                    return (
                    <tr key={order.id} className={`border-b border-border hover:bg-gray-50 transition-colors ${isLowStock ? "bg-orange-50/40" : ""}`}>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-1 rounded font-mono font-bold ${
                          order.trackingId 
                            ? "bg-teal-100 text-teal-700" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {order.trackingId || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-bold text-primary">
                        <div className="flex items-center gap-1.5">
                          {isLowStock && <AlertTriangle size={13} className="text-orange-500 flex-shrink-0" />}
                          {order.orderID}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Flute : {order.fluteType}</span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-sm">{order.sizeW}×{order.sizeL} mm</td>
                      <td className="py-3 pr-4">
                        <span className={`font-semibold ${isLowStock ? "text-orange-600" : ""}`}>{order.qty} pcs</span>
                        {isLowStock && <p className="text-xs text-orange-500 font-medium">Low stock</p>}
                      </td>
                      <td className="py-3 pr-4 max-w-[200px]">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono break-all leading-relaxed">{order.bqComment}</span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {activeTab === "current" && (
                            <button
                              onClick={() => setUsedUpdateOrder(order)}
                              className={`text-xs px-2.5 py-1 rounded-lg font-semibold hover:opacity-90 whitespace-nowrap ${(userLevel === "1" || userLevel === "1.1") ? "bg-orange-500 text-white" : "bg-primary text-white"}`}
                            >
                              Purchase Order
                            </button>
                          )}
                          <A4Label
                            orderId={order.orderID}
                            trackingId={order.trackingId}
                            orderQty={order.qty}
                            masterCard={order.bqComment}
                            boardSize={`${order.sizeW}×${order.sizeL}`}
                            fluteType={order.fluteType}
                            bqComment={order.bqComment}
                          />
                          <button onClick={() => {
                            if (userLevel === "1") {
                              setShowDeletePermissionDenied(true);
                            } else {
                              setDeleteOrder(order);
                            }
                          }} className="text-muted-foreground hover:text-destructive p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(order => {
                const isLowStock = activeTab === "current" && order.qty < LOW_STOCK_THRESHOLD;
                return (
                <div key={order.id} className={`border rounded-xl shadow-sm p-4 space-y-2 ${isLowStock ? "bg-orange-50 border-orange-200" : "bg-white border-border"}`}>
                  {order.trackingId && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded font-mono font-bold inline-block">Ref: {order.trackingId}</span>}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Production Order</p>
                      <div className="flex items-center gap-1.5">
                        {isLowStock && <AlertTriangle size={14} className="text-orange-500" />}
                        <p className="text-base font-bold text-primary">{order.orderID}</p>
                      </div>
                      {isLowStock && <p className="text-xs text-orange-600 font-semibold mt-0.5">⚠ Low Stock</p>}
                    </div>
                    <button onClick={() => {
                      if (userLevel === "1") {
                        setShowDeletePermissionDenied(true);
                      } else {
                        setDeleteOrder(order);
                      }
                    }} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Flute : {order.fluteType}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{order.sizeW}×{order.sizeL} mm</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isLowStock ? "bg-orange-100 text-orange-700" : "bg-green-50 text-green-700"}`}>{order.qty} pcs</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">BQ</p>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono break-all leading-relaxed">{order.bqComment}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Tracking ID: <span className="font-mono font-semibold text-foreground">{order.trackingId || "N/A"}</span></p>
                  {activeTab === "current" && (
                    <button
                      onClick={() => setUsedUpdateOrder(order)}
                      className={`w-full text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 ${(userLevel === "1" || userLevel === "1.1") ? "bg-orange-500" : "gspp-gradient"}`}
                    >
                      <><Zap size={14} /> Purchase Order</>
                    </button>
                  )}
                </div>
              )})}
            </div>
          </>
        )}
      </main>

      {/* Dialogs: Level 1 gets request dialogs, Level 2 gets direct action dialogs */}
      {usedUpdateOrder && userLevel === "2" && (
        <UsedUpdateDialog order={usedUpdateOrder} onClose={() => setUsedUpdateOrder(null)} onSuccess={() => setUsedUpdateOrder(null)} />
      )}
      {usedUpdateOrder && (userLevel === "1" || userLevel === "1.1") && worker && (
        <UsedUpdateRequestDialog order={usedUpdateOrder} workerID={worker.workerID} userLevel={userLevel} onClose={() => setUsedUpdateOrder(null)} onSuccess={() => setUsedUpdateOrder(null)} />
      )}
      {deleteOrder && userLevel === "2" && (
        <DeleteDialog order={deleteOrder} onClose={() => setDeleteOrder(null)} onSuccess={() => { setDeleteOrder(null); utils.orders.list.invalidate(); }} />
      )}
      {deleteOrder && (userLevel === "1" || userLevel === "1.1") && worker && (
        <DeleteRequestDialog order={deleteOrder} workerID={worker.workerID} onClose={() => setDeleteOrder(null)} onSuccess={() => { setDeleteOrder(null); }} />
      )}
      {showDeletePermissionDenied && (
        <DeletePermissionDeniedDialog onClose={() => setShowDeletePermissionDenied(false)} />
      )}
    </AppLayout>
  );
}
