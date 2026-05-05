import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Search, RefreshCw, Trash2, Loader2, Package, Zap, X, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import AppLayout from "@/components/AppLayout";

const LOW_STOCK_THRESHOLD = 50;

type Order = {
  id: number; orderID: string; fluteType: string; sizeW: number; sizeL: number;
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
  const utils = trpc.useUtils();
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <h3 className="font-bold text-foreground text-base">Used Update</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Order: <span className="font-semibold text-primary">{order.orderID}</span></p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 mb-3">
            <div className="shrink-0">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide leading-none">Available</p>
              <p className="text-xl font-bold text-blue-700 leading-tight">{availableQty} <span className="text-xs font-normal">pcs</span></p>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-auto">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Flute : {order.fluteType}</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono">{order.bqComment.length > 18 ? order.bqComment.slice(0, 18) + "…" : order.bqComment}</span>
            </div>
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
function UsedUpdateRequestDialog({ order, workerID, onClose, onSuccess }: {
  order: Order; workerID: string; onClose: () => void; onSuccess: () => void;
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
  const submitRequest = trpc.pendingRequests.submit.useMutation();
  const notifyLevel2 = trpc.push.sendToLevel2.useMutation();
  const pendingUsedQtyQuery = trpc.pendingRequests.getPendingUsedQty.useQuery({ orderId: order.id });
  const pendingUsedQty = pendingUsedQtyQuery.data?.pendingUsedQty ?? 0;
  const availableQty = Math.max(0, order.qty - pendingUsedQty);

  const handleJobRequest = async () => {
    setJobError("");
    if (!/^\d{8}$/.test(jobNo)) { setJobError("Job No must be exactly 8 digits (e.g. 02123456)."); return; }
    if (!masterCard.trim()) { setJobError("MasterCard is required."); return; }
    if (!boardSizeW || !boardSizeL) { setJobError("Board Size (W × L) is required."); return; }
    const qty = parseInt(useQty);
    if (!qty || qty <= 0) { setJobError("Enter a valid quantity."); return; }
    if (qty > availableQty) { setJobError(`Cannot exceed available quantity (${availableQty} pcs after pending requests).`); return; }
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
      notifyLevel2.mutate({ title: "New Approval Request", body: `${workerID} submitted a Used Update request. Please review in Approval Center.`, tag: "pending-request" });
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
      } else {
        toast.success("Request submitted! Awaiting Level 2 approval.");
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
          <div>
            <h3 className="font-bold text-foreground">Used Update Request</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Order: <span className="font-semibold text-primary">{order.orderID}</span></p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Clock size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700">Your request will be sent to a <strong>Level 2 user</strong> for approval before taking effect.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Available Quantity</p>
            <p className="text-2xl font-bold text-blue-700 mt-0.5">{availableQty} <span className="text-sm font-normal">pcs</span></p>
            {pendingUsedQty > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-xs text-orange-600">Stock: {order.qty} pcs</span>
                <span className="text-xs text-muted-foreground">−</span>
                <span className="text-xs text-orange-600 font-semibold">Pending: {pendingUsedQty} pcs</span>
                <span className="text-xs text-muted-foreground">= Available: {availableQty} pcs</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Flute : {order.fluteType}</span>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono">{order.bqComment.length > 22 ? order.bqComment.slice(0, 22) + "…" : order.bqComment}</span>
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Quantity to Use (max {availableQty} pcs)</label>
                    <input type="number" value={useQty} onChange={e => { setUseQty(e.target.value); setJobError(""); }} placeholder="e.g. 15" min={1} max={availableQty} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    {useQty && !isNaN(parseInt(useQty)) && parseInt(useQty) > 0 && parseInt(useQty) <= availableQty && (
                      <p className="text-xs text-green-600 mt-1 font-medium">Remaining after use: {availableQty - parseInt(useQty)} pcs</p>
                    )}
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
                    if (qty > availableQty) { setJobError(`Cannot exceed available quantity (${availableQty} pcs after pending requests).`); return; }
                    setShowJobConfirm(true);
                  }} className="w-full bg-orange-500 text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                    <Clock size={14} /> Submit for Approval
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <AlertTriangle size={16} className="text-orange-600 flex-shrink-0" />
                      <p className="text-xs text-orange-700">Submit request to use <strong>{useQty} pcs</strong> for Job <strong>{jobNo}</strong>? This will be sent to a Level 2 user for approval.</p>
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
    </div>
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
      } else {
        toast.success("Delete request submitted! Awaiting Level 2 approval.");
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
export default function StockHistory() {
  const [, navigate] = useLocation();
  void navigate;
  const { worker } = useAuth();
  const userLevel = worker?.userLevel ?? "2";

  const [activeTab, setActiveTab] = useState<"current" | "out_of_stock">("current");
  const [searchOrderID, setSearchOrderID] = useState("");
  const [searchFlute, setSearchFlute] = useState("");
  const [searchBQ, setSearchBQ] = useState("");
  const [usedUpdateOrder, setUsedUpdateOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);

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
        <button onClick={() => utils.orders.list.invalidate()} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-gray-100 ml-auto" title="Refresh">
          <RefreshCw size={16} />
        </button>
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
            <input type="text" value={searchOrderID} onChange={e => setSearchOrderID(e.target.value)} placeholder="Search Order ID…" className="w-full border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
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
                    {["Order ID","Flute Type","Size (W×L)","Qty","BQ","Date","Actions"].map(h => (
                      <th key={h} className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-left pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const isLowStock = activeTab === "current" && order.qty < LOW_STOCK_THRESHOLD;
                    return (
                    <tr key={order.id} className={`border-b border-border hover:bg-gray-50 transition-colors ${isLowStock ? "bg-orange-50/40" : ""}`}>
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
                              {(userLevel === "1" || userLevel === "1.1") ? "Request Use" : "Used Update"}
                            </button>
                          )}
                          <button onClick={() => setDeleteOrder(order)} className="text-muted-foreground hover:text-destructive p-1">
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
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <div className="flex items-center gap-1.5">
                        {isLowStock && <AlertTriangle size={14} className="text-orange-500" />}
                        <p className="text-base font-bold text-primary">{order.orderID}</p>
                      </div>
                      {isLowStock && <p className="text-xs text-orange-600 font-semibold mt-0.5">⚠ Low Stock</p>}
                    </div>
                    <button onClick={() => setDeleteOrder(order)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
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
                  {activeTab === "current" && (
                    <button
                      onClick={() => setUsedUpdateOrder(order)}
                      className={`w-full text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 ${(userLevel === "1" || userLevel === "1.1") ? "bg-orange-500" : "gspp-gradient"}`}
                    >
                      {(userLevel === "1" || userLevel === "1.1") ? <><Clock size={14} /> Request Use</> : <><Zap size={14} /> Used Update</>}
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
        <UsedUpdateRequestDialog order={usedUpdateOrder} workerID={worker.workerID} onClose={() => setUsedUpdateOrder(null)} onSuccess={() => setUsedUpdateOrder(null)} />
      )}
      {deleteOrder && userLevel === "2" && (
        <DeleteDialog order={deleteOrder} onClose={() => setDeleteOrder(null)} onSuccess={() => { setDeleteOrder(null); utils.orders.list.invalidate(); }} />
      )}
      {deleteOrder && (userLevel === "1" || userLevel === "1.1") && worker && (
        <DeleteRequestDialog order={deleteOrder} workerID={worker.workerID} onClose={() => setDeleteOrder(null)} onSuccess={() => { setDeleteOrder(null); }} />
      )}
    </AppLayout>
  );
}
