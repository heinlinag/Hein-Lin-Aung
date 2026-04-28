import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { LogIn, Send, X } from "lucide-react";

const FLUTE_TYPES = ["AB", "BE", "C", "A", "B", "E", "Manual"] as const;

type WorkerSession = { workerID: string; name: string; department: string };

export default function SubmitOrder() {
  const [, setLocation] = useLocation();

  // Worker auth state
  const [workerSession, setWorkerSession] = useState<WorkerSession | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginWorkerID, setLoginWorkerID] = useState("");
  const [loginError, setLoginError] = useState("");

  // Form state
  const [orderID, setOrderID] = useState("");
  const [fluteType, setFluteType] = useState("");
  const [manualFlute, setManualFlute] = useState("");
  const [sizeW, setSizeW] = useState("");
  const [sizeL, setSizeL] = useState("");
  const [qty, setQty] = useState("");
  const [bqComment, setBqComment] = useState("");

  const verifyWorker = trpc.workers.verify.useMutation();
  const submitOrder = trpc.orders.submit.useMutation();

  const handleLogin = async () => {
    setLoginError("");
    if (!loginWorkerID.trim()) { setLoginError("Please enter your Worker ID."); return; }
    try {
      const worker = await verifyWorker.mutateAsync({ workerID: loginWorkerID.trim() });
      setWorkerSession({ workerID: worker.workerID, name: worker.name, department: worker.department });
      setShowLoginDialog(false);
      setLoginWorkerID("");
      toast.success(`Welcome, ${worker.name}`);
    } catch {
      setLoginError("Worker ID not found. Please check and try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerSession) { setShowLoginDialog(true); return; }

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
      toast.success("Order submitted successfully.");
      setLocation("/stock-history");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit order.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-10">
        <div className="border-t-2 border-foreground pt-4 mb-1">
          <p className="editorial-label">Corrugated Board</p>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Submit Order
        </h1>
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <p className="text-muted-foreground text-sm font-body">
            Complete the form below to register a new flute stock order.
          </p>
          {workerSession ? (
            <div className="flex items-center gap-2">
              <span className="editorial-label text-foreground">
                {workerSession.name} · {workerSession.department}
              </span>
              <button
                onClick={() => setWorkerSession(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginDialog(true)}
              className="flex items-center gap-1.5 editorial-label text-foreground hover:opacity-70 transition-opacity"
            >
              <LogIn className="h-3 w-3" />
              Worker Login
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Order ID */}
        <div className="space-y-2">
          <Label htmlFor="orderID" className="editorial-label text-foreground">
            Order ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="orderID"
            value={orderID}
            onChange={e => setOrderID(e.target.value)}
            placeholder="e.g. ORD-2024-001"
            className="font-sans text-sm h-10 bg-card border-border"
          />
        </div>

        {/* Flute Type */}
        <div className="space-y-2">
          <Label className="editorial-label text-foreground">
            Flute Type <span className="text-destructive">*</span>
          </Label>
          <Select value={fluteType} onValueChange={setFluteType}>
            <SelectTrigger className="font-sans text-sm h-10 bg-card border-border">
              <SelectValue placeholder="Select flute type" />
            </SelectTrigger>
            <SelectContent>
              {FLUTE_TYPES.map(ft => (
                <SelectItem key={ft} value={ft} className="font-sans text-sm">
                  {ft}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fluteType === "Manual" && (
            <div className="mt-2">
              <Input
                value={manualFlute}
                onChange={e => setManualFlute(e.target.value)}
                placeholder="Enter custom flute type"
                className="font-sans text-sm h-10 bg-card border-border"
              />
            </div>
          )}
        </div>

        {/* Size W x L */}
        <div className="space-y-2">
          <Label className="editorial-label text-foreground">
            Size (W × L) <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="font-sans text-xs text-muted-foreground">Width (mm)</p>
              <Input
                type="number"
                value={sizeW}
                onChange={e => setSizeW(e.target.value)}
                placeholder="e.g. 1530"
                min={1}
                className="font-sans text-sm h-10 bg-card border-border"
              />
            </div>
            <div className="space-y-1">
              <p className="font-sans text-xs text-muted-foreground">Length (mm)</p>
              <Input
                type="number"
                value={sizeL}
                onChange={e => setSizeL(e.target.value)}
                placeholder="e.g. 1800"
                min={1}
                className="font-sans text-sm h-10 bg-card border-border"
              />
            </div>
          </div>
        </div>

        {/* Order Qty */}
        <div className="space-y-2">
          <Label htmlFor="qty" className="editorial-label text-foreground">
            Order Qty (pcs) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="qty"
            type="number"
            value={qty}
            onChange={e => setQty(e.target.value)}
            placeholder="e.g. 100"
            min={1}
            className="font-sans text-sm h-10 bg-card border-border"
          />
        </div>

        {/* BQ Comment */}
        <div className="space-y-2">
          <Label htmlFor="bqComment" className="editorial-label text-foreground">
            BQ Comment <span className="text-destructive">*</span>
          </Label>
          <p className="font-sans text-xs text-muted-foreground -mt-1">
            Board Quality formula string (e.g. LR170MP115MP115LR170)
          </p>
          <Textarea
            id="bqComment"
            value={bqComment}
            onChange={e => setBqComment(e.target.value)}
            placeholder="e.g. LR170MP115MP115MP115LR170"
            rows={3}
            className="font-sans text-sm bg-card border-border resize-none"
          />
        </div>

        {/* Submit */}
        <div className="border-t border-border pt-6">
          {!workerSession ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLoginDialog(true)}
                className="font-sans text-xs tracking-widest uppercase h-10 px-6 border-foreground"
              >
                <LogIn className="h-3.5 w-3.5 mr-2" />
                Login to Submit
              </Button>
              <p className="font-sans text-xs text-muted-foreground">
                Worker ID authentication required to submit orders.
              </p>
            </div>
          ) : (
            <Button
              type="submit"
              disabled={submitOrder.isPending}
              className="font-sans text-xs tracking-widest uppercase h-10 px-8 bg-foreground text-background hover:bg-foreground/90"
            >
              <Send className="h-3.5 w-3.5 mr-2" />
              {submitOrder.isPending ? "Submitting…" : "Submit Order"}
            </Button>
          )}
        </div>
      </form>

      {/* Worker Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Worker Login</DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Enter your Worker ID to authenticate and submit orders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="editorial-label text-foreground">Worker ID</Label>
              <Input
                value={loginWorkerID}
                onChange={e => { setLoginWorkerID(e.target.value); setLoginError(""); }}
                onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
                placeholder="Enter your Worker ID"
                className="font-sans text-sm h-10"
                autoFocus
              />
              {loginError && (
                <p className="font-sans text-xs text-destructive">{loginError}</p>
              )}
            </div>
            <Button
              onClick={handleLogin}
              disabled={verifyWorker.isPending}
              className="w-full font-sans text-xs tracking-widest uppercase h-10 bg-foreground text-background hover:bg-foreground/90"
            >
              {verifyWorker.isPending ? "Verifying…" : "Login"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
