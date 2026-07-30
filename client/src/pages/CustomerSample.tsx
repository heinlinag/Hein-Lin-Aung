import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  FlaskConical, Printer, Truck, PackageCheck, Clock, AlertCircle,
  Loader2, PlayCircle, RefreshCw, Search, Sparkles, ShieldCheck
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

type SampleRecord = {
  id: number;
  productionOrderID: string;
  trackingId: string | null;
  fluteType: string;
  sizeW: number;
  sizeL: number;
  bqComment: string;
  currentQty: number;
  sampleQty: number;
  customerName: string;
  remark: string | null;
  deliveryMold: string;
  deliveryMoldCustom: string | null;
  status: string;
  requestedBy: string;
  workerName: string;
  progressBy: string | null;
  progressAt: Date | null;
  deliveryBy: string | null;
  deliveryAt: Date | null;
  createdAt: Date;
};

function printSampleLabel(sample: SampleRecord) {
  const win = window.open("", "_blank", "width=794,height=1123");
  if (!win) return;
  const delivery =
    sample.deliveryMold === "send_to_pp1"
      ? "SEND TO PP1"
      : (sample.deliveryMoldCustom ?? "CUSTOM").toUpperCase();
  const logoUrl = `${window.location.origin}/manus-storage/gspp_logo_new_2db75f16.png`;
  const trackingId = sample.trackingId || sample.id.toString();
  const barcodeId = "barcode-" + trackingId.replace(/[^A-Za-z0-9]/g, "");
  win.document.write(`<!DOCTYPE html><html><head><title>Sample Label — ${sample.productionOrderID}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <style>
    @page { size: A4; margin: 15mm 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; background: #fff; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
    .header-logo { height: 56px; width: auto; object-fit: contain; }
    .header-title { text-align: center; flex: 1; }
    .header-title h1 { font-size: 20pt; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .header-title p { font-size: 9pt; color: #555; margin-top: 2px; }
    .barcode-wrap { text-align: right; }
    .barcode-wrap svg { max-width: 180px; }
    .barcode-wrap p { font-size: 8pt; color: #555; margin-top: 2px; }
    .section { border: 2px solid #222; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; }
    .section-title { font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
    .row:last-child { margin-bottom: 0; }
    .label { font-weight: bold; font-size: 9pt; text-transform: uppercase; color: #444; min-width: 160px; flex-shrink: 0; }
    .value { font-size: 14pt; font-weight: 900; color: #000; }
    .footer { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8pt; color: #888; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head><body>
  <div class="header">
    <img class="header-logo" src="${logoUrl}" alt="GSPP Logo" />
    <div class="header-title">
      <h1>About Sample For</h1>
      <p>Customer Sample Delivery Label</p>
    </div>
    <div class="barcode-wrap">
      <svg id="${barcodeId}"></svg>
      <p>Tracking ID</p>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Sample Details</div>
    <div class="row"><span class="label">Customer Name :</span><span class="value">${sample.customerName.toUpperCase()}</span></div>
    <div class="row"><span class="label">Production Order :</span><span class="value">${sample.productionOrderID.toUpperCase()}</span></div>
    <div class="row"><span class="label">Board Size :</span><span class="value">(W) ${sample.sizeW} × (L) ${sample.sizeL} mm</span></div>
    <div class="row"><span class="label">Sample Qty :</span><span class="value">${sample.sampleQty} PCS</span></div>
    ${sample.remark ? `<div class="row"><span class="value" style="font-size:13pt;">${sample.remark.toUpperCase()}</span></div>` : ""}
  </div>
  <div class="footer">
    <span>Printed: ${new Date().toLocaleString()}</span>
    <span>GSPP Stock Management System</span>
  </div>
  <script>
    window.onload = function() {
      JsBarcode("#${barcodeId}", "${trackingId}", { format: "CODE128", width: 2, height: 50, displayValue: false, margin: 0 });
      setTimeout(function(){ window.print(); }, 300);
    };
  <\/script>
</body></html>`);
  win.document.close();
  void delivery;
}

