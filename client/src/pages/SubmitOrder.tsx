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

const FLUTE_TYPES = ["BA", "BE", "C", "A", "B", "E", "Manual"] as const;

type WorkerSession = { workerID: string; name: string; department: string };

export default function SubmitOrder() {
  const [, setLocation] = useLocation();

  const [workerSession, setWorkerSession] = useState<WorkerSession | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginWorkerID, setLoginWorkerID] = useState("");
  const [loginError, setLoginError] = useState("");

  const [orderID, setOrderID] = useState("");
  const [fluteType, setFluteType] = useState("");
  const [manualFlute, setManualFlute] = useState("");
  const [sizeW, setSizeW] = useState("");
  const [sizeL, setSizeL] = useState("");
  const [qty, setQty] = useState("");
  const [bqComment, setBqComment] = useState("");

  const getWorkers = trpc.workers.list.useQuery();
  const submitOrder = trpc.orders.submit.useMutation();

  const handleLogin = async () => {
    setLoginError("");
    if (!loginWorkerID.trim()) { setLoginError("Please enter your Worker ID."); return; }
    try {
      const workers = getWorkers.data || [];
      const worker = workers.find(w => w.workerID === loginWorkerID.trim());
      if (!worker) { setLoginError("Worker ID not found."); return; }
      setWorkerSession({ workerID: worker.workerID, name: worker.name, department: worker.department });
      setShowLoginDialog(false);
      setLoginWorkerID("");
      toast.success(`Welcome, ${worker.name}`);
    } catch {
      setLoginError("Worker ID not found.");
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
    <div className="w-full px-4 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Submit Order
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Register a new manual slitter order.
          </p>
          {workerSession && (
            <div className="flex items-center justify-between mt-4 p-3 bg-secondary rounded-md">
              <div className="text-sm">
                <p className="font-sans text-xs text-muted-foreground">Logged in as</p>
                <p className="font-sans font-medium text-foreground">{workerSession.name} · {workerSession.department}</p>
              </div>
              <button
                onClick={() => setWorkerSession(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Order ID */}
          <div className="space-y-2">
            <Label htmlFor="orderID" className="font-sans text-sm font-medium text-foreground">
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
            <Label className="font-sans text-sm font-medium text-foreground">
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
              <Input
                value={manualFlute}
                onChange={e => setManualFlute(e.target.value)}
                placeholder="Enter custom flute type"
                className="font-sans text-sm h-10 bg-card border-border mt-2"
              />
            )}
          </div>

          {/* Size W x L */}
          <div className="space-y-2">
            <Label className="font-sans text-sm font-medium text-foreground">
              Size (W × L) <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-sans text-xs text-muted-foreground mb-1">Width (mm)</p>
                <Input
                  type="number"
                  value={sizeW}
                  onChange={e => setSizeW(e.target.value)}
                  placeholder="1530"
                  min={1}
                  className="font-sans text-sm h-10 bg-card border-border"
                />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground mb-1">Length (mm)</p>
                <Input
                  type="number"
                  value={sizeL}
                  onChange={e => setSizeL(e.target.value)}
                  placeholder="1800"
                  min={1}
                  className="font-sans text-sm h-10 bg-card border-border"
                />
              </div>
            </div>
          </div>

          {/* Order Qty */}
          <div className="space-y-2">
            <Label htmlFor="qty" className="font-sans text-sm font-medium text-foreground">
              Order Qty (pcs) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="qty"
              type="number"
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder="100"
              min={1}
              className="font-sans text-sm h-10 bg-card border-border"
            />
          </div>

          {/* BQ Comment */}
          <div className="space-y-2">
            <Label htmlFor="bqComment" className="font-sans text-sm font-medium text-foreground">
              BQ Comment <span className="text-destructive">*</span>
            </Label>
            <p className="font-sans text-xs text-muted-foreground">
              Board Quality formula string
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
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            {!workerSession ? (
              <Button
                type="button"
                onClick={() => setShowLoginDialog(true)}
                className="font-sans text-sm font-medium h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login to Submit
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitOrder.isPending}
                className="font-sans text-sm font-medium h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitOrder.isPending ? "Submitting…" : "Submit Order"}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Worker Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Worker Login</DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Enter your Worker ID to authenticate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-sans text-sm font-medium text-foreground">Worker ID</Label>
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
              disabled={getWorkers.isPending}
              className="w-full font-sans text-sm font-medium h-10 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {getWorkers.isPending ? "Verifying…" : "Login"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
