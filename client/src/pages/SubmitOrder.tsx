import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

const FLUTE_TYPES = ["BA", "BE", "C", "A", "B", "E", "Manual"] as const;

export default function SubmitOrder() {
  const [, navigate] = useLocation();
  const { worker } = useAuth();

  const [orderID, setOrderID] = useState("");
  const [fluteType, setFluteType] = useState("");
  const [manualFlute, setManualFlute] = useState("");
  const [sizeW, setSizeW] = useState("");
  const [sizeL, setSizeL] = useState("");
  const [qty, setQty] = useState("");
  const [bqComment, setBqComment] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [successData, setSuccessData] = useState<{ trackingId: string; orderID: string; fluteType: string; sizeW: number; sizeL: number; qty: number; bqComment: string } | null>(null);

  const notifyAll = trpc.push.sendToAll.useMutation();
  const submitOrder = trpc.orders.submit.useMutation();

  // Debounced Production Order duplicate check
  const [debouncedOrderID, setDebouncedOrderID] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrderID(orderID.trim()), 500);
    return () => clearTimeout(t);
  }, [orderID]);
  const duplicateCheck = trpc.orders.checkOrderId.useQuery(
    { orderID: debouncedOrderID },
    { enabled: debouncedOrderID.length > 0 }
  );
  const isDuplicate = duplicateCheck.data?.exists === true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) {
      toast.error("Please login first.");
      navigate("/login");
      return;
    }

    const effectiveFluteType = fluteType === "Manual" ? manualFlute.trim() : fluteType;
    if (!orderID.trim() || !effectiveFluteType || !sizeW || !sizeL || !qty || !bqComment.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (isDuplicate) {
      toast.error(`Production Order "${orderID.trim()}" already exists. Please use a different Production Order.`);
      return;
    }
    // Show confirmation dialog before submitting
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false);
    if (!worker) return;
    const effectiveFluteType = fluteType === "Manual" ? manualFlute.trim() : fluteType;
    try {
      const result = await submitOrder.mutateAsync({
        orderID: orderID.trim(),
        fluteType: effectiveFluteType,
        sizeW: parseInt(sizeW),
        sizeL: parseInt(sizeL),
        qty: parseInt(qty),
        bqComment: bqComment.trim(),
        workerID: worker.workerID,
      });
      toast.success("Order submitted successfully!");
      notifyAll.mutate({ title: "New Order Submitted", body: "Order " + orderID.trim() + " (" + effectiveFluteType + ") submitted by " + (worker?.name ?? "Worker"), tag: "new-order" });
      setSuccessData({
        trackingId: result.trackingId,
        orderID: orderID.trim(),
        fluteType: effectiveFluteType,
        sizeW: parseInt(sizeW),
        sizeL: parseInt(sizeL),
        qty: parseInt(qty),
        bqComment: bqComment.trim(),
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to submit order.");
    }
  };

  const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white";
  const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

  return (
    <AppLayout pageTitle="Submit Order">
      {/* Worker Banner */}
      {worker && (
        <div className="gspp-gradient text-white py-2 px-4 text-center text-xs">
          Logged in as <strong>{worker.name}</strong> ({worker.workerID}) · {worker.department}
        </div>
      )}

      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-2xl mx-auto lg:mx-0">
          {/* Page heading (mobile only — desktop uses AppLayout pageTitle bar) */}
          <h2 className="lg:hidden text-lg font-bold text-foreground mb-5" style={{ fontFamily: "Lora, serif" }}>
            Submit Order
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Production Order + Flute Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Production Order */}
              <div>
                <label className={labelCls}>
                  Production Order <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={orderID}
                  onChange={e => setOrderID(e.target.value.toUpperCase())}
                  placeholder="e.g. A-203"
                  className={`${inputCls} ${isDuplicate ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                {isDuplicate && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> Production Order <strong>{debouncedOrderID}</strong> already exists in the system.
                  </p>
                )}
                {!isDuplicate && debouncedOrderID && duplicateCheck.data && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <span>✓</span> Production Order is available.
                  </p>
                )}
              </div>

              {/* Flute Type */}
              <div>
                <label className={labelCls}>
                  Flute Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={fluteType}
                  onChange={e => setFluteType(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select flute type</option>
                  {FLUTE_TYPES.map(ft => (
                    <option key={ft} value={ft}>{ft}</option>
                  ))}
                </select>
                {fluteType === "Manual" && (
                  <input
                    type="text"
                    value={manualFlute}
                    onChange={e => setManualFlute(e.target.value)}
                    placeholder="Enter custom flute type"
                    className={`${inputCls} mt-2`}
                  />
                )}
              </div>
            </div>

            {/* Row 2: Size W x L + Qty */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Size */}
              <div>
                <label className={labelCls}>
                  Size (W × L) <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Width (mm)</p>
                    <input
                      type="number"
                      value={sizeW}
                      onChange={e => setSizeW(e.target.value)}
                      placeholder="1530"
                      min={1}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Length (mm)</p>
                    <input
                      type="number"
                      value={sizeL}
                      onChange={e => setSizeL(e.target.value)}
                      placeholder="1800"
                      min={1}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Order Qty */}
              <div>
                <label className={labelCls}>
                  Order Qty (pcs) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder="100"
                  min={1}
                  className={inputCls}
                />
              </div>
            </div>

            {/* BQ Comment */}
            <div>
              <label className={labelCls}>
                BQ Comment <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-1.5">Board Quality formula string</p>
              {/* BQ Shortcut Buttons */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {["LR", "MP", "KL", "LP", "KC", "WT"].map(prefix => (
                  <button
                    key={prefix}
                    type="button"
                    onClick={() => setBqComment(prev => prev + prefix)}
                    className="px-2.5 py-1 text-xs font-bold rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors font-mono"
                  >
                    {prefix}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setBqComment("")}
                  className="px-2.5 py-1 text-xs font-bold rounded-md border border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors ml-auto"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={bqComment}
                onChange={e => setBqComment(e.target.value.toUpperCase())}
                placeholder="e.g. LR170MP115MP115MP115LR170"
                rows={3}
                className={`${inputCls} resize-none font-mono`}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitOrder.isPending}
                className="w-full lg:w-auto lg:px-10 gspp-gradient text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitOrder.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Send size={16} /> Submit Order</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Submit Order Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Confirm Order Submission</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Production Order</span>
                  <span className="font-bold text-blue-700">{orderID.trim()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Flute Type</span>
                  <span className="font-semibold">{fluteType === "Manual" ? manualFlute.trim() : fluteType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Size</span>
                  <span className="font-mono">{sizeW} × {sizeL} mm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">BQ</span>
                  <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono font-semibold text-[10px] break-words">{bqComment}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Qty</span>
                  <span className="font-semibold">{qty} pcs</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">Are you sure you want to submit this order?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleConfirmedSubmit}
                  disabled={submitOrder.isPending}
                  className="flex-1 gspp-gradient rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen Dialog */}
      {successData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Order Submitted Successfully!</h3>
              <p className="text-sm text-gray-600 mb-6">Your order has been created and is ready for processing.</p>
              
              {/* Tracking ID Display */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 mb-6 border border-teal-200">
                <p className="text-xs text-teal-600 font-semibold mb-1 uppercase tracking-wide">Tracking ID (Reference Number)</p>
                <p className="text-2xl font-bold text-teal-700 font-mono break-all">{successData.trackingId}</p>
              </div>
              
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Production Order</span>
                  <span className="font-bold text-blue-700">{successData.orderID}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Flute Type</span>
                  <span className="font-semibold">{successData.fluteType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size</span>
                  <span className="font-mono">{successData.sizeW} × {successData.sizeL} mm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">BQ</span>
                  <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono font-semibold text-[10px] break-words">{successData.bqComment}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-semibold">{successData.qty} pcs</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSuccessData(null);
                    navigate("/stock-history");
                  }}
                  className="flex-1 gspp-gradient rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  View in Stock History
                </button>
                <button
                  onClick={() => {
                    setSuccessData(null);
                    setOrderID("");
                    setFluteType("");
                    setManualFlute("");
                    setSizeW("");
                    setSizeL("");
                    setQty("");
                    setBqComment("");
                  }}
                  className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Submit Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