function SampleCard({
  sample,
  canProcessApprove,
  canApprove,
  onStatusUpdate,
}: {
  sample: SampleRecord;
  canProcessApprove: boolean;
  canApprove: boolean;
  workerID: string;
  onStatusUpdate: (id: number, status: "progress" | "delivery") => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (status: "progress" | "delivery") => {
    setIsUpdating(true);
    await onStatusUpdate(sample.id, status);
    setIsUpdating(false);
  };

  const statusConfig = {
    delivery: {
      accent: "linear-gradient(90deg, #10b981, #059669)",
      bg: "rgba(236,253,245,0.9)",
      border: "rgba(52,211,153,0.3)",
      badge: "bg-emerald-100 text-emerald-700",
      icon: <PackageCheck size={12} />,
      label: "Delivery",
    },
    progress: {
      accent: "linear-gradient(90deg, #8b5cf6, #7c3aed)",
      bg: "rgba(245,243,255,0.9)",
      border: "rgba(139,92,246,0.25)",
      badge: "bg-purple-100 text-purple-700",
      icon: <Clock size={12} />,
      label: "Progress",
    },
    pending: {
      accent: "linear-gradient(90deg, #f59e0b, #d97706)",
      bg: "rgba(255,255,255,0.88)",
      border: "rgba(255,255,255,0.9)",
      badge: "bg-orange-100 text-orange-700",
      icon: <AlertCircle size={12} />,
      label: "Pending",
    },
  };

  const cfg = statusConfig[sample.status as keyof typeof statusConfig] ?? statusConfig.pending;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: cfg.bg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${cfg.border}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      {/* Accent bar */}
      <div className="h-0.5" style={{ background: cfg.accent }} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <FlaskConical size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Customer Sample</p>
              <p className="text-[10px] text-gray-500">{new Date(sample.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${cfg.badge}`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Order Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Production Order", value: sample.productionOrderID },
            { label: "Flute Type", value: sample.fluteType },
            { label: "Board Size", value: `${sample.sizeW} × ${sample.sizeL} mm` },
            { label: "Current Qty", value: `${sample.currentQty} pcs` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl px-2.5 py-2" style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.6)" }}>
              <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-wide">{label}</p>
              <p className="font-bold text-xs text-gray-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* BQ */}
        <div className="rounded-xl px-2.5 py-2" style={{ background: "rgba(254,243,199,0.6)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="text-[9px] uppercase text-amber-600 font-bold tracking-wide">BQ Formula</p>
          <p className="font-mono font-bold text-[10px] text-amber-800 break-all mt-0.5">{sample.bqComment}</p>
        </div>

        {/* Sample Details */}
        <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: "rgba(226,232,240,0.6)" }}>
          {[
            { label: "Customer", value: sample.customerName, bold: true },
            { label: "Sample Qty", value: `${sample.sampleQty} pcs`, bold: true },
            {
              label: "Delivery",
              value: sample.deliveryMold === "send_to_pp1" ? "Send To PP1" : (sample.deliveryMoldCustom ?? "Custom"),
              icon: <Truck size={10} className="text-gray-400" />,
              bold: false,
            },
            { label: "Requested By", value: sample.workerName, bold: false },
          ].map(({ label, value, icon, bold }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[9px] uppercase text-gray-400 font-semibold w-24 shrink-0">{label}</span>
              <span className={`text-xs text-gray-700 flex items-center gap-1 ${bold ? "font-bold" : "font-medium"}`}>
                {icon}{value}
              </span>
            </div>
          ))}
          {sample.remark && (
            <div className="flex items-start gap-2">
              <span className="text-[9px] uppercase text-gray-400 font-semibold w-24 shrink-0 mt-0.5">Remark</span>
              <span className="text-xs text-gray-700">{sample.remark}</span>
            </div>
          )}
        </div>

        {/* Status Trail */}
        {(sample.progressBy || sample.deliveryBy) && (
          <div className="space-y-1 pt-1 border-t" style={{ borderColor: "rgba(226,232,240,0.6)" }}>
            {sample.progressBy && (
              <p className="text-[10px] text-purple-600 flex items-center gap-1">
                <span>🔄</span> Progress by <strong>{sample.progressBy}</strong> — {sample.progressAt ? new Date(sample.progressAt).toLocaleString() : ""}
              </p>
            )}
            {sample.deliveryBy && (
              <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                <span>📦</span> Delivery by <strong>{sample.deliveryBy}</strong> — {sample.deliveryAt ? new Date(sample.deliveryAt).toLocaleString() : ""}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1 flex-wrap">
          <button
            onClick={() => printSampleLabel(sample)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
            style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(226,232,240,0.8)" }}
          >
            <Printer size={12} /> Print Label A4
          </button>
          {sample.status === "pending" && canProcessApprove && (
            <button
              onClick={() => handleUpdate("progress")}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", boxShadow: "0 3px 12px rgba(139,92,246,0.3)" }}
            >
              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />}
              Can Progress
            </button>
          )}
          {sample.status === "progress" && canApprove && (
            <button
              onClick={() => handleUpdate("delivery")}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 3px 12px rgba(16,185,129,0.3)" }}
            >
              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} />}
              Delivery
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerSample() {
  const { worker } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"pending" | "progress" | "delivery" | "all">("pending");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userLevel = worker?.userLevel ?? "2";
  const canApprove = userLevel === "2";
  const canProcessApprove = userLevel === "1.1" || userLevel === "2";

  const samplesQuery = trpc.customerSamples.list.useQuery({}, { refetchInterval: 10000 });
  const updateSampleStatus = trpc.customerSamples.updateStatus.useMutation();

  const allSamples = (samplesQuery.data ?? []) as SampleRecord[];

  const filtered = allSamples
    .filter(s => statusFilter === "all" || s.status === statusFilter)
    .filter(s => {
      if (!search) return true;
      const q = search.toUpperCase();
      return (
        s.productionOrderID.toUpperCase().includes(q) ||
        s.customerName.toUpperCase().includes(q) ||
        (s.bqComment ?? "").toUpperCase().includes(q)
      );
    });

  const handleStatusUpdate = async (id: number, status: "progress" | "delivery") => {
    try {
      await updateSampleStatus.mutateAsync({ id, status, workerName: worker?.workerID ?? "" });
      await samplesQuery.refetch();
      toast.success(status === "progress" ? "Sample marked as In Progress!" : "Sample marked as Delivery!");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const counts = {
    pending: allSamples.filter(s => s.status === "pending").length,
    progress: allSamples.filter(s => s.status === "progress").length,
    delivery: allSamples.filter(s => s.status === "delivery").length,
    all: allSamples.length,
  };

  const filterTabs = [
    { key: "pending" as const, label: "Pending", count: counts.pending, emoji: "⏳", active: "linear-gradient(135deg, #f59e0b, #d97706)" },
    { key: "progress" as const, label: "Progress", count: counts.progress, emoji: "🔄", active: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
    { key: "delivery" as const, label: "Delivery", count: counts.delivery, emoji: "📦", active: "linear-gradient(135deg, #10b981, #059669)" },
    { key: "all" as const, label: "All", count: counts.all, emoji: "📋", active: "linear-gradient(135deg, #374151, #1f2937)" },
  ];

  return (
    <AppLayout pageTitle="Customer Sample">
      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.04); }
        }
        .orb-float { animation: floatOrb 7s ease-in-out infinite; }
        .orb-float-slow { animation: floatOrb 10s ease-in-out infinite reverse; }
        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(500%); opacity: 0; }
        }
        .scan-line { animation: scanLine 3.5s ease-in-out infinite; }
      `}</style>

      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 30%, #047857 60%, #10b981 100%)",
        minHeight: "120px"
      }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        {/* Floating orbs */}
        <div className="absolute top-2 right-8 w-24 h-24 rounded-full orb-float opacity-20" style={{ background: "radial-gradient(circle, #6ee7b7, #10b981)" }} />
        <div className="absolute bottom-0 right-28 w-14 h-14 rounded-full orb-float-slow opacity-15" style={{ background: "radial-gradient(circle, #a7f3d0, #34d399)" }} />
        <div className="absolute top-4 left-1/3 w-10 h-10 rounded-full orb-float opacity-10" style={{ background: "radial-gradient(circle, #d1fae5, #6ee7b7)" }} />
        {/* Scan line */}
        <div className="absolute inset-x-0 h-px scan-line" style={{ background: "linear-gradient(90deg, transparent, rgba(110,231,183,0.6), transparent)" }} />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/40"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))", border: "1px solid rgba(255,255,255,0.3)" }}>
                <FlaskConical size={22} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal-300 flex items-center justify-center shadow-sm">
                <Sparkles size={8} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Customer Sample</h1>
              <p className="text-emerald-200 text-xs mt-0.5">Sending Customer Sample Requests</p>
            </div>
          </div>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await samplesQuery.refetch();
              toast.info("Refreshed");
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-100 transition-all"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-5" style={{ background: "linear-gradient(180deg, rgba(236,253,245,0.5) 0%, rgba(245,255,250,0.2) 100%)" }}>
        <div className="max-w-2xl mx-auto lg:mx-0">

          {/* Level Info Banner */}
          {canApprove && (
            <div className="flex items-center gap-2.5 rounded-2xl p-3.5 mb-4"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(52,211,153,0.25)", boxShadow: "0 2px 12px rgba(16,185,129,0.08)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                <ShieldCheck size={14} className="text-white" />
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                <strong className="text-emerald-800">Level 2</strong> — Mark as <strong>In Progress</strong> first, then advance to <strong>Delivery</strong>.
              </p>
            </div>
          )}
          {!canApprove && canProcessApprove && (
            <div className="flex items-center gap-2.5 rounded-2xl p-3.5 mb-4"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(139,92,246,0.25)", boxShadow: "0 2px 12px rgba(139,92,246,0.08)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                <ShieldCheck size={14} className="text-white" />
              </div>
              <p className="text-xs text-purple-700 leading-relaxed">
                <strong className="text-purple-800">Level 1.1</strong> — You can mark sample requests as <strong>In Progress</strong>.
              </p>
            </div>
          )}

          {/* Search bar */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Production Order, Customer, BQ..."
              value={search}
              onChange={e => setSearch(e.target.value.toUpperCase())}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl focus:outline-none transition-all font-medium placeholder:text-gray-400"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.9)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              onFocus={e => { e.currentTarget.style.border = "1px solid rgba(52,211,153,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.12)"; }}
              onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.9)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                style={statusFilter === tab.key
                  ? { background: tab.active, color: "white", boxShadow: "0 3px 10px rgba(0,0,0,0.15)" }
                  : { background: "rgba(255,255,255,0.8)", color: "#6b7280", border: "1px solid rgba(229,231,235,0.8)" }
                }
              >
                {tab.emoji} {tab.label} ({tab.count})
              </button>
            ))}
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await samplesQuery.refetch();
                toast.info("Refreshed");
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 transition-all ml-auto"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(229,231,235,0.8)" }}
            >
              <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Cards */}
          {samplesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.6)", animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <FlaskConical size={28} className="text-emerald-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No sample requests</p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? "Try a different search term" : "Sample requests will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(sample => (
                <SampleCard
                  key={sample.id}
                  sample={sample}
                  canProcessApprove={canProcessApprove}
                  canApprove={canApprove}
                  workerID={worker?.workerID ?? ""}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
