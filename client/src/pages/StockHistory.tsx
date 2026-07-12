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

// ─── Board Size Calculation Helper ────────────────────────────────────────────
const ALLOWED_GAP = 50; // 50mm allowance

type BoardCalcResult = {
  piecesW: number;       // how many pieces fit along W
  piecesL: number;       // how many pieces fit along L
  remainW: number;       // leftover mm along W
  remainL: number;       // leftover mm along L
  statusW: "ok" | "tight" | "impossible"; // tight = exactly equal (warning), impossible = prod < job
  statusL: "ok" | "tight" | "impossible";
};

function calcBoardFit(prodW: number, prodL: number, jobW: number, jobL: number): BoardCalcResult {
  const calcAxis = (prod: number, job: number) => {
    if (prod < job) return { pieces: 0, remain: 0, status: "impossible" as const };
    if (prod === job) return { pieces: 1, remain: 0, status: "tight" as const };
    const usable = prod - ALLOWED_GAP;
    if (usable < job) return { pieces: 0, remain: 0, status: "tight" as const }; // prod > job but not enough after allowance
    const pieces = Math.floor(usable / job);
    const remain = usable - pieces * job;
    return { pieces, remain, status: "ok" as const };
  };
  const w = calcAxis(prodW, jobW);
  const l = calcAxis(prodL, jobL);
  return { piecesW: w.pieces, piecesL: l.pieces, remainW: w.remain, remainL: l.remain, statusW: w.status, statusL: l.status };
}

type Order = {
  id: number; orderID: string; trackingId?: string; fluteType: string; sizeW: number; sizeL: number;
  qty: number; bqComment: string; status: "current" | "out_of_stock";
  submittedBy: string | null; createdAt: Date; outOfStockAt?: Date | null;
};

/** Returns the estimated auto-delete date: outOfStockAt (or createdAt) + 13 months */
function getAutoDeleteDate(order: Order): Date {
  const base = order.outOfStockAt ? new Date(order.outOfStockAt) : new Date(order.createdAt);
  const d = new Date(base);
  d.setMonth(d.getMonth() + 13);
  return d;
}

