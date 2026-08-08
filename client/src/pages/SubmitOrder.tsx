import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Send, Loader2, AlertTriangle, Package, Layers, Ruler, Hash, FileText, CheckCircle2, ArrowRight, Sparkles, Camera, ScanLine, Upload, Edit3, RefreshCw, XCircle, ShieldCheck, ShieldX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

const FLUTE_TYPES = ["BA", "BE", "C", "A", "B", "E", "Manual"] as const;

/** Compress an image File using Canvas API. Target: max 1600px on longest side, JPEG quality 0.82. */
async function compressImage(file: File, maxPx = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round((height / width) * maxPx); width = maxPx; }
        else { width = Math.round((width / height) * maxPx); height = maxPx; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) { resolve(file); return; }
        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
        resolve(compressed);
      }, "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

type ScannerStep = "upload" | "scanning" | "review" | "rejected";
interface ScannedData {
  mastercardValid: boolean;
  mastercardValue: string | null;
  productionOrder: string | null;
  boardWidth: number | null;
  boardLength: number | null;
  qty: number | null;
  bqComment: string | null;
  fluteType: string | null;
}

export default function SubmitOrder({ defaultMode }: { defaultMode?: "manual" | "scanner" }) {
  const [, navigate] = useLocation();
  const { worker } = useAuth();
  const [mode, setMode] = useState<"manual" | "scanner">(defaultMode ?? "scanner");
  const [scannerStep, setScannerStep] = useState<ScannerStep>("upload");
  const [scanStatusIdx, setScanStatusIdx] = useState(0);
  const [scannedImageUrl, setScannedImageUrl] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [reviewOrderID, setReviewOrderID] = useState("");
  const [reviewFluteType, setReviewFluteType] = useState("");
  const [reviewSizeW, setReviewSizeW] = useState("");
  const [reviewSizeL, setReviewSizeL] = useState("");
  const [reviewQty, setReviewQty] = useState("");
  const [reviewBqComment, setReviewBqComment] = useState("");
  const [debouncedReviewOrderID, setDebouncedReviewOrderID] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SCAN_STEPS = [
    { icon: "🔍", label: "Uploading image to AI...", sub: "Preparing label for analysis" },
    { icon: "🔐", label: "Checking MASTERCARD...", sub: "Validating PB requirement" },
    { icon: "📦", label: "Reading Production Order...", sub: "Extracting order ID from label" },
    { icon: "📐", label: "Measuring board dimensions...", sub: "Parsing Width × Length values" },
    { icon: "🔢", label: "Counting unit quantity...", sub: "Reading UNIT QTY field" },
    { icon: "🧾", label: "Parsing BQ formula...", sub: "Extracting flute type and BQ comment" },
    { icon: "✅", label: "Finalising extraction...", sub: "Almost done, verifying data" },
  ];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedReviewOrderID(reviewOrderID.trim()), 500);
    return () => clearTimeout(t);
  }, [reviewOrderID]);
  const reviewDuplicateCheck = trpc.orders.checkOrderId.useQuery(
    { orderID: debouncedReviewOrderID },
    { enabled: debouncedReviewOrderID.length > 0 }
  );
  const isReviewDuplicate = reviewDuplicateCheck.data?.exists === true;

  useEffect(() => {
    if (scannerStep !== "scanning") return;
    setScanStatusIdx(0);
    const interval = setInterval(() => {
      setScanStatusIdx(prev => Math.min(prev + 1, SCAN_STEPS.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [scannerStep]);

  const [orderID, setOrderID] = useState("");
  const [fluteType, setFluteType] = useState("");
  const [manualFlute, setManualFlute] = useState("");
  const [sizeW, setSizeW] = useState("");
  const [sizeL, setSizeL] = useState("");
  const [qty, setQty] = useState("");
  const [bqComment, setBqComment] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showScannerConfirm, setShowScannerConfirm] = useState(false);
  const [successData, setSuccessData] = useState<{ trackingId: string; orderID: string; fluteType: string; sizeW: number; sizeL: number; qty: number; bqComment: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("Image must be under 15MB."); return; }
    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setScannedImageUrl(previewUrl);
    setScanStatusIdx(0);
    setScannerStep("scanning");
    try {
      // Use multipart fetch to /api/scan-label (avoids tRPC batch + cookie issues)
      const formData = new FormData();
      // Compress before upload: reduces 8-12MB camera photos to ~0.5-1.5MB
      const compressed = await compressImage(file);
      formData.append("image", compressed);
      // Pass worker auth (localStorage-based, not cookie-based)
      if (worker?.workerID) formData.append("workerID", worker.workerID);
      if (worker?.deviceToken) formData.append("deviceToken", worker.deviceToken);
      const resp = await fetch("/api/scan-label", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody?.error ?? `Server error ${resp.status}`);
      }
      const result: ScannedData = await resp.json();
      setScannedData(result);
      if (!result.mastercardValid) {
        setScannerStep("rejected");
      } else {
        setReviewOrderID(result.productionOrder ?? "");
        setReviewFluteType(result.fluteType ?? "");
        setReviewSizeW(result.boardWidth ? String(result.boardWidth) : "");
        setReviewSizeL(result.boardLength ? String(result.boardLength) : "");
        setReviewQty(result.qty ? String(result.qty) : "");
        // bqComment already stripped of fluteType prefix by server prompt
        setReviewBqComment(result.bqComment ?? "");
        setScannerStep("review");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to scan label.");
      setScannerStep("upload");
    }
  };

  const handleScannerSubmit = async () => {
    if (!worker) { toast.error("Please login first."); return; }
    if (!reviewOrderID.trim() || !reviewFluteType || !reviewSizeW || !reviewSizeL || !reviewQty || !reviewBqComment.trim()) {
      toast.error("Please fill in all required fields."); return;
    }
    if (isReviewDuplicate) {
      toast.error(`Production Order "${reviewOrderID.trim()}" already exists in the system.`);
      return;
    }
    try {
      const result = await submitOrder.mutateAsync({
        orderID: reviewOrderID.trim(),
        fluteType: reviewFluteType,
        sizeW: parseInt(reviewSizeW),
        sizeL: parseInt(reviewSizeL),
        qty: parseInt(reviewQty),
        bqComment: reviewBqComment.trim(),
        workerID: worker.workerID,
        submittedVia: "scanner",
      });
      toast.success("Order submitted successfully!");
      notifyAll.mutate({ title: "New Order Submitted", body: "Order " + reviewOrderID.trim() + " (" + reviewFluteType + ") submitted by " + (worker?.name ?? "Worker"), tag: "new-order" });
      setSuccessData({
        trackingId: result.trackingId,
        orderID: reviewOrderID.trim(),
        fluteType: reviewFluteType,
        sizeW: parseInt(reviewSizeW),
        sizeL: parseInt(reviewSizeL),
        qty: parseInt(reviewQty),
        bqComment: reviewBqComment.trim(),
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to submit order.");
    }
  };

    const notifyAll = trpc.push.sendToAll.useMutation();
  const submitOrder = trpc.orders.submit.useMutation();

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

  const inputBase = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all duration-200 font-medium placeholder:text-gray-400";
  const inputStyle = `${inputBase} bg-white/70 border border-white/60 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/60 shadow-sm`;
  const inputError = `${inputBase} bg-red-50/80 border border-red-300 focus:ring-2 focus:ring-red-200 shadow-sm`;

  return (
    <AppLayout pageTitle="Add Stock NPRM">
      <style>{`
        @keyframes scanPulse {
          0%, 100% { opacity: 0.4; transform: scaleX(0.8); }
          50% { opacity: 1; transform: scaleX(1); }
        }
        .scan-pulse { animation: scanPulse 1.5s ease-in-out infinite; }
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .success-pop { animation: successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
        .orb-float { animation: floatOrb 6s ease-in-out infinite; }
        .orb-float-slow { animation: floatOrb 9s ease-in-out infinite reverse; }
        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400%); opacity: 0; }
        }
        .scan-line { animation: scanLine 3s ease-in-out infinite; }
        .glass-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04);
        }
        .glass-card:hover {
          box-shadow: 0 8px 32px rgba(99,102,241,0.14), 0 2px 8px rgba(0,0,0,0.06);
        }
      `}</style>

      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)",
        minHeight: "120px"
      }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        {/* Floating orbs */}
        <div className="absolute top-2 right-8 w-24 h-24 rounded-full orb-float opacity-20" style={{ background: "radial-gradient(circle, #a5b4fc, #6366f1)" }} />
        <div className="absolute bottom-0 right-24 w-16 h-16 rounded-full orb-float-slow opacity-15" style={{ background: "radial-gradient(circle, #c7d2fe, #818cf8)" }} />
        <div className="absolute top-4 left-1/3 w-12 h-12 rounded-full orb-float opacity-10" style={{ background: "radial-gradient(circle, #e0e7ff, #a5b4fc)" }} />
        {/* Scan line */}
        <div className="absolute inset-x-0 h-px scan-line" style={{ background: "linear-gradient(90deg, transparent, rgba(165,180,252,0.6), transparent)" }} />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/40" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))", border: "1px solid rgba(255,255,255,0.3)" }}>
                <Package size={22} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center shadow-sm">
                <Sparkles size={8} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Add Stock NPRM</h1>
              <p className="text-indigo-200 text-xs mt-0.5">Create a new production order</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <button onClick={() => setMode("scanner")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "scanner" ? "bg-white text-indigo-700 shadow-sm" : "text-white/80 hover:text-white"}`}>
              <Camera size={11} /> Scanner
            </button>
            <button onClick={() => setMode("manual")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-white/80 hover:text-white"}`}>
              <Edit3 size={11} /> Manual
            </button>
          </div>
        </div>
      </div>

      {/* Mobile worker badge */}
      {worker && (
        <div className="sm:hidden px-4 py-2 flex items-center gap-2" style={{ background: "rgba(99,102,241,0.06)", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-[9px] font-bold text-indigo-600">{worker.name.charAt(0)}</span>
          </div>
          <span className="text-xs text-indigo-700 font-medium">{worker.name} ({worker.workerID}) · {worker.department}</span>
        </div>
      )}

      {/* Main content */}
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-5" style={{ background: "linear-gradient(180deg, rgba(238,242,255,0.6) 0%, rgba(245,247,255,0.3) 100%)" }}>
        <div className="max-w-2xl mx-auto lg:mx-0">

          {/* ─── SCANNER MODE ─────────────────────────────────────────────── */}
          {mode === "scanner" && (
            <div className="space-y-4">
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />

              {scannerStep === "upload" && (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="h-0.5" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }} />
                  <div className="p-5 space-y-5">
                    {/* Hero icon + title row */}
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)" }}>
                          <ScanLine size={30} className="text-indigo-600" />
                        </div>
                        {/* Pulse ring */}
                        <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-black text-gray-900 text-base leading-tight">Scan Production Label</h3>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Point camera at the GS Paper &amp; Packaging label — AI extracts all order details automatically.</p>
                      </div>
                    </div>
                    {/* Checklist grid */}
                    <div className="rounded-2xl p-4" style={{ background: "rgba(238,242,255,0.8)", border: "1px solid rgba(199,210,254,0.5)" }}>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">What AI will extract</p>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { icon: "🏷️", label: "Production Order ID" },
                          { icon: "📐", label: "Board Size (W × L mm)" },
                          { icon: "📦", label: "Unit Quantity (pcs)" },
                          { icon: "🔤", label: "BQ Comment & Flute Type" },
                          { icon: "✅", label: "MASTERCARD PB validation" },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-2.5">
                            <span className="text-sm leading-none">{item.icon}</span>
                            <span className="text-xs font-medium text-gray-700">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Desktop notice — no camera available */}
                    <div className="hidden lg:flex flex-col items-center gap-3 rounded-xl p-4 text-center" style={{ background: "rgba(255,237,213,0.7)", border: "1px solid rgba(251,146,60,0.3)" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 text-lg">📷</span>
                        <p className="text-sm font-bold text-amber-700">Camera not available on Desktop</p>
                      </div>
                      <p className="text-xs text-amber-600 leading-relaxed">Scanner mode is designed for mobile devices with a camera. On Desktop / Laptop / Computer, please use <strong>Manual mode</strong> to enter order details directly.</p>
                      <button onClick={() => setMode("manual")}
                        className="mt-1 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.3)" }}>
                        Switch to Manual Mode →
                      </button>
                    </div>
                    {/* Mobile buttons — camera available */}
                    <div className="flex lg:hidden gap-3">
                      <button onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
                        <Camera size={16} /> Take Photo
                      </button>
                      <button onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute("capture");
                          fileInputRef.current.click();
                          setTimeout(() => fileInputRef.current?.setAttribute("capture", "environment"), 500);
                        }
                      }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.98]"
                        style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(99,102,241,0.3)", color: "#4f46e5" }}>
                        <Upload size={16} /> Upload Image
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {scannerStep === "scanning" && (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="h-0.5 scan-pulse" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }} />
                  <div className="p-5 space-y-4">
                    {/* Image preview with scan overlay */}
                    {scannedImageUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-indigo-100" style={{ maxHeight: 200 }}>
                        <img src={scannedImageUrl} alt="Scanned label" className="w-full object-contain" style={{ maxHeight: 200 }} />
                        {/* Animated scan line over image */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.08) 50%, transparent 100%)" }} />
                        <div className="absolute inset-x-0 h-0.5 scan-line" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)" }} />
                        <div className="absolute inset-0 rounded-xl" style={{ border: "2px solid rgba(99,102,241,0.3)" }} />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(99,102,241,0.85)" }}>
                          <Loader2 size={10} className="text-white animate-spin" />
                          <span className="text-[10px] font-bold text-white">AI Scanning</span>
                        </div>
                      </div>
                    )}
                    {/* Current status */}
                    <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, rgba(238,242,255,0.9), rgba(224,231,255,0.6))", border: "1px solid rgba(199,210,254,0.5)" }}>
                      <div className="text-3xl mb-2">{SCAN_STEPS[scanStatusIdx].icon}</div>
                      <p className="font-bold text-gray-800 text-sm">{SCAN_STEPS[scanStatusIdx].label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{SCAN_STEPS[scanStatusIdx].sub}</p>
                    </div>
                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5 justify-center">
                      {SCAN_STEPS.map((_, i) => (
                        <div key={i} className="rounded-full transition-all duration-500"
                          style={{
                            width: i === scanStatusIdx ? 20 : 6,
                            height: 6,
                            background: i <= scanStatusIdx ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : "rgba(199,210,254,0.6)"
                          }} />
                      ))}
                    </div>
                    {/* Step checklist */}
                    <div className="space-y-1.5">
                      {SCAN_STEPS.map((step, i) => (
                        i > scanStatusIdx ? null : (
                          <div key={i}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                            style={{
                              background: i <= scanStatusIdx ? "rgba(238,242,255,0.7)" : "transparent",
                              animation: "slideInStep 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
                              opacity: i < scanStatusIdx ? 0.65 : 1,
                            }}>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: i < scanStatusIdx ? "linear-gradient(135deg, #10b981, #34d399)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                              {i < scanStatusIdx
                                ? <CheckCircle2 size={11} className="text-white" />
                                : <Loader2 size={10} className="text-white animate-spin" />}
                            </div>
                            <span className={`text-xs font-medium ${i === scanStatusIdx ? "text-indigo-700" : "text-emerald-700"}`}>{step.label}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {scannerStep === "rejected" && scannedData && (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="h-0.5" style={{ background: "linear-gradient(90deg, #ef4444, #f97316)" }} />
                  <div className="p-6 text-center space-y-4">
                    {scannedImageUrl && <img src={scannedImageUrl} alt="Scanned label" className="w-full max-h-40 object-contain rounded-xl border border-red-100 mx-auto opacity-60" />}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "linear-gradient(135deg, #fee2e2, #fecaca)" }}>
                      <ShieldX size={32} className="text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-700 text-lg">Label Rejected</h3>
                      <p className="text-sm text-gray-600 mt-1">This label is not valid for PP4 Manual Slitter.</p>
                    </div>
                    <div className="rounded-xl p-4 text-left space-y-2" style={{ background: "rgba(254,242,242,0.9)", border: "1px solid rgba(252,165,165,0.5)" }}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">MASTERCARD found</span>
                        <span className="font-bold text-red-600">{scannedData.mastercardValue ?? "Not found"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Required</span>
                        <span className="font-bold text-gray-700">PB</span>
                      </div>
                      <p className="text-xs text-red-600 mt-2">Only labels with MASTERCARD: <strong>PB</strong> are accepted for this machine.</p>
                    </div>
                    <button onClick={() => { setScannerStep("upload"); setScannedImageUrl(null); setScannedData(null); }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}>
                      <RefreshCw size={14} /> Try Another Label
                    </button>
                  </div>
                </div>
              )}

              {scannerStep === "review" && scannedData && (
                <div className="space-y-3.5">
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="h-0.5" style={{ background: "linear-gradient(90deg, #10b981, #34d399)" }} />
                    <div className="p-4 flex items-center gap-3">
                      {scannedImageUrl && <img src={scannedImageUrl} alt="Scanned" className="w-16 h-16 object-cover rounded-xl border border-emerald-100 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                          <span className="text-sm font-bold text-emerald-700">MASTERCARD: PB — Verified ✓</span>
                        </div>
                        <p className="text-xs text-gray-500">Review extracted data. Edit any field if inaccurate, then confirm to submit.</p>
                      </div>
                      <button onClick={() => { setScannerStep("upload"); setScannedImageUrl(null); setScannedData(null); }}
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="h-0.5" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
                    <div className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                          <Package size={13} className="text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">Review Extracted Data</h3>
                        <span className="ml-auto text-[10px] text-indigo-500 font-medium flex items-center gap-1"><Edit3 size={9} /> Editable</span>
                      </div>
                      {/* Section: Order Identity */}
                      <div className="rounded-xl p-3 space-y-3" style={{ background: "rgba(238,242,255,0.5)", border: "1px solid rgba(199,210,254,0.4)" }}>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5"><span>🏷️</span> Order Identity</p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Production Order <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <input type="text" value={reviewOrderID} onChange={e => setReviewOrderID(e.target.value.toUpperCase())}
                                className={isReviewDuplicate ? inputError : inputStyle} placeholder="e.g. BA-181" />
                              {!isReviewDuplicate && debouncedReviewOrderID && reviewDuplicateCheck.data && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <CheckCircle2 size={16} className="text-emerald-500" />
                                </div>
                              )}
                            </div>
                            {isReviewDuplicate && (
                              <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(254,242,242,0.9)", border: "1px solid rgba(252,165,165,0.5)" }}>
                                <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
                                <span className="text-xs text-red-600 font-medium">"{reviewOrderID.trim()}" already exists in the system</span>
                              </div>
                            )}
                            {!isReviewDuplicate && debouncedReviewOrderID && reviewDuplicateCheck.data && (
                              <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(240,253,244,0.9)", border: "1px solid rgba(134,239,172,0.5)" }}>
                                <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0" />
                                <span className="text-xs text-emerald-700 font-medium">Available — not yet in system</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Flute Type <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-1.5">
                              {(["BA","BE","C","A","B","E"] as const).map(f => (
                                <button key={f} type="button" onClick={() => setReviewFluteType(f)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${reviewFluteType === f ? "text-white border-indigo-500 shadow-sm" : "bg-white/70 border-indigo-100 text-gray-600 hover:border-indigo-300"}`}
                                  style={reviewFluteType === f ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : {}}>
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Section: Dimensions & Qty */}
                      <div className="rounded-xl p-3 space-y-3" style={{ background: "rgba(240,253,244,0.5)", border: "1px solid rgba(134,239,172,0.3)" }}>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><span>📐</span> Dimensions & Quantity</p>
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Width (mm) <span className="text-red-500">*</span></label>
                            <input type="number" value={reviewSizeW} onChange={e => setReviewSizeW(e.target.value)} className={inputStyle} placeholder="1630" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Length (mm) <span className="text-red-500">*</span></label>
                            <input type="number" value={reviewSizeL} onChange={e => setReviewSizeL(e.target.value)} className={inputStyle} placeholder="1800" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Qty (pcs) <span className="text-red-500">*</span></label>
                            <input type="number" value={reviewQty} onChange={e => setReviewQty(e.target.value)} className={inputStyle} placeholder="102" />
                          </div>
                        </div>
                      </div>
                      {/* Section: BQ Formula */}
                      <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(254,243,199,0.4)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5"><span>🔤</span> BQ Formula</p>
                        <textarea value={reviewBqComment} onChange={e => setReviewBqComment(e.target.value.toUpperCase())} rows={2}
                          className={`${inputStyle} resize-none font-mono`} placeholder="e.g. LR170MP115MP115MP115LR170" />
                        {reviewBqComment && (
                          <div className="rounded-xl px-3.5 py-2.5" style={{ background: "linear-gradient(135deg, rgba(254,243,199,0.8), rgba(253,230,138,0.4))", border: "1px solid rgba(245,158,11,0.25)" }}>
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Preview</p>
                            <p className="text-xs font-mono font-bold text-amber-800 break-all">{reviewBqComment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 pb-2">
                    <button
                      onClick={() => { if (!isReviewDuplicate) setShowScannerConfirm(true); }}
                      disabled={submitOrder.isPending || isReviewDuplicate}
                      className="w-full rounded-2xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                      style={{ background: isReviewDuplicate ? "linear-gradient(135deg, #9ca3af, #6b7280)" : "linear-gradient(135deg, #4f46e5, #6366f1, #7c3aed)", boxShadow: isReviewDuplicate ? "none" : "0 4px 20px rgba(99,102,241,0.35)" }}>
                      {submitOrder.isPending ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : isReviewDuplicate ? <><AlertTriangle size={15} /> Order Already Exists</> : <><Send size={15} /> Add Stock NPRM <ArrowRight size={14} /></>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── MANUAL MODE ──────────────────────────────────────────────── */}
          {mode === "manual" && (<>
                    {/* Progress Steps */}
          <div className="mb-5 hidden sm:block">
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-3.5 left-0 right-0 h-0.5 rounded-full" style={{ background: "rgba(199,210,254,0.6)" }} />
                <div className="absolute top-3.5 left-0 h-0.5 rounded-full transition-all duration-500" style={{
                  width: `${((currentStep - 1) / 3) * 100}%`,
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)"
                }} />
                {[
                  { step: 1, label: "Order Info", icon: Package, color: "from-indigo-500 to-blue-500" },
                  { step: 2, label: "Dimensions", icon: Ruler, color: "from-emerald-500 to-teal-500" },
                  { step: 3, label: "BQ Formula", icon: FileText, color: "from-amber-500 to-orange-500" },
                  { step: 4, label: "Review", icon: CheckCircle2, color: "from-purple-500 to-indigo-500" },
                ].map(({ step, label, icon: Icon, color }) => (
                  <div key={step} className="relative flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${currentStep >= step ? `bg-gradient-to-br ${color} text-white shadow-indigo-500/30` : "bg-white border-2 border-indigo-100 text-gray-400"}`}>
                      <Icon size={13} />
                    </div>
                    <span className={`text-[10px] mt-1.5 font-semibold transition-colors ${currentStep >= step ? "text-indigo-600" : "text-gray-400"}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">

            {/* Section 1: Order Info */}
            <div className="glass-card rounded-2xl overflow-hidden transition-all duration-200">
              <div className="h-0.5" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    <Package size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">Order Information</h3>
                  {currentStep >= 1 && orderID && <div className="ml-auto w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center"><CheckCircle2 size={11} className="text-indigo-600" /></div>}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Production Order */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Production Order <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={orderID}
                        onChange={e => setOrderID(e.target.value.toUpperCase())}
                        placeholder="Enter order ID"
                        className={isDuplicate ? inputError : inputStyle}
                      />
                      {!isDuplicate && debouncedOrderID && duplicateCheck.data && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                    {isDuplicate && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100">
                        <AlertTriangle size={12} /> <strong>{debouncedOrderID}</strong> already exists
                      </p>
                    )}
                    {!isDuplicate && debouncedOrderID && duplicateCheck.data && (
                      <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                        <CheckCircle2 size={12} /> Available
                      </p>
                    )}
                  </div>

                  {/* Flute Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Flute Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {FLUTE_TYPES.filter(ft => ft !== "Manual").map(ft => (
                        <button
                          key={ft}
                          type="button"
                          onClick={() => setFluteType(ft)}
                          className={`py-2 text-xs font-bold rounded-xl border-2 transition-all duration-150 ${fluteType === ft
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-200"
                            : "border-gray-200 bg-white/70 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50"}`}
                        >
                          {ft}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFluteType("Manual")}
                        className={`py-2 text-xs font-bold rounded-xl border-2 transition-all duration-150 col-span-2 ${fluteType === "Manual"
                          ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm shadow-purple-200"
                          : "border-gray-200 bg-white/70 text-gray-600 hover:border-purple-300 hover:bg-purple-50/50"}`}
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
                        className={`mt-2 ${inputStyle} focus:border-purple-300 focus:ring-purple-200/60`}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Dimensions & Qty */}
            <div className="glass-card rounded-2xl overflow-hidden transition-all duration-200">
              <div className="h-0.5" style={{ background: "linear-gradient(90deg, #10b981, #059669)" }} />
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                    <Ruler size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">Dimensions & Quantity</h3>
                  {sizeW && sizeL && qty && <div className="ml-auto w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 size={11} className="text-emerald-600" /></div>}
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Size (W × L) mm <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="relative">
                        <input
                          type="number"
                          value={sizeW}
                          onChange={e => setSizeW(e.target.value)}
                          placeholder="Width"
                          min={1}
                          className={`${inputStyle} focus:border-emerald-300 focus:ring-emerald-200/60`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">W</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={sizeL}
                          onChange={e => setSizeL(e.target.value)}
                          placeholder="Length"
                          min={1}
                          className={`${inputStyle} focus:border-emerald-300 focus:ring-emerald-200/60`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">L</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Order Qty (pcs) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        placeholder="Enter quantity"
                        min={1}
                        className={`${inputStyle} focus:border-emerald-300 focus:ring-emerald-200/60`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Hash size={14} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: BQ Comment */}
            <div className="glass-card rounded-2xl overflow-hidden transition-all duration-200">
              <div className="h-0.5" style={{ background: "linear-gradient(90deg, #f59e0b, #d97706)" }} />
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                    <Layers size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">BQ Comment</h3>
                  <span className="text-[10px] text-gray-400 ml-auto bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Board Quality formula</span>
                </div>

                {/* BQ Shortcut Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {["LR", "MP", "KL", "LP", "KC", "WT"].map(prefix => (
                    <button
                      key={prefix}
                      type="button"
                      onClick={() => setBqComment(prev => prev + prefix)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 active:scale-95 font-mono shadow-sm"
                      style={{
                        background: "rgba(255,255,255,0.9)",
                        border: "1.5px solid rgba(245,158,11,0.25)",
                        color: "#92400e"
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(254,243,199,0.9)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.6)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.9)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.25)";
                      }}
                    >
                      {prefix}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setBqComment("")}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all ml-auto"
                  >
                    Clear
                  </button>
                </div>

                <textarea
                  value={bqComment}
                  onChange={e => setBqComment(e.target.value.toUpperCase())}
                  placeholder="e.g. LR170MP115MP115MP115LR170"
                  rows={2}
                  className={`${inputStyle} focus:border-amber-300 focus:ring-amber-200/60 resize-none font-mono`}
                />

                {bqComment && (
                  <div className="rounded-xl px-3.5 py-2.5 border" style={{
                    background: "linear-gradient(135deg, rgba(254,243,199,0.8), rgba(253,230,138,0.4))",
                    border: "1px solid rgba(245,158,11,0.25)"
                  }}>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Preview</p>
                    <p className="text-xs font-mono font-bold text-amber-800 break-all">{bqComment}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1 pb-2">
              <button
                type="submit"
                disabled={submitOrder.isPending}
                className="w-full lg:w-auto lg:px-14 rounded-2xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #6366f1, #7c3aed)",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.35), 0 1px 4px rgba(0,0,0,0.1)"
                }}
              >
                {submitOrder.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Send size={15} /> Add Stock NPRM <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </form>
          </>)}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {/* Scanner Confirm Submission Dialog */}
      {showScannerConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" style={{ background: "rgba(15,10,60,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <div className="h-1" style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444, #f97316)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
                  <AlertTriangle size={22} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Confirm Submission</h3>
                  <p className="text-xs text-gray-500">Review your order details</p>
                </div>
              </div>
              <div className="rounded-2xl p-4 mb-5 space-y-2.5" style={{ background: "linear-gradient(135deg, rgba(238,242,255,0.8), rgba(224,231,255,0.4))", border: "1px solid rgba(199,210,254,0.5)" }}>
                {[
                  { label: "Production Order", value: reviewOrderID.trim(), cls: "font-bold text-indigo-700" },
                  { label: "Flute Type", value: reviewFluteType, cls: "font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-xs" },
                  { label: "Size", value: `${reviewSizeW} × ${reviewSizeL} mm`, cls: "font-mono text-xs" },
                  { label: "Qty", value: `${reviewQty} pcs`, cls: "font-bold text-lg text-emerald-700" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">{label}</span>
                    <span className={cls}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm items-start">
                  <span className="text-gray-500">BQ</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg font-mono font-semibold text-[10px] break-words max-w-[60%] text-right">{reviewBqComment}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowScannerConfirm(false)}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                  style={{ border: "2px solid rgba(229,231,235,1)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowScannerConfirm(false); handleScannerSubmit(); }}
                  disabled={submitOrder.isPending}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}
                >
                  {submitOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" style={{ background: "rgba(15,10,60,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <div className="h-1" style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444, #f97316)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
                  <AlertTriangle size={22} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Confirm Submission</h3>
                  <p className="text-xs text-gray-500">Review your order details</p>
                </div>
              </div>
              <div className="rounded-2xl p-4 mb-5 space-y-2.5" style={{ background: "linear-gradient(135deg, rgba(238,242,255,0.8), rgba(224,231,255,0.4))", border: "1px solid rgba(199,210,254,0.5)" }}>
                {[
                  { label: "Production Order", value: orderID.trim(), cls: "font-bold text-indigo-700" },
                  { label: "Flute Type", value: fluteType === "Manual" ? manualFlute.trim() : fluteType, cls: "font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-xs" },
                  { label: "Size", value: `${sizeW} × ${sizeL} mm`, cls: "font-mono text-xs" },
                  { label: "Qty", value: `${qty} pcs`, cls: "font-bold text-lg text-emerald-700" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">{label}</span>
                    <span className={cls}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm items-start">
                  <span className="text-gray-500">BQ</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg font-mono font-semibold text-[10px] break-words max-w-[60%] text-right">{bqComment}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                  style={{ border: "2px solid rgba(229,231,235,1)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedSubmit}
                  disabled={submitOrder.isPending}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" style={{ background: "rgba(5,10,40,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <div className="h-1" style={{ background: "linear-gradient(90deg, #10b981, #059669, #34d399)" }} />
            <div className="p-6 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 success-pop shadow-lg" style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", boxShadow: "0 8px 32px rgba(16,185,129,0.25)" }}>
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-1">Order Submitted!</h3>
              <p className="text-sm text-gray-500 mb-5">Your order has been created successfully</p>

              <div className="rounded-2xl p-4 mb-4" style={{ background: "linear-gradient(135deg, rgba(204,251,241,0.8), rgba(167,243,208,0.4))", border: "1px solid rgba(52,211,153,0.3)" }}>
                <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mb-1">Tracking ID</p>
                <p className="text-xl font-bold text-teal-700 font-mono break-all">{successData.trackingId}</p>
              </div>

              <div className="rounded-2xl p-4 mb-5 text-left space-y-2" style={{ background: "rgba(248,250,252,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}>
                {[
                  { label: "Production Order", value: successData.orderID, cls: "font-bold text-indigo-700" },
                  { label: "Flute", value: successData.fluteType, cls: "font-semibold" },
                  { label: "Size", value: `${successData.sizeW} × ${successData.sizeL} mm`, cls: "font-mono text-xs" },
                  { label: "Qty", value: `${successData.qty} pcs`, cls: "font-bold" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={cls}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm items-start">
                  <span className="text-gray-500">BQ</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-semibold text-[10px] break-words max-w-[60%] text-right">{successData.bqComment}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setSuccessData(null); navigate("/stock-history"); }}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}
                >
                  View Stock
                </button>
                <button
                  onClick={() => {
                    setSuccessData(null);
                    setOrderID(""); setFluteType(""); setManualFlute("");
                    setSizeW(""); setSizeL(""); setQty(""); setBqComment("");
                  }}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                  style={{ border: "2px solid rgba(229,231,235,1)" }}
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
