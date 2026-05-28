import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Send, Loader2, AlertTriangle, Package, Layers, Ruler, Hash, FileText, CheckCircle2, ArrowRight } from "lucide-react";
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
  const [currentStep, setCurrentStep] = useState(1);

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

  // Track form progress
  useEffect(() => {
    const effectiveFluteType = fluteType === "Manual" ? manualFlute.trim() : fluteType;
    if (bqComment.trim()) setCurrentStep(4);
    else if (sizeW && sizeL && qty) setCurrentStep(3);
    else if (orderID.trim() && effectiveFluteType) setCurrentStep(2);
    else setCurrentStep(1);
  }, [orderID, fluteType, manualFlute, sizeW, sizeL, qty, bqComment]);

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
      toast.error(`Production Order "${orderID.trim()}" already exists.`);
      return;
    }
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

  return (
    <AppLayout pageTitle="Submit Order">
      {/* Worker Banner */}
      {worker && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-2.5 px-4 flex items-center justify-center gap-2 text-xs shadow-sm">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-[10px] font-bold">{worker.name.charAt(0)}</span>
          </div>
          <span>Logged in as <strong>{worker.name}</strong> ({worker.workerID}) &middot; {worker.department}</span>
        </div>
      )}

      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
        <div className="max-w-2xl mx-auto lg:mx-0">
          {/* Page heading (mobile only) */}
          <div className="lg:hidden mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Package size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Submit Order</h2>
                <p className="text-[10px] text-muted-foreground">Create a new production order</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-4 hidden sm:block">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-gray-200 rounded-full" />
              <div className="absolute top-3.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }} />
              {[
                { step: 1, label: "Order Info", icon: Package },
                { step: 2, label: "Dimensions", icon: Ruler },
                { step: 3, label: "BQ Formula", icon: FileText },
                { step: 4, label: "Review", icon: CheckCircle2 },
              ].map(({ step, label, icon: Icon }) => (
                <div key={step} className="relative flex flex-col items-center z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= step ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30" : "bg-gray-100 text-gray-400 border-2 border-gray-200"}`}>
                    <Icon size={12} />
                  </div>
                  <span className={`text-[9px] mt-1 font-medium ${currentStep >= step ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Section 1: Order Info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3 transition-all hover:shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                  <Package size={12} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Order Information</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Production Order */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Production Order <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderID}
                      onChange={e => setOrderID(e.target.value.toUpperCase())}
                      placeholder="Enter order ID"
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-all ${isDuplicate ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-blue-400 focus:border-blue-400"}`}
                    />
                    {!isDuplicate && debouncedOrderID && duplicateCheck.data && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 size={16} className="text-green-500" />
                      </div>
                    )}
                  </div>
                  {isDuplicate && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                      <AlertTriangle size={12} /> <strong>{debouncedOrderID}</strong> already exists
                    </p>
                  )}
                  {!isDuplicate && debouncedOrderID && duplicateCheck.data && (
                    <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Available
                    </p>
                  )}
                </div>

                {/* Flute Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Flute Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {FLUTE_TYPES.filter(ft => ft !== "Manual").map(ft => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => setFluteType(ft)}
                        className={`py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${fluteType === ft ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50"}`}
                      >
                        {ft}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFluteType("Manual")}
                      className={`py-1.5 text-xs font-bold rounded-lg border-2 transition-all col-span-2 ${fluteType === "Manual" ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm" : "border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50/50"}`}
                    >
                      Manual
                    </button>
                  </div>
                  {fluteType === "Manual" && (
                    <input
                      type="text"
                      value={manualFlute}
                      onChange={e => setManualFlute(e.target.value)}
                      placeholder="Enter custom flute type"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-gray-50 focus:bg-white transition-all"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Dimensions & Qty */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3 transition-all hover:shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                  <Ruler size={12} className="text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Dimensions & Quantity</h3>
              </div>

              <div className="space-y-3">
                {/* Size */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Size (W x L) mm <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={sizeW}
                      onChange={e => setSizeW(e.target.value)}
                      placeholder="Width"
                      min={1}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-gray-50 focus:bg-white transition-all"
                    />
                    <span className="text-gray-400 font-bold text-sm">&times;</span>
                    <input
                      type="number"
                      value={sizeL}
                      onChange={e => setSizeL(e.target.value)}
                      placeholder="Length"
                      min={1}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Order Qty */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Order Qty (pcs) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={qty}
                      onChange={e => setQty(e.target.value)}
                      placeholder="Enter quantity"
                      min={1}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-gray-50 focus:bg-white transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Hash size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: BQ Comment */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-2.5 transition-all hover:shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                  <Layers size={12} className="text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-foreground">BQ Comment</h3>
                <span className="text-[10px] text-gray-400 ml-auto">Board Quality formula</span>
              </div>

              {/* BQ Shortcut Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {["LR", "MP", "KL", "LP", "KC", "WT"].map(prefix => (
                  <button
                    key={prefix}
                    type="button"
                    onClick={() => setBqComment(prev => prev + prefix)}
                    className="px-2.5 py-1 text-xs font-bold rounded-md bg-gradient-to-b from-white to-gray-50 border border-gray-200 text-gray-700 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-all shadow-sm active:scale-95 font-mono"
                  >
                    {prefix}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setBqComment("")}
                  className="px-2.5 py-1 text-xs font-bold rounded-md border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all ml-auto"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={bqComment}
                onChange={e => setBqComment(e.target.value.toUpperCase())}
                placeholder="e.g. LR170MP115MP115MP115LR170"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-gray-50 focus:bg-white transition-all resize-none font-mono"
              />
              {bqComment && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-amber-600 font-semibold mb-0.5">Preview</p>
                  <p className="text-xs font-mono font-bold text-amber-800 break-all">{bqComment}</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={submitOrder.isPending}
                className="w-full lg:w-auto lg:px-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl py-3 text-sm font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {submitOrder.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Send size={16} /> Submit Order <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                  <AlertTriangle size={22} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Confirm Submission</h3>
                  <p className="text-xs text-gray-500">Review your order details</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4 mb-5 space-y-2.5 border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Production Order</span>
                  <span className="font-bold text-blue-700">{orderID.trim()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Flute Type</span>
                  <span className="font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs">{fluteType === "Manual" ? manualFlute.trim() : fluteType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Size</span>
                  <span className="font-mono text-xs">{sizeW} &times; {sizeL} mm</span>
                </div>
                <div className="flex justify-between text-sm items-start">
                  <span className="text-gray-500">BQ</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-mono font-semibold text-[10px] break-words max-w-[60%] text-right">{bqComment}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Qty</span>
                  <span className="font-bold text-lg text-emerald-700">{qty} <span className="text-xs font-normal text-gray-500">pcs</span></span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedSubmit}
                  disabled={submitOrder.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen */}
      {successData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              {/* Success Animation */}
              <style>{`
                @keyframes successPop {
                  0% { transform: scale(0); opacity: 0; }
                  50% { transform: scale(1.2); }
                  100% { transform: scale(1); opacity: 1; }
                }
                .success-pop { animation: successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
              `}</style>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4 success-pop">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-1">Order Submitted!</h3>
              <p className="text-sm text-gray-500 mb-6">Your order has been created successfully</p>
              
              {/* Tracking ID */}
              <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 rounded-xl p-4 mb-5 border border-teal-200">
                <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mb-1">Tracking ID</p>
                <p className="text-xl font-bold text-teal-700 font-mono break-all">{successData.trackingId}</p>
              </div>
              
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-2 border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Production Order</span>
                  <span className="font-bold text-blue-700">{successData.orderID}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Flute</span>
                  <span className="font-semibold">{successData.fluteType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Size</span>
                  <span className="font-mono text-xs">{successData.sizeW} &times; {successData.sizeL} mm</span>
                </div>
                <div className="flex justify-between text-sm items-start">
                  <span className="text-gray-500">BQ</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono font-semibold text-[10px] break-words max-w-[60%] text-right">{successData.bqComment}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Qty</span>
                  <span className="font-bold">{successData.qty} pcs</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSuccessData(null);
                    navigate("/stock-history");
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl py-3 text-sm font-bold text-white hover:shadow-lg transition-all"
                >
                  View Stock
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
                  className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  New Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