/** Returns urgency level based on days remaining until auto-delete */
function getDeleteUrgency(deleteDate: Date): "critical" | "warning" | "normal" {
  const now = new Date();
  const daysLeft = Math.ceil((deleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 30) return "critical";
  if (daysLeft <= 90) return "warning";
  return "normal";
}

// ─── BoardSizeCalcPanel ─────────────────────────────────────────────────────────────────────────────
function BoardSizeCalcPanel({ prodW, prodL, jobW, jobL, trackingId }: { prodW: number; prodL: number; jobW: string; jobL: string; trackingId?: string }) {
  const jW = parseInt(jobW);
  const jL = parseInt(jobL);
  if (!jobW || !jobL || isNaN(jW) || isNaN(jL) || jW <= 0 || jL <= 0) return null;

  const calc = calcBoardFit(prodW, prodL, jW, jL);
  const hasImpossible = calc.statusW === "impossible" || calc.statusL === "impossible";
  const hasTight = !hasImpossible && (calc.statusW === "tight" || calc.statusL === "tight");
  const totalPcs = calc.piecesW * calc.piecesL;

  if (hasImpossible) {
    const orderRef = trackingId ? `(${trackingId})` : "";
    const lines: React.ReactNode[] = [];
    if (calc.statusW === "impossible") {
      lines.push(<p key="w" className="text-xs text-red-600">Production Order {orderRef} is size W ({prodW}mm) is smaller than you request Board Size W ({jW}mm). NPRM Modify Order cannot be processed.</p>);
    }
    if (calc.statusL === "impossible") {
      lines.push(<p key="l" className="text-xs text-red-600">Production Order {orderRef} is size L ({prodL}mm) is smaller than you request Board Size L ({jL}mm). NPRM Modify Order cannot be processed.</p>);
    }
    return (
      <div className="rounded-xl border bg-red-50 border-red-200 p-3 space-y-1.5">
        <p className="text-xs font-bold text-red-700 uppercase tracking-wide">⛔ Cannot Cut</p>
        {lines}
      </div>
    );
  }

  const orderLabel = trackingId ? `(${trackingId})` : "";

  if (hasTight) {
    const tightAxis = calc.statusW === "tight" && calc.statusL === "tight" ? "W & L" :
      calc.statusW === "tight" ? "W" : "L";
    return (
      <div className="rounded-xl border bg-amber-50 border-amber-200 p-3 space-y-1.5">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">⚠️ Tight Fit ({tightAxis}) — Less than 50mm allowance</p>
        <p className="text-xs font-bold text-amber-800">Production Order {orderLabel} 1 pcs slit = <span className="text-lg">{totalPcs} pcs</span></p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-3">
      <p className="text-xs font-bold text-emerald-800">Production Order {orderLabel} 1 pcs slit = <span className="text-lg">{totalPcs} pcs</span></p>
    </div>
  );
}

// ─── Used Update Dialog (Level 2: direct action) ──────────────────────────────────────────────
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
  const createNotif = trpc.notifications.create.useMutation();
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
        title: "Stock Used — Job No",
        body: `Purchase Order (${order.orderID}) Job No (${jobNo}) ${qty} pcs used. Remaining: ${newQty} pcs.`,
        type: "order",
        url: "/stock-history",
        tag: "used-update-" + order.orderID,
        orderID: order.orderID,
        jobNo,
        requireInteraction: false,
      });
      createNotif.mutate({
        type: "order_in_process",
        title: `Purchase Order ${order.orderID} — Used for Job`,
        message: `Purchase Order is Production Order (${order.orderID}) to use it for NPRM Modify Order Job No (${jobNo}) ${qty} pcs. Remaining: ${newQty} pcs.`,
        orderID: order.orderID,
        jobNo,
        qty,
        fluteType: order.fluteType,
        trackingId: order.trackingId,
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
        title: "Out of Stock — Order Cleared",
        body: `Purchase Order (${order.orderID}) ${order.qty} pcs cleared as Old Stock and moved to Out of Stock.`,
        type: "order",
        url: "/stock-history",
        tag: "out-of-stock-" + order.orderID,
        orderID: order.orderID,
        requireInteraction: false,
      });
      createNotif.mutate({
        type: "out_of_stock",
        title: `Order ${order.orderID} — Moved to Out of Stock`,
        message: `Purchase Order (${order.orderID}) has been cleared as Old Stock. All ${order.qty} pcs have been consumed and moved to Out of Stock.`,
        orderID: order.orderID,
        qty: order.qty,
        fluteType: order.fluteType,
        trackingId: order.trackingId,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Premium Gradient Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-t-2xl p-4 text-white relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Purchase Order</h3>
                  <p className="text-[10px] text-white/70">Level 2 — Direct Deduction</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/60 text-[9px] uppercase">Production Order</p>
                <p className="font-bold">{order.orderID}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/60 text-[9px] uppercase">Flute Type</p>
                <p className="font-bold">{order.fluteType}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/60 text-[9px] uppercase">Tracking ID</p>
                <p className="font-mono font-bold text-[10px]">{order.trackingId || "N/A"}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/60 text-[9px] uppercase">Available Qty</p>
                <p className="font-bold text-sm">{availableQty} <span className="text-[9px] font-normal">pcs</span></p>
              </div>
            </div>
            <div className="mt-2 bg-white/10 rounded-lg px-2.5 py-1.5">
              <p className="text-white/60 text-[9px] uppercase">BQ</p>
              <p className="font-mono font-bold text-[10px] break-all">{order.bqComment}</p>
            </div>
            <p className="text-[9px] text-white/50 mt-1.5">(Stock: {order.qty} − In Process: {inProcessQty} = Available: {availableQty}) | Pending: {pendingRequestCount > 0 ? `${pendingRequestCount} job${pendingRequestCount > 1 ? "s" : ""}` : "N/A"}</p>
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-1">

          {step === "choose" && (
            <div>
              <p className="text-sm font-bold text-foreground mb-3">What do you want to use it for?</p>
              <div className="space-y-2.5">
                <button onClick={() => setStep("job")} className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-100 rounded-xl hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50/50 transition-all text-left group shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform"><Zap size={16} className="text-white" /></div>
                  <div><p className="text-sm font-bold text-foreground">NPRM Modify Order</p><p className="text-xs text-muted-foreground">Use for a specific job order</p></div>
                </button>
                <button onClick={() => setStep("old_stock")} className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-100 rounded-xl hover:border-red-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50/50 transition-all text-left group shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform"><Package size={16} className="text-white" /></div>
                  <div><p className="text-sm font-bold text-foreground">Old Stock</p><p className="text-xs text-muted-foreground">Clear entire order (move to Out of Stock)</p></div>
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
                {/* Board Size Calculation Panel */}
                <BoardSizeCalcPanel prodW={order.sizeW} prodL={order.sizeL} jobW={boardSizeW} jobL={boardSizeL} trackingId={order.trackingId} />
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
                    // Block if board size is impossible (prod < job)
                    if (boardSizeW && boardSizeL) {
                      const jW = parseInt(boardSizeW); const jL = parseInt(boardSizeL);
                      if (!isNaN(jW) && !isNaN(jL)) {
                        const c = calcBoardFit(order.sizeW, order.sizeL, jW, jL);
                        if (c.statusW === "impossible" || c.statusL === "impossible") {
                          setJobError("Board size exceeds Production Order dimensions. NPRM Modify Order cannot be processed."); return;
                        }
                      }
                    }
                    const qty = parseInt(useQty);
                    if (!qty || qty <= 0) { setJobError("Enter a valid quantity."); return; }
                    if (qty > availableQty) { setJobError(`Cannot exceed available quantity (${availableQty} pcs).`); return; }
                    setShowJobConfirm(true);
                  }} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl py-3 text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                    <Zap size={14} /> Submit Usage
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3">
                      <AlertTriangle size={16} className="text-orange-600 flex-shrink-0" />
                      <p className="text-xs text-orange-700">Use <strong>{useQty} pcs</strong> for Job <strong>{jobNo}</strong>? This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowJobConfirm(false)} className="flex-1 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">Cancel</button>
                      <button onClick={handleJobSubmit} disabled={logUsage.isPending} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl py-2.5 text-sm font-bold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {logUsage.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "old_stock" && !showOldConfirm && (
            <div>
              <button onClick={() => setStep("choose")} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1 font-medium">← Back</button>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-red-700 mb-1 flex items-center gap-1.5"><AlertTriangle size={14} /> Warning</p>
                <p className="text-sm text-red-700">Order will be completely cleared. All <strong>{order.qty} pcs</strong> will be marked as used and the order will move to <strong>Out of Stock</strong>.</p>
              </div>
              <button onClick={() => setShowOldConfirm(true)} className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl py-3 text-sm font-bold hover:shadow-lg hover:shadow-red-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <Package size={14} /> Clear Order (Old Stock)
              </button>
            </div>
          )}

          {step === "old_stock" && showOldConfirm && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Final Confirmation</p>
                  <p className="text-[10px] text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Order <strong>{order.orderID}</strong> will be set to Qty 0 and moved to Out of Stock.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowOldConfirm(false)} className="flex-1 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">Cancel</button>
                <button onClick={handleOldStockSubmit} disabled={logUsage.isPending} className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl py-2.5 text-sm font-bold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
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
  const createNotif = trpc.notifications.create.useMutation();
  const reservedQtyQuery = trpc.pendingRequests.getReservedQty.useQuery({ orderId: order.id });
  const reservedData = reservedQtyQuery.data;
  const inProcessQty = reservedData?.inProcessQty ?? 0;
  const pendingReservedQty = reservedData?.pendingQty ?? 0;
  const totalReserved = reservedData?.totalReserved ?? 0;
  // availableQty = Total Stock minus OTHER orders' reserved qty (pending + in-process)
  // This does NOT include the current form's Target Black qty — that is "this order"
  const otherOrdersReserved = totalReserved; // backend only counts existing DB requests, not the current form
  const availableQty = Math.max(0, order.qty - otherOrdersReserved);
  // Compute isInsufficientStock: check if this order's needed slit > availableQty
  const isInsufficientStock = (() => {
    const targetQty = parseInt(useQty);
    if (!useQty || isNaN(targetQty) || targetQty <= 0) return false;
    const jW = parseInt(boardSizeW);
    const jL = parseInt(boardSizeL);
    if (boardSizeW && boardSizeL && !isNaN(jW) && !isNaN(jL) && jW > 0 && jL > 0) {
      const fit = calcBoardFit(order.sizeW, order.sizeL, jW, jL);
      const pcsPerSlit = fit.piecesW * fit.piecesL;
      if (pcsPerSlit > 0) {
        const slitNeeded = Math.ceil(targetQty / pcsPerSlit);
        return slitNeeded > availableQty;
      }
    }
    // No board size yet — compare targetQty directly
    return targetQty > availableQty;
  })();
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
        title: isProcessed ? "Request In Process" : "New Approval Request",
        body: isProcessed
          ? `Purchase Order is Production Order (${order.orderID}) to use it for NPRM Modify Order Job No (${jobNo}) ${qty} pcs. Auto process-approved. Awaiting Level 2 final approval.`
          : `Purchase Order is Production Order (${order.orderID}) to use it for NPRM Modify Order Job No (${jobNo}) ${qty} pcs. Pending Level 2 approval.`,
        type: "approval",
        url: "/approval-center",
        tag: "request-" + order.orderID,
        orderID: order.orderID,
        jobNo,
        requireInteraction: true,
      });
      createNotif.mutate({
        type: isProcessed ? "order_in_process" : "order_request",
        title: isProcessed
          ? `Purchase Order ${order.orderID} — Request In Process`
          : `Purchase Order ${order.orderID} — New Request`,
        message: `Purchase Order is Production Order (${order.orderID}) to use it for NPRM Modify Order Job No (${jobNo}) ${qty} pcs.${isProcessed ? " Auto process-approved. Awaiting Level 2 final approval." : " Pending Level 2 approval."}`,
        orderID: order.orderID,
        jobNo,
        qty,
        fluteType: order.fluteType,
        workerID,
        trackingId: order.trackingId,
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
      const isOldProcessed = oldResult.autoProcessApproved;
      if (isOldProcessed) {
        toast.success("Request submitted & auto process-approved! Awaiting Level 2 final approval.");
        notifyAll.mutate({
          title: "Old Stock Request In Process",
          body: `Purchase Order (${order.orderID}) Old Stock clear — ${order.qty} pcs. Auto process-approved. Awaiting Level 2 final approval.`,
          type: "approval",
          url: "/approval-center",
          tag: "old-stock-" + order.orderID,
          orderID: order.orderID,
          requireInteraction: true,
        });
      } else {
        toast.success("Request submitted! Awaiting Level 2 approval.");
        notifyAll.mutate({
          title: "New Old Stock Request",
          body: `Purchase Order (${order.orderID}) Old Stock clear request — ${order.qty} pcs. Pending Level 2 approval.`,
          type: "approval",
          url: "/approval-center",
          tag: "old-stock-" + order.orderID,
          orderID: order.orderID,
          requireInteraction: true,
        });
      }
      createNotif.mutate({
        type: isOldProcessed ? "order_in_process" : "order_request",
        title: isOldProcessed
          ? `Purchase Order ${order.orderID} — Old Stock In Process`
          : `Purchase Order ${order.orderID} — Old Stock Request`,
        message: isOldProcessed
          ? `Purchase Order (${order.orderID}) Old Stock clear request auto process-approved. ${order.qty} pcs awaiting Level 2 final approval.`
          : `Purchase Order (${order.orderID}) Old Stock clear request submitted by ${workerID}. ${order.qty} pcs pending Level 2 approval.`,
        orderID: order.orderID,
        qty: order.qty,
        fluteType: order.fluteType,
        workerID,
        trackingId: order.trackingId,
      });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to submit request.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Premium Gradient Header */}
        <div className={`rounded-t-2xl p-4 text-white relative overflow-hidden shrink-0 ${userLevel === "1.1" ? "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600" : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  {userLevel === "1.1" ? <Zap size={16} className="text-white" /> : <Clock size={16} className="text-white" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">Purchase Order</h3>
                  <p className="text-[10px] text-white/70">{userLevel === "1.1" ? "Level 1.1 — Auto Process" : "Level 1 — Requires Approval"}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/60 text-[9px] uppercase">Production Order</p>
                <p className="font-bold">{order.orderID}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/60 text-[9px] uppercase">Flute Type</p>
                <p className="font-bold">{order.fluteType}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/60 text-[9px] uppercase">Tracking ID</p>
                <p className="font-mono font-bold text-[10px]">{order.trackingId || "N/A"}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/60 text-[9px] uppercase">Available Qty</p>
                <p className="font-bold text-sm">{availableQty} <span className="text-[9px] font-normal">pcs</span></p>
              </div>
            </div>
            <div className="mt-2 bg-white/10 rounded-lg px-2.5 py-1.5">
              <p className="text-white/60 text-[9px] uppercase">BQ</p>
              <p className="font-mono font-bold text-[10px] break-all">{order.bqComment}</p>
            </div>
            <p className="text-[9px] text-white/50 mt-1.5">(Total Stock: {order.qty}{otherOrdersReserved > 0 ? ` − Reserved (other orders): ${otherOrdersReserved} [${pendingReservedQty} pending + ${inProcessQty} in-process]` : ""} = Available: {availableQty} pcs)</p>
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-1">

          {step === "choose" && (
            <div>
              <p className="text-sm font-bold text-foreground mb-3">What do you want to use it for?</p>
              <div className="space-y-2.5">
                <button onClick={() => setStep("job")} className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-100 rounded-xl hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50/50 transition-all text-left group shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform"><Zap size={16} className="text-white" /></div>
                  <div><p className="text-sm font-bold text-foreground">NPRM Modify Order</p><p className="text-xs text-muted-foreground">Use for a specific job order</p></div>
                </button>
                <button onClick={() => {
                  if (userLevel === "1") {
                    setShowPermissionDenied(true);
                  } else {
                    setStep("old_stock");
                  }
                }} className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-100 rounded-xl hover:border-red-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50/50 transition-all text-left group shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform"><Package size={16} className="text-white" /></div>
                  <div><p className="text-sm font-bold text-foreground">Old Stock</p><p className="text-xs text-muted-foreground">Clear entire order (move to Out of Stock)</p></div>
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
                {/* Board Size Calculation Panel */}
                <BoardSizeCalcPanel prodW={order.sizeW} prodL={order.sizeL} jobW={boardSizeW} jobL={boardSizeL} trackingId={order.trackingId} />
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
                    {/* Production Order pcs needed + available qty check */}
                    {(() => {
                      const targetQty = parseInt(useQty);
                      const jW3 = parseInt(boardSizeW);
                      const jL3 = parseInt(boardSizeL);
                      if (!useQty || isNaN(targetQty) || targetQty <= 0) return null;
                      // Show needed slit only if board size is provided
                      const hasBoardSize = boardSizeW && boardSizeL && !isNaN(jW3) && !isNaN(jL3) && jW3 > 0 && jL3 > 0;
                      let prodPcsNeeded: number | null = null;
                      if (hasBoardSize) {
                        const fit = calcBoardFit(order.sizeW, order.sizeL, jW3, jL3);
                        const pcsPerSlit = fit.piecesW * fit.piecesL;
                        if (pcsPerSlit > 0) prodPcsNeeded = Math.ceil(targetQty / pcsPerSlit);
                      }
                      // Use prodPcsNeeded as the slit qty to check against available, fallback to targetQty
                      const slitNeeded = prodPcsNeeded ?? targetQty;
                      const expectedRemaining = availableQty - slitNeeded;
                      const isInsufficient = slitNeeded > availableQty;
                      // Sync to outer scope via ref-like approach — store in data attr for button to read
                      // (React IIFE pattern: we set a variable that the button JSX below can read)
                      return (
                        <div className="mt-1.5 space-y-1.5">
                          {prodPcsNeeded !== null && (
                            <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border ${
                              isInsufficient ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                            }`}>
                              <span className={`text-xs font-semibold ${isInsufficient ? "text-red-700" : "text-blue-700"}`}>
                                needed slit
                              </span>
                              <span className={`text-xs font-bold ${isInsufficient ? "text-red-800" : "text-blue-800"}`}>
                                {prodPcsNeeded} pcs
                              </span>
                              <span className="text-xs text-muted-foreground">NPRM Modify Order</span>
                            </div>
                          )}
                          <div className={`rounded-lg px-2.5 py-1.5 border ${
                            isInsufficient ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                          }`}>
                            <div className={`text-[10px] leading-relaxed ${isInsufficient ? "text-red-700" : "text-foreground"}`}>
                              <span className="font-semibold">Total Stock {order.qty} pcs</span>
                              {prodPcsNeeded !== null && (
                                <>
                                  <span> − needed slit </span>
                                  <span className="font-bold">{slitNeeded} pcs</span>
                                  <span> NPRM Modify Order</span>
                                </>
                              )}
                              <span> = Available Qty: </span>
                              <span className={`font-bold ${isInsufficient ? "text-red-700" : "text-blue-700"}`}>{availableQty} pcs</span>
                            </div>
                            {isInsufficient && (
                              <div className="text-[10px] text-red-700 font-semibold mt-1">
                                ⚠ Expected Remaining: {expectedRemaining} pcs (insufficient!)
                              </div>
                            )}
                          </div>
                            )}
                            <div className="flex items-center justify-between border-t border-dashed border-gray-200 mt-1 pt-1">
                              <span className="text-[10px] uppercase tracking-wide font-semibold text-blue-700">Available Qty</span>
                              <span className="text-xs font-bold text-blue-800">{availableQty} pcs</span>
                            </div>
                            {prodPcsNeeded !== null && (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-purple-600 uppercase tracking-wide">Needed Slit (this order)</span>
                                <span className="text-xs font-bold text-purple-700">-{slitNeeded} pcs</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-0.5">
                              <span className={`text-[10px] uppercase tracking-wide font-semibold ${isInsufficient ? "text-red-700" : "text-emerald-700"}`}>Expected Remaining</span>
                              <span className={`text-xs font-bold ${isInsufficient ? "text-red-800" : "text-emerald-700"}`}>
                                {isInsufficient ? `⚠ Not enough! (${expectedRemaining} pcs)` : `${expectedRemaining} pcs`}
                              </span>
                            </div>
                          </div>
                          {isInsufficient && (
                            <div className="flex items-start gap-1.5 bg-red-100 border border-red-300 rounded-lg px-2.5 py-1.5">
                              <span className="text-red-600 text-xs mt-0.5">⚠️</span>
                              <p className="text-xs text-red-700 font-semibold">
                                Insufficient stock! Need {slitNeeded} pcs but only {availableQty} pcs available. Reduce the target qty or wait for other orders to complete.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {jobError && <p className="text-xs text-destructive">{jobError}</p>}
                {!showJobConfirm ? (
                  <button onClick={() => {
                    setJobError("");
                    if (!/^\d{8}$/.test(jobNo)) { setJobError("Job No must be exactly 8 digits (e.g. 02123456)."); return; }
                    if (!masterCard.trim()) { setJobError("MasterCard is required."); return; }
                    if (!boardSizeW || !boardSizeL) { setJobError("Board Size (W × L) is required."); return; }
                    // Block if board size is impossible (prod < job)
                    if (boardSizeW && boardSizeL) {
                      const jW2 = parseInt(boardSizeW); const jL2 = parseInt(boardSizeL);
                      if (!isNaN(jW2) && !isNaN(jL2)) {
                        const c2 = calcBoardFit(order.sizeW, order.sizeL, jW2, jL2);
                        if (c2.statusW === "impossible" || c2.statusL === "impossible") {
                          setJobError("Board size exceeds Production Order dimensions. NPRM Modify Order cannot be processed."); return;
                        }
                      }
                    }
                    const qty = parseInt(useQty);
                    if (!qty || qty <= 0) { setJobError("Enter a valid quantity."); return; }
                    setShowJobConfirm(true);
                  }} disabled={isInsufficientStock} className={`w-full text-white rounded-xl py-3 text-sm font-bold hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 ${userLevel === "1.1" ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-purple-500/25" : "bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-orange-500/25"}`}>
                    <Clock size={14} /> Submit for Approval
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 rounded-xl p-3 ${userLevel === "1.1" ? "bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200" : "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"}`}>
                      <AlertTriangle size={16} className={`flex-shrink-0 ${userLevel === "1.1" ? "text-purple-600" : "text-orange-600"}`} />
                      {userLevel === "1.1" ? (
                        <p className="text-xs text-purple-700">Submit to use <strong>{useQty} pcs</strong> for Job <strong>{jobNo}</strong>? Stock will be <strong>deducted immediately</strong>. Awaiting Level 2 final approval.</p>
                      ) : (
                        <p className="text-xs text-orange-700">Submit request to use <strong>{useQty} pcs</strong> for Job <strong>{jobNo}</strong>? This will be sent for Level 1.1 processing, then Level 2 approval.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowJobConfirm(false)} className="flex-1 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">Cancel</button>
                      <button onClick={handleJobRequest} disabled={submitRequest.isPending || isInsufficientStock} className={`flex-1 text-white rounded-xl py-2.5 text-sm font-bold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${userLevel === "1.1" ? "bg-gradient-to-r from-purple-600 to-violet-600" : "bg-gradient-to-r from-orange-500 to-amber-500"}`}>
                        {submitRequest.isPending ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "old_stock" && !showOldConfirm && (
            <div>
              <button onClick={() => setStep("choose")} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1 font-medium">← Back</button>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-red-700 mb-1 flex items-center gap-1.5"><AlertTriangle size={14} /> Warning</p>
                <p className="text-sm text-red-700">Request to clear all <strong>{availableQty} pcs</strong> and move to Out of Stock will be sent for approval.</p>
              </div>
              <button onClick={() => setShowOldConfirm(true)} className={`w-full text-white rounded-xl py-3 text-sm font-bold hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${userLevel === "1.1" ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-purple-500/25" : "bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-orange-500/25"}`}>
                <Package size={14} /> Request Old Stock Clear
              </button>
            </div>
          )}

          {step === "old_stock" && showOldConfirm && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Confirm Request</p>
                  <p className="text-[10px] text-gray-500">Requires Level 2 approval</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Submit a request to clear order <strong>{order.orderID}</strong> as Old Stock? A Level 2 user must approve before it takes effect.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowOldConfirm(false)} className="flex-1 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">Cancel</button>
                <button onClick={handleOldStockRequest} disabled={submitRequest.isPending} className={`flex-1 text-white rounded-xl py-2.5 text-sm font-bold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${userLevel === "1.1" ? "bg-gradient-to-r from-purple-600 to-violet-600" : "bg-gradient-to-r from-orange-500 to-amber-500"}`}>
                  {submitRequest.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Permission Denied Dialog */}
      <Dialog open={showPermissionDenied} onOpenChange={setShowPermissionDenied}>
        <DialogContent className="w-full max-w-sm md:max-w-2xl">
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
      <DialogContent className="w-full max-w-sm md:max-w-md">
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
  const notifyAll = trpc.push.sendToAll.useMutation();
  const createNotif = trpc.notifications.create.useMutation();

  const handleDelete = async () => {
    setError("");
    if (!workerID.trim()) { setError("Employee ID is required."); return; }
    try {
      await deleteOrder.mutateAsync({ id: order.id, orderID: order.orderID, fluteType: order.fluteType, sizeW: order.sizeW, sizeL: order.sizeL, qty: order.qty, bqComment: order.bqComment, workerID: workerID.trim() });
      toast.success("Order deleted.");
      notifyAll.mutate({
        title: "Order Deleted",
        body: `Purchase Order (${order.orderID}) has been permanently deleted by ${workerID.trim()}. ${order.qty} pcs removed from stock.`,
        type: "order",
        url: "/stock-history",
        tag: "deleted-" + order.orderID,
        orderID: order.orderID,
        requireInteraction: false,
      });
      createNotif.mutate({
        type: "order_deleted",
        title: `Order ${order.orderID} — Deleted`,
        message: `Production Order (${order.orderID}) has been permanently deleted by ${workerID.trim()}. ${order.qty} pcs removed from stock.`,
        orderID: order.orderID,
        qty: order.qty,
        fluteType: order.fluteType,
        workerID: workerID.trim(),
        trackingId: order.trackingId,
      });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Invalid Employee ID or failed to delete.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm md:max-w-2xl p-6 lg:p-8">
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
  const createNotif = trpc.notifications.create.useMutation();

  const handleRequest = async () => {
    setError("");
    try {
      const delResult = await submitRequest.mutateAsync({
        type: "delete",
        orderId: order.id,
        orderSnapshot: JSON.stringify(order),
        requestedBy: workerID,
      });
      const isDelProcessed = delResult.autoProcessApproved;
      if (isDelProcessed) {
        toast.success("Delete request submitted & auto process-approved! Awaiting Level 2 final approval.");
        notifyAll.mutate({
          title: "Delete Request In Process",
          body: `Purchase Order (${order.orderID}) delete request auto process-approved by ${workerID}. Awaiting Level 2 final approval.`,
          type: "approval",
          url: "/approval-center",
          tag: "delete-" + order.orderID,
          orderID: order.orderID,
          requireInteraction: true,
        });
      } else {
        toast.success("Delete request submitted! Awaiting Level 2 approval.");
        notifyAll.mutate({
          title: "New Delete Request",
          body: `Purchase Order (${order.orderID}) delete request submitted by ${workerID}. Pending Level 2 approval.`,
          type: "approval",
          url: "/approval-center",
          tag: "delete-" + order.orderID,
          orderID: order.orderID,
          requireInteraction: true,
        });
      }
      createNotif.mutate({
        type: isDelProcessed ? "order_in_process" : "order_request",
        title: isDelProcessed
          ? `Order ${order.orderID} — Delete Request In Process`
          : `Order ${order.orderID} — Delete Request`,
        message: isDelProcessed
          ? `Delete request for Order (${order.orderID}) auto process-approved by ${workerID}. Awaiting Level 2 final approval.`
          : `Order Delete request submitted by ${workerID} for Production Order (${order.orderID}). Pending Level 2 approval.`,
        orderID: order.orderID,
        fluteType: order.fluteType,
        workerID,
        trackingId: order.trackingId,
      });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Failed to submit request.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm md:max-w-2xl p-6 lg:p-8">
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
    const matchFlute = !searchFlute || o.fluteType === searchFlute; // Exact match for Flute Type
    const matchBQ = !searchBQ || o.bqComment.toLowerCase().includes(searchBQ.toLowerCase());
    return matchID && matchFlute && matchBQ;
  }), [orders, searchOrderID, searchFlute, searchBQ]);

  return (
    <AppLayout pageTitle="Stock History">
      {/* Enhanced Header with Level Badge and Refresh */}
      <div className="flex justify-between items-center px-4 lg:px-8 pt-5 pb-2">
        {(userLevel === "1" || userLevel === "1.1") && (
          <div className="flex items-center gap-2 text-xs text-orange-700 font-semibold bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 px-3 py-1.5 rounded-full shadow-sm">
            <Clock size={13} className="animate-pulse" /> {userLevel === "1.1" ? "Level 1.1 — Auto-approved" : "Level 1 — Requires Approval"}
          </div>
        )}
        {userLevel === "2" && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-sm">
            <Zap size={13} /> Level 2 — Direct Actions
          </div>
        )}
        <RefreshButton onRefresh={() => utils.orders.list.invalidate()} />
      </div>

      <main className="container lg:max-w-none lg:px-8 py-4">
        {/* Enhanced Tabs with pill style */}
        <div className="flex gap-1 mb-5 bg-gray-100/80 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveTab("current")} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === "current" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <span className="flex items-center gap-1.5"><Package size={14} /> Current Stock</span>
          </button>
          <button onClick={() => setActiveTab("out_of_stock")} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === "out_of_stock" ? "bg-white text-red-600 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> Out of Stock</span>
          </button>
        </div>

        {/* Enhanced Search with better styling */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="relative group">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input type="text" value={searchOrderID} onChange={e => setSearchOrderID(e.target.value.toUpperCase())} placeholder="Search Production Order…" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-sm transition-all" />
          </div>
          <select value={searchFlute} onChange={e => setSearchFlute(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-sm transition-all appearance-none cursor-pointer">
            <option value="">Select Flute Type</option>
            <option value="BA">BA</option>
            <option value="BE">BE</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="E">E</option>
          </select>
          <div className="relative group">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input type="text" value={searchBQ} onChange={e => setSearchBQ(e.target.value.toUpperCase())} placeholder={searchFlute ? "Search BQ Comment…" : "Select Flute Type first"} disabled={!searchFlute} className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-sm transition-all disabled:bg-gray-50/80 disabled:text-muted-foreground disabled:shadow-none" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted-foreground font-medium">{filtered.length} order{filtered.length !== 1 ? "s" : ""} found</p>
          {activeTab === "current" && filtered.some(o => o.qty < LOW_STOCK_THRESHOLD) && (
            <div className="flex items-center gap-1.5 text-xs text-orange-700 font-semibold bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 px-3 py-1.5 rounded-full shadow-sm animate-pulse">
              <AlertTriangle size={13} />
              {filtered.filter(o => o.qty < LOW_STOCK_THRESHOLD).length} low stock alert{filtered.filter(o => o.qty < LOW_STOCK_THRESHOLD).length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {ordersQuery.isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl animate-pulse" style={{animationDelay: `${i * 100}ms`}} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={40} className="text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto max-h-[calc(100vh-300px)]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b-2 border-border">
                    {(["Tracking ID","Production Order","Flute Type","Size (W×L)","Qty","BQ","Date", activeTab === "out_of_stock" ? "Auto-Delete" : null,"Actions"].filter(Boolean) as string[]).map(h => (
                      <th key={h} className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-left pb-3 pr-4 bg-background">{h}</th>
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
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{order.fluteType}</span>
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
                      {activeTab === "out_of_stock" && (() => {
                        const deleteDate = getAutoDeleteDate(order);
                        const urgency = getDeleteUrgency(deleteDate);
                        const daysLeft = Math.ceil((deleteDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <td className="py-3 pr-4">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                              urgency === "critical" ? "bg-red-100 text-red-700 border border-red-200" :
                              urgency === "warning" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                              "bg-orange-50 text-orange-600 border border-orange-100"
                            }`}>
                              <Clock size={11} className="flex-shrink-0" />
                              <span>{deleteDate.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </div>
                            <p className={`text-xs mt-0.5 ${
                              urgency === "critical" ? "text-red-500" :
                              urgency === "warning" ? "text-amber-500" : "text-orange-400"
                            }`}>{daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}</p>
                          </td>
                        );
                      })()}
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
                <div key={order.id} className={`border rounded-2xl shadow-sm p-4 space-y-3 transition-all duration-200 hover:shadow-md ${isLowStock ? "bg-gradient-to-br from-orange-50 to-amber-50/50 border-orange-200" : "bg-white border-gray-100 hover:border-primary/20"}`}>
                  {order.trackingId && <span className="hidden md:inline-block text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded font-mono font-bold">Ref: {order.trackingId}</span>}
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
                  {activeTab === "out_of_stock" && (() => {
                    const deleteDate = getAutoDeleteDate(order);
                    const urgency = getDeleteUrgency(deleteDate);
                    const daysLeft = Math.ceil((deleteDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
                        urgency === "critical" ? "bg-red-100 text-red-700 border border-red-200" :
                        urgency === "warning" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                        "bg-orange-50 text-orange-600 border border-orange-100"
                      }`}>
                        <Clock size={12} className="flex-shrink-0" />
                        <span>Auto-delete: {deleteDate.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</span>
                        <span className="opacity-70">({daysLeft > 0 ? `${daysLeft}d left` : "Overdue"})</span>
                      </div>
                    );
                  })()}
                  {activeTab === "current" && (
                    <button
                      onClick={() => setUsedUpdateOrder(order)}
                      className={`w-full text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${(userLevel === "1" || userLevel === "1.1") ? "bg-gradient-to-r from-orange-500 to-amber-500" : "gspp-gradient"}`}
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
