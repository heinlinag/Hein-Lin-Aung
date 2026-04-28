import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, LogIn, Send, X, Loader2 } from "lucide-react";

const LOGO_URL = "/manus-storage/gspp-logo_988a5ce5.png";
const FLUTE_TYPES = ["BA", "BE", "C", "A", "B", "E", "Manual"] as const;

type WorkerSession = { workerID: string; name: string; department: string };

// ── Worker Login Dialog ─────────────────────────────────────────────────────
function WorkerLoginDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (session: WorkerSession) => void;
}) {
  const [workerID, setWorkerID] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const workers = trpc.workers.list.useQuery();

  const handleLogin = () => {
    setError("");
    if (!workerID.trim()) { setError("Please enter your Worker ID."); return; }
    setLoading(true);
    const found = (workers.data || []).find(
      (w: { workerID: string; name: string; department: string }) =>
        w.workerID.toLowerCase() === workerID.trim().toLowerCase()
    );
    setLoading(false);
    if (!found) {
      setError("Worker ID not found. Please contact your Admin.");
      return;
    }
    onSuccess({ workerID: found.workerID, name: found.name, department: found.department });
    toast.success(`Welcome, ${found.name}!`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="GSPP" className="h-8 w-8 object-contain" />
            <h3 className="font-semibold text-foreground">Worker Login</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Enter your Worker ID to submit orders.</p>
        <input
          type="text"
          value={workerID}
          onChange={e => { setWorkerID(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          placeholder="Worker ID (e.g. DN156)"
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-1"
          autoFocus
        />
        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading || workers.isLoading}
          className="w-full mt-3 bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading || workers.isLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
          Login
        </button>
      </div>
    </div>
  );
}

// ── Main SubmitOrder Page ───────────────────────────────────────────────────
export default function SubmitOrder() {
  const [, navigate] = useLocation();
  const [workerSession, setWorkerSession] = useState<WorkerSession | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const [orderID, setOrderID] = useState("");
  const [fluteType, setFluteType] = useState("");
  const [manualFlute, setManualFlute] = useState("");
  const [sizeW, setSizeW] = useState("");
  const [sizeL, setSizeL] = useState("");
  const [qty, setQty] = useState("");
  const [bqComment, setBqComment] = useState("");

  const submitOrder = trpc.orders.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerSession) { setShowLogin(true); return; }

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
        workerID: workerSession.workerID,
      });
      toast.success("Order submitted successfully!");
      navigate("/stock-history");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to submit order.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10 shadow-sm">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground p-1">
            <ArrowLeft size={20} />
          </button>
          <img src={LOGO_URL} alt="GSPP" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">Submit Order</h1>
            <p className="text-xs text-muted-foreground">PP4 Manual Slitter</p>
          </div>
          <div className="ml-auto">
            {workerSession ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-semibold text-foreground">{workerSession.name}</div>
                  <div className="text-xs text-muted-foreground">{workerSession.department}</div>
                </div>
                <button
                  onClick={() => setWorkerSession(null)}
                  className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                  title="Sign out"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <LogIn size={13} /> Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Worker Session Banner */}
      {workerSession && (
        <div className="gspp-gradient text-white py-2 px-4 text-center text-xs">
          Logged in as <strong>{workerSession.name}</strong> ({workerSession.workerID}) · {workerSession.department}
        </div>
      )}

      <main className="container py-6">
        <div className="max-w-lg mx-auto">
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
              {!workerSession ? (
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <LogIn size={16} /> Login to Submit
                </button>
              ) : (
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
              )}
            </div>
          </form>
        </div>
      </main>

      {/* Worker Login Dialog */}
      {showLogin && (
        <WorkerLoginDialog
          onClose={() => setShowLogin(false)}
          onSuccess={(session) => {
            setWorkerSession(session);
            setShowLogin(false);
          }}
        />
      )}
    </div>
  );
}
