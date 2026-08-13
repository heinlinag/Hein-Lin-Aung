import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, RefreshCw, Trash2, Loader2, Package, Zap, X, AlertTriangle, Clock, FlaskConical, Truck, ChevronDown, Copy, Link } from "lucide-react";
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
  submittedBy: string | null; createdAt: Date; outOfStockAt?: Date | null; submittedVia?: "manual" | "scanner";
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
                <button
                  onClick={() => {
                    const trackingId = order.trackingId || order.orderID;
                    const link = `https://stockdash.click/check.qr/${trackingId}`;
                    navigator.clipboard.writeText(link).then(() => {
                      toast.success("Link copied!", { description: link });
                    }).catch(() => {
                      toast.error("Could not copy. Link: " + link);
                    });
                  }}
                  className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-100 rounded-xl hover:border-violet-400 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50/50 transition-all text-left group shadow-sm"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform"><Link size={16} className="text-white" /></div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Link Production Order</p>
                    <p className="text-xs text-muted-foreground">Copy shareable link to this order</p>
                  </div>
                  <Copy size={14} className="ml-auto text-muted-foreground group-hover:text-violet-500 transition-colors shrink-0" />
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
  const [step, setStep] = useState<"choose" | "job" | "old_stock" | "sample">("choose");
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
  // Sample request state
  const [sampleCustomerName, setSampleCustomerName] = useState("");
  const [sampleQty, setSampleQty] = useState<number | "">("");
  const [sampleRemark, setSampleRemark] = useState("");
  const [sampleDeliveryMold, setSampleDeliveryMold] = useState<"send_to_pp1" | "custom">("send_to_pp1");
  const [sampleDeliveryCustom, setSampleDeliveryCustom] = useState("");
  const [sampleError, setSampleError] = useState("");
  const [showSampleConfirm, setShowSampleConfirm] = useState(false);
  const createSample = trpc.customerSamples.create.useMutation();
  const submitRequest = trpc.pendingRequests.submit.useMutation();
  const notifyAll = trpc.push.sendToAll.useMutation();
  const createNotif = trpc.notifications.create.useMutation();
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
                <button onClick={() => setStep("sample")} className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-100 rounded-xl hover:border-emerald-400 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50/50 transition-all text-left group shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform"><FlaskConical size={16} className="text-white" /></div>
                  <div><p className="text-sm font-bold text-foreground">Request Sample</p><p className="text-xs text-muted-foreground">Send request Customer for item Sample</p></div>
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
                <button
                  onClick={() => {
                    const trackingId = order.trackingId || order.orderID;
                    const link = `https://stockdash.click/check.qr/${trackingId}`;
                    navigator.clipboard.writeText(link).then(() => {
                      toast.success("Link copied!", { description: link });
                    }).catch(() => {
                      toast.error("Could not copy. Link: " + link);
                    });
                  }}
                  className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-100 rounded-xl hover:border-violet-400 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50/50 transition-all text-left group shadow-sm"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform"><Link size={16} className="text-white" /></div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Link Production Order</p>
                    <p className="text-xs text-muted-foreground">Copy shareable link to this order</p>
                  </div>
                  <Copy size={14} className="ml-auto text-muted-foreground group-hover:text-violet-500 transition-colors shrink-0" />
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
                    {/* Production Order pcs needed calculation */}
                    {(() => {
                      const targetQty = parseInt(useQty);
                      const jW3 = parseInt(boardSizeW);
                      const jL3 = parseInt(boardSizeL);
                      if (!useQty || isNaN(targetQty) || targetQty <= 0) return null;
                      if (!boardSizeW || !boardSizeL || isNaN(jW3) || isNaN(jL3) || jW3 <= 0 || jL3 <= 0) return null;
                      const fit = calcBoardFit(order.sizeW, order.sizeL, jW3, jL3);
                      const pcsPerSlit = fit.piecesW * fit.piecesL;
                      if (pcsPerSlit <= 0) return null;
                      const prodPcsNeeded = Math.ceil(targetQty / pcsPerSlit);
                      return (
                        <div className="mt-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                          <p className="text-xs text-blue-800 font-semibold">needed slit (<span className="font-bold">{prodPcsNeeded} pcs</span>) NPRM Modify Order</p>
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
                  }} className={`w-full text-white rounded-xl py-3 text-sm font-bold hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${userLevel === "1.1" ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-purple-500/25" : "bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-orange-500/25"}`}>
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
                      <button onClick={handleJobRequest} disabled={submitRequest.isPending} className={`flex-1 text-white rounded-xl py-2.5 text-sm font-bold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${userLevel === "1.1" ? "bg-gradient-to-r from-purple-600 to-violet-600" : "bg-gradient-to-r from-orange-500 to-amber-500"}`}>
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

          {step === "sample" && (
            <div>
              <button onClick={() => { setStep("choose"); setSampleError(""); setShowSampleConfirm(false); }} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">← Back</button>
              <div className="space-y-3">
                {/* Auto-filled order info */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Production Order Info (Auto)</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Production Order:</span> <span className="font-bold">{order.orderID}</span></div>
                    <div><span className="text-muted-foreground">Flute Type:</span> <span className="font-bold">{order.fluteType}</span></div>
                    <div><span className="text-muted-foreground">Board Size:</span> <span className="font-bold">{order.sizeW} × {order.sizeL} mm</span></div>
                    <div><span className="text-muted-foreground">Current Qty:</span> <span className="font-bold">{order.qty} pcs</span></div>
                  </div>
                  <div className="text-xs"><span className="text-muted-foreground">BQ:</span> <span className="font-mono font-bold break-all">{order.bqComment}</span></div>
                </div>
                {/* Customer Name */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Customer Name <span className="text-destructive">*</span></label>
                  <input type="text" value={sampleCustomerName} onChange={e => { setSampleCustomerName(e.target.value); setSampleError(""); }} placeholder="e.g. ABC Sdn Bhd" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" autoFocus />
                </div>
                {/* Sample Qty */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Sample Qty (pcs) <span className="text-destructive">*</span></label>
                  <input type="number" min={1} step={1} value={sampleQty} onChange={e => { const v = e.target.value; if (v === "") { setSampleQty(""); setSampleError(""); return; } const n = parseInt(v, 10); if (!isNaN(n) && n >= 1) { setSampleQty(n); setSampleError(""); } }} onKeyDown={e => { if (["-", "+", "e", "E", ".", ","].includes(e.key)) e.preventDefault(); }} onPaste={e => { const text = e.clipboardData.getData("text"); if (!/^[0-9]+$/.test(text)) e.preventDefault(); }} placeholder="e.g. 5" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                {/* Remark */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Remark For Customer <span className="text-muted-foreground/60 normal-case font-normal">(Can you be highlights for message to customer)</span></label>
                  <textarea value={sampleRemark} onChange={e => setSampleRemark(e.target.value)} placeholder="Any notes or special instructions..." rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
                {/* Delivery Mold */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Delivery Mold <span className="text-destructive">*</span></label>
                  <div className="space-y-2">
                    <button onClick={() => setSampleDeliveryMold("send_to_pp1")} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                      sampleDeliveryMold === "send_to_pp1" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-emerald-300"
                    }`}>
                      <Truck size={14} className={sampleDeliveryMold === "send_to_pp1" ? "text-emerald-600" : "text-gray-400"} />
                      Send To PP1
                    </button>
                    <button onClick={() => setSampleDeliveryMold("custom")} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                      sampleDeliveryMold === "custom" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-emerald-300"
                    }`}>
                      <ChevronDown size={14} className={sampleDeliveryMold === "custom" ? "text-emerald-600" : "text-gray-400"} />
                      Custom (Remark)
                    </button>
                    {sampleDeliveryMold === "custom" && (
                      <input type="text" value={sampleDeliveryCustom} onChange={e => setSampleDeliveryCustom(e.target.value)} placeholder="Exp: Send To (Name)" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    )}
                  </div>
                </div>
                {sampleError && <p className="text-xs text-destructive">{sampleError}</p>}
                {!showSampleConfirm ? (
                  <button onClick={() => {
                    setSampleError("");
                    if (!sampleCustomerName.trim()) { setSampleError("Customer Name is required."); return; }
                    if (sampleQty === "" || sampleQty < 1) { setSampleError("Sample Qty is required (minimum 1)."); return; }
                    if (sampleDeliveryMold === "custom" && !sampleDeliveryCustom.trim()) { setSampleError("Please describe the custom delivery method."); return; }
                    setShowSampleConfirm(true);
                  }} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl py-2.5 text-sm font-bold hover:shadow-lg transition-all">
                    Submit Sample
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-emerald-700 mb-1">Confirm Sample Request</p>
                      <p className="text-xs text-muted-foreground">Customer: <strong>{sampleCustomerName}</strong></p>
                      <p className="text-xs text-muted-foreground">Sample Qty: <strong>{sampleQty} pcs</strong></p>
                      <p className="text-xs text-muted-foreground">Board Size: <strong>{order.sizeW} × {order.sizeL} mm</strong></p>
                      <p className="text-xs text-muted-foreground">Delivery: <strong>{sampleDeliveryMold === "send_to_pp1" ? "Send To PP1" : sampleDeliveryCustom}</strong></p>
                      {sampleRemark && <p className="text-xs text-muted-foreground">Remark: <strong>{sampleRemark}</strong></p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowSampleConfirm(false)} className="flex-1 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Back</button>
                      <button onClick={async () => {
                        setSampleError("");
                        try {
                          await createSample.mutateAsync({
                            orderId: order.id,
                            productionOrderID: order.orderID,
                            trackingId: order.trackingId ?? undefined,
                            fluteType: order.fluteType,
                            sizeW: order.sizeW,
                            sizeL: order.sizeL,
                            bqComment: order.bqComment,
                            currentQty: order.qty,
                            customerName: sampleCustomerName,
                            sampleQty: sampleQty as number,
                            remark: sampleRemark || undefined,
                            deliveryMold: sampleDeliveryMold,
                            deliveryMoldCustom: sampleDeliveryMold === "custom" ? sampleDeliveryCustom : undefined,
                            requestedBy: workerID,
                            workerName: workerID,
                          });
                          toast.success("Sample request submitted successfully!");
                          notifyAll.mutate({
                            title: "New Customer Sample Request",
                            body: `Sample request for ${order.orderID} — Customer: ${sampleCustomerName}`,
                            type: "approval",
                            url: "/customer-sample",
                            tag: "sample-" + order.orderID,
                            orderID: order.orderID,
                            requireInteraction: true,
                          });
                          createNotif.mutate({
                            type: "order_request",
                            title: `Sample Request — ${order.orderID}`,
                            message: `New sample request for Production Order ${order.orderID}. Customer: ${sampleCustomerName}. Board Size: ${order.sizeW}×${order.sizeL}mm.`,
                            orderID: order.orderID,
                            qty: order.qty,
                            fluteType: order.fluteType,
                            workerID,
                            trackingId: order.trackingId,
                          });
                          onSuccess();
                        } catch (err: unknown) {
                          const e = err as { message?: string };
                          setSampleError(e?.message ?? "Failed to submit sample request.");
                        }
                      }} disabled={createSample.isPending} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl py-2.5 text-sm font-bold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {createSample.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
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

// ─── Production Order Detail Dialog ───────────────────────────────────────────
function OrderDetailDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const inProcessQtyQuery = trpc.pendingRequests.getInProcessQty.useQuery(
    { orderId: order.id },
    { enabled: order.status === "current" },
  );
  const orderActivityUsageQuery = trpc.orders.getUsage.useQuery();
  const orderActivityAdjustmentsQuery = trpc.orders.getQrScanHistory.useQuery();
  const inProcessQty = inProcessQtyQuery.data?.inProcessQty ?? 0;
  const availableQty = Math.max(0, order.qty - inProcessQty);
  const isScannerOrder = order.submittedVia === "scanner";
  const statusColor = order.status === "current" ? "#34d399" : "#fb7185";

  const stockMovementEvents = [
    ...(orderActivityUsageQuery.data ?? [])
      .filter(entry => entry.orderID === order.orderID)
      .map(entry => ({
        id: `output-${entry.id}`,
        type: "output" as const,
        quantityDelta: -entry.usedQty,
        details: entry.purpose === "job" ? `Used for Job ${entry.jobNo ?? "N/A"}` : "Old stock cleared",
        reason: null as string | null,
        createdAt: entry.createdAt,
      })),
    ...(orderActivityAdjustmentsQuery.data ?? [])
      .filter(log => log.orderId === order.orderID && log.action === "balance_update" && log.oldQty !== null && log.newQty !== null)
      .map(log => {
        const quantityDelta = (log.newQty ?? 0) - (log.oldQty ?? 0);
        const source = log.adjustmentMethod === "scan" ? "QR / Barcode Scan" : "Manual Input";
        return {
          id: `adjustment-${log.id}`,
          type: "adjustment" as const,
          quantityDelta,
          details: `Balance adjustment · ${source}`,
          reason: log.adjustmentNote?.trim() || null,
          createdAt: log.createdAt,
        };
      }),
  ];
  const recordedCurrentQty = order.status === "out_of_stock" ? 0 : order.qty;
  const initialInputQty = Math.max(0, recordedCurrentQty - stockMovementEvents.reduce((total, event) => total + event.quantityDelta, 0));
  let runningBalance = 0;
  const orderActivity = [
    {
      id: `input-${order.id}`,
      type: "input" as const,
      quantityDelta: initialInputQty,
      details: "Initial stock added",
      reason: null as string | null,
      createdAt: order.createdAt,
    },
    ...stockMovementEvents,
  ]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(activity => ({ ...activity, runningBalance: Math.max(0, runningBalance += activity.quantityDelta) }))
    .reverse();

  const detailItems = [
    { label: "Production Order", value: order.orderID, mono: true },
    { label: "Tracking ID", value: order.trackingId || "N/A", mono: true },
    { label: "Flute Type", value: order.fluteType },
    { label: "Board Size", value: `${order.sizeW} × ${order.sizeL} mm`, mono: true },
    { label: "Current Qty", value: `${order.qty} pcs` },
    { label: "Submitted By", value: order.submittedBy || "N/A", mono: true },
    { label: "Added", value: new Date(order.createdAt).toLocaleString() },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={`${order.orderID} order details`}
        onClick={event => event.stopPropagation()}
      >
        <div className="relative overflow-hidden px-5 pb-5 pt-5" style={{ background: "linear-gradient(135deg, #172554, #312e81 55%, #0f766e)" }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 85% 15%, #ffffff 0, transparent 27%)" }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-lg">
                <Package size={21} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-200">Production Order Details</p>
                <h2 className="mt-0.5 truncate text-lg font-black text-white">{order.orderID}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide" style={{ background: `${statusColor}22`, border: `1px solid ${statusColor}55`, color: statusColor }}>
                    {order.status === "current" ? "Current Stock" : "Out of Stock"}
                  </span>
                  {isScannerOrder && <span className="rounded-full border border-indigo-300/30 bg-indigo-300/15 px-2 py-0.5 text-[9px] font-black text-indigo-100">AI Scanned</span>}
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70" aria-label="Close order details">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-145px)] overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-2.5">
            {detailItems.map(item => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                <p className={`mt-1 break-words text-xs font-bold text-white ${item.mono ? "font-mono" : ""}`}>{item.value}</p>
              </div>
            ))}
            {order.status === "current" && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300/70">Available Qty</p>
                <p className="mt-1 text-xs font-black text-emerald-300">{availableQty} pcs</p>
                {inProcessQty > 0 && <p className="mt-0.5 text-[9px] font-medium text-emerald-200/60">{inProcessQty} pcs in process</p>}
              </div>
            )}
            {order.status === "out_of_stock" && order.outOfStockAt && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-rose-300/70">Out of Stock Since</p>
                <p className="mt-1 text-xs font-bold text-rose-200">{new Date(order.outOfStockAt).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="mt-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-3.5">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-amber-200/70">BQ Comment</p>
            <p className="mt-1.5 break-all font-mono text-xs font-bold leading-relaxed text-amber-100">{order.bqComment}</p>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.035] px-3.5 py-3">
            <span className="text-[10px] font-bold text-slate-400">Submission method</span>
            <span className="text-[10px] font-black text-white">{isScannerOrder ? "Auto Scanner" : "Manual Entry"}</span>
          </div>

          <section className="mt-3 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035]" aria-label="Input and output activity">
            <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-200">Input / Output Activity</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Stock movement for this production order</p>
              </div>
              <span className="rounded-full border border-indigo-300/20 bg-indigo-300/10 px-2 py-0.5 text-[9px] font-black text-indigo-100">{orderActivity.length} events</span>
            </div>

            {orderActivityUsageQuery.isLoading || orderActivityAdjustmentsQuery.isLoading ? (
              <div className="space-y-2 p-3.5" aria-label="Loading order activity">
                {[0, 1].map(index => <div key={index} className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />)}
              </div>
            ) : (
              <div className="divide-y divide-white/7">
                {orderActivity.map(activity => {
                  const isInput = activity.quantityDelta >= 0;
                  const eventLabel = activity.type === "adjustment"
                    ? `${isInput ? "Input" : "Output"} Adjustment`
                    : isInput ? "Stock Input" : "Stock Output";
                  return (
                    <div key={activity.id} className="flex gap-3 px-3.5 py-3">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[9px] font-black ${isInput ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-rose-400/25 bg-rose-400/10 text-rose-300"}`}>
                        {isInput ? "IN" : "OUT"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-black text-white">{eventLabel}</p>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span className={`text-[11px] font-black ${isInput ? "text-emerald-300" : "text-rose-300"}`}>
                              {isInput ? "+" : "−"}{Math.abs(activity.quantityDelta)} pcs
                            </span>
                            <span className="rounded-lg border border-white/10 bg-white/[0.055] px-1.5 py-0.5 text-[9px] font-black text-slate-200" title="Balance after this movement">
                              Bal. {activity.runningBalance} pcs
                            </span>
                          </div>
                        </div>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400">{activity.details}</p>
                        {activity.reason && <p className="mt-1 rounded-lg bg-white/[0.045] px-2 py-1 text-[10px] leading-relaxed text-slate-300">Reason: {activity.reason}</p>}
                        <p className="mt-1 text-[9px] text-slate-500">{new Date(activity.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
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
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [showDeletePermissionDenied, setShowDeletePermissionDenied] = useState(false);
  const [autoDeleteSort, setAutoDeleteSort] = useState<"asc" | "desc" | null>(null);
  const [autoDeleteFilter, setAutoDeleteFilter] = useState<"all" | "critical" | "warning" | "normal">("all");

  const ordersQuery = trpc.orders.list.useQuery({ status: activeTab });
  const utils = trpc.useUtils();
  const orders = (ordersQuery.data ?? []) as Order[];

  const filtered = useMemo(() => {
    let result = orders.filter(o => {
      const matchID = !searchOrderID || o.orderID.toLowerCase().includes(searchOrderID.toLowerCase());
      const matchFlute = !searchFlute || o.fluteType === searchFlute;
      const matchBQ = !searchBQ || o.bqComment.toLowerCase().includes(searchBQ.toLowerCase());
      if (!matchID || !matchFlute || !matchBQ) return false;
      // Auto-Delete urgency filter (only applies to out_of_stock tab)
      if (activeTab === "out_of_stock" && autoDeleteFilter !== "all") {
        const urgency = getDeleteUrgency(getAutoDeleteDate(o));
        if (urgency !== autoDeleteFilter) return false;
      }
      return true;
    });
    // Auto-Delete date sort (only applies to out_of_stock tab)
    if (activeTab === "out_of_stock" && autoDeleteSort !== null) {
      result = [...result].sort((a, b) => {
        const da = getAutoDeleteDate(a).getTime();
        const db = getAutoDeleteDate(b).getTime();
        return autoDeleteSort === "asc" ? da - db : db - da;
      });
    }
    return result;
  }, [orders, searchOrderID, searchFlute, searchBQ, activeTab, autoDeleteSort, autoDeleteFilter]);

  return (
    <AppLayout pageTitle="Stock History">
      {/* Glassmorphism Hero Banner */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
        </div>
        <div className="relative px-4 lg:px-8 xl:px-10 py-6 lg:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl shrink-0"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Package size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight" style={{ fontFamily: "Lora, serif" }}>Stock History</h1>
                <div className="flex items-center gap-2 mt-1">
                  {(userLevel === "1" || userLevel === "1.1") && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-amber-200"
                      style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)" }}>
                      <Clock size={10} className="animate-pulse" />
                      {userLevel === "1.1" ? "Level 1.1 — Auto-approved" : "Level 1 — Requires Approval"}
                    </span>
                  )}
                  {userLevel === "2" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-emerald-200"
                      style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)" }}>
                      <Zap size={10} /> Level 2 — Direct Actions
                    </span>
                  )}
                </div>
              </div>
            </div>
            <RefreshButton onRefresh={() => utils.orders.list.invalidate()} />
          </div>
        </div>
      </div>

      <main className="container lg:max-w-none lg:px-8 xl:px-10 py-4">
        {/* Glassmorphism Tabs */}
        <div className="flex gap-1.5 mb-4 md:mb-5 p-1.5 rounded-2xl w-fit"
          style={{ background: "rgba(241,245,249,0.8)", border: "1px solid rgba(226,232,240,0.6)" }}>
          <button onClick={() => setActiveTab("current")}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            style={activeTab === "current" ? {
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            } : { color: "#64748b" }}>
            <Package size={14} /> Current Stock
          </button>
          <button onClick={() => setActiveTab("out_of_stock")}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            style={activeTab === "out_of_stock" ? {
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
            } : { color: "#64748b" }}>
            <AlertTriangle size={14} /> Out of Stock
          </button>
        </div>

        {/* Glassmorphism Sticky Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-5 sticky top-0 z-10 py-3 -mx-4 md:-mx-6 lg:-mx-8 xl:-mx-10 px-4 md:px-6 lg:px-8 xl:px-10"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div className="relative group">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" value={searchOrderID} onChange={e => setSearchOrderID(e.target.value.toUpperCase())} placeholder="Search Production Order…"
              className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all"
              style={{ background: "rgba(241,245,249,0.8)", border: "1px solid rgba(226,232,240,0.8)" }}
              onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e => { e.currentTarget.style.border = "1px solid rgba(226,232,240,0.8)"; e.currentTarget.style.boxShadow = ""; }} />
          </div>
          <select value={searchFlute} onChange={e => setSearchFlute(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all appearance-none cursor-pointer"
            style={{ background: "rgba(241,245,249,0.8)", border: "1px solid rgba(226,232,240,0.8)" }}>
            <option value="">Select Flute Type</option>
            <option value="BA">BA</option>
            <option value="BE">BE</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="E">E</option>
          </select>
          <div className="relative group">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" value={searchBQ} onChange={e => setSearchBQ(e.target.value.toUpperCase())} placeholder={searchFlute ? "Search BQ Comment…" : "Select Flute Type first"} disabled={!searchFlute}
              className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "rgba(241,245,249,0.8)", border: "1px solid rgba(226,232,240,0.8)" }}
              onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e => { e.currentTarget.style.border = "1px solid rgba(226,232,240,0.8)"; e.currentTarget.style.boxShadow = ""; }} />
          </div>
        </div>

        {/* Auto-Delete Sort & Filter — only for Out of Stock tab */}
        {activeTab === "out_of_stock" && (
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-orange-50/60 border border-orange-100 rounded-xl">
            <span className="text-xs font-semibold text-orange-700 flex items-center gap-1"><Clock size={12} /> Auto-Delete:</span>
            {/* Sort buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAutoDeleteSort(s => s === "asc" ? null : "asc")}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition-all ${autoDeleteSort === "asc" ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-white text-orange-600 border-orange-200 hover:border-orange-400"}`}
              >
                ↑ Soonest First
              </button>
              <button
                onClick={() => setAutoDeleteSort(s => s === "desc" ? null : "desc")}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition-all ${autoDeleteSort === "desc" ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-white text-orange-600 border-orange-200 hover:border-orange-400"}`}
              >
                ↓ Latest First
              </button>
            </div>
            <div className="w-px h-5 bg-orange-200 mx-1" />
            {/* Urgency filter buttons */}
            <div className="flex items-center gap-1">
              {(["all", "critical", "warning", "normal"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAutoDeleteFilter(f)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition-all ${
                    autoDeleteFilter === f
                      ? f === "critical" ? "bg-red-500 text-white border-red-500 shadow-sm"
                        : f === "warning" ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : f === "normal" ? "bg-orange-400 text-white border-orange-400 shadow-sm"
                        : "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : f === "critical" ? "bg-white text-red-600 border-red-200 hover:border-red-400"
                        : f === "warning" ? "bg-white text-amber-600 border-amber-200 hover:border-amber-400"
                        : f === "normal" ? "bg-white text-orange-500 border-orange-100 hover:border-orange-300"
                        : "bg-white text-orange-600 border-orange-200 hover:border-orange-400"
                  }`}
                >
                  {f === "all" ? "All" : f === "critical" ? "🔴 ≤30d" : f === "warning" ? "🟡 ≤90d" : "🟠 >90d"}
                </button>
              ))}
            </div>
            {(autoDeleteSort !== null || autoDeleteFilter !== "all") && (
              <button
                onClick={() => { setAutoDeleteSort(null); setAutoDeleteFilter("all"); }}
                className="text-xs px-2 py-1.5 rounded-lg text-muted-foreground hover:text-destructive border border-gray-200 bg-white hover:border-red-200 transition-all"
              >
                ✕ Reset
              </button>
            )}
          </div>
        )}
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
                    {(["Tracking ID","Production Order","Flute Type","Size (W×L)","Qty","BQ", activeTab === "out_of_stock" ? "Auto-Delete" : null,"Actions"].filter(Boolean) as string[]).map(h => (
                      <th key={h} className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-left pb-3 pr-4 bg-background">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const isLowStock = activeTab === "current" && order.qty < LOW_STOCK_THRESHOLD;
                    return (
                    <tr key={order.id} onClick={() => setSelectedOrderDetails(order)} className={`cursor-pointer border-b border-border transition-colors hover:bg-indigo-50/60 ${isLowStock ? "bg-orange-50/40" : ""}`}>
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
                              onClick={event => { event.stopPropagation(); setUsedUpdateOrder(order); }}
                              className={`text-xs px-2.5 py-1 rounded-lg font-semibold hover:opacity-90 whitespace-nowrap ${(userLevel === "1" || userLevel === "1.1") ? "bg-orange-500 text-white" : "bg-primary text-white"}`}
                            >
                              Purchase Order
                            </button>
                          )}
                          <div onClick={event => event.stopPropagation()}>
                            <A4Label
                              orderId={order.orderID}
                              trackingId={order.trackingId}
                              orderQty={order.qty}
                              masterCard={order.bqComment}
                              boardSize={`${order.sizeW}×${order.sizeL}`}
                              fluteType={order.fluteType}
                              bqComment={order.bqComment}
                            />
                          </div>
                          <button onClick={event => {
                            event.stopPropagation();
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

            {/* Mobile cards — glassmorphism */}
            <div className="md:hidden space-y-3">
              {filtered.map(order => {
                const isLowStock = activeTab === "current" && order.qty < LOW_STOCK_THRESHOLD;
                return (
                <div key={order.id} onClick={() => setSelectedOrderDetails(order)} role="button" tabIndex={0}
                  onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedOrderDetails(order); } }}
                  className="relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: isLowStock ? "linear-gradient(135deg, rgba(255,237,213,0.9), rgba(254,243,199,0.8))" : "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(16px)",
                    border: isLowStock ? "1px solid rgba(251,146,60,0.3)" : "1px solid rgba(255,255,255,0.9)",
                    boxShadow: isLowStock ? "0 4px 20px rgba(251,146,60,0.12), 0 1px 4px rgba(0,0,0,0.04)" : "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                  <div className="absolute top-0 inset-x-0 h-0.5"
                    style={{ background: isLowStock ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
                  <div className="p-4 space-y-3">
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
                    <button onClick={event => {
                      event.stopPropagation();
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
                      onClick={event => { event.stopPropagation(); setUsedUpdateOrder(order); }}
                      className={`w-full text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${(userLevel === "1" || userLevel === "1.1") ? "bg-gradient-to-r from-orange-500 to-amber-500" : "gspp-gradient"}`}
                    >
                      <><Zap size={14} /> Purchase Order</>
                    </button>
                  )}
                  </div>
                </div>
              );
            })}
            </div>
          </>
        )}
      </main>

      {/* Dialogs: Level 1 gets request dialogs, Level 2 gets direct action dialogs */}
      {selectedOrderDetails && <OrderDetailDialog order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} />}
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
