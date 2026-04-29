import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";

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

  const notifyAll = trpc.push.sendToAll.useMutation();
  const submitOrder = trpc.orders.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      await submitOrder.mutateAsync({
        orderID: orderID.trim(),
        fluteType: effectiveFluteType,
        sizeW: parseInt(sizeW),
        sizeL: parseInt(sizeL),
        qty: parseInt(qty),
        bqComment: bqComment.trim(),
        workerID: worker.workerID,
      });
      toast.success("Order submitted successfully!");
      notifyAll.mutate({ title: "New Order Submitted", body: "Order " + orderID.trim() + " (" + (fluteType === "Manual" ? manualFlute.trim() : fluteType) + ") submitted by " + (worker?.name ?? "Worker"), tag: "new-order" });
      navigate("/stock-history");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to submit order.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader showBack backHref="/" />

      {/* Worker Banner */}
      {worker && (
        <div className="gspp-gradient text-white py-2 px-4 text-center text-xs">
          Logged in as <strong>{worker.name}</strong> ({worker.workerID}) · {worker.department}
        </div>
      )}

      <main className="container py-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-foreground mb-5" style={{ fontFamily: "Lora, serif" }}>
            Submit Order
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Order ID */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Order ID <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={orderID}
                onChange={e => setOrderID(e.target.value)}
                placeholder="e.g. A-203"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              />
            </div>

            {/* Flute Type */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Flute Type <span className="text-destructive">*</span>
              </label>
              <select
                value={fluteType}
                onChange={e => setFluteType(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
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
                  className="w-full mt-2 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                />
              )}
            </div>

            {/* Size W x L */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
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
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
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
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Order Qty */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Order Qty (pcs) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="100"
                min={1}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              />
            </div>

            {/* BQ Comment */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                BQ Comment <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-1.5">Board Quality formula string</p>
              <textarea
                value={bqComment}
                onChange={e => setBqComment(e.target.value)}
                placeholder="e.g. LR170MP115MP115MP115LR170"
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white resize-none font-mono"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitOrder.isPending}
                className="w-full gspp-gradient text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
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
      </main>
    </div>
  );
}
