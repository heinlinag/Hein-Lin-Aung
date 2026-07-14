import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  FlaskConical, Printer, Truck, PackageCheck, Clock, AlertCircle,
  Loader2, PlayCircle, RefreshCw, Search
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
    .barcode-text { font-size: 10pt; font-weight: bold; color: #000; margin-top: 4px; font-family: monospace; letter-spacing: 1px; }
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
      <div class="barcode-text">${trackingId}</div>
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
      JsBarcode("#${barcodeId}", "${trackingId}", {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false,
        margin: 0
      });
      setTimeout(function(){ window.print(); }, 300);
    };
  <\/script>
</body></html>`);
  win.document.close();
}

function SampleCard({
  sample,
  canProcessApprove,
  canApprove,
  workerID,
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

  return (
    <div
      className={`border rounded-xl p-4 space-y-3 ${
        sample.status === "delivery"
          ? "bg-emerald-50 border-emerald-200"
          : sample.status === "progress"
          ? "bg-purple-50 border-purple-200"
          : "bg-white border-border shadow-sm"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-100">
            <FlaskConical size={14} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              Sending Customer Sample
            </p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(sample.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {sample.status === "delivery" ? (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1.5">
              <PackageCheck size={13} /> Delivery
            </span>
          ) : sample.status === "progress" ? (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-purple-100 text-purple-700 flex items-center gap-1.5">
              <Clock size={13} /> Progress
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-orange-100 text-orange-700 flex items-center gap-1.5">
              <AlertCircle size={13} /> Pending
            </span>
          )}
        </div>
      </div>

      {/* Order Info Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
          <p className="text-muted-foreground text-[9px] uppercase">Production Order</p>
          <p className="font-bold text-xs">{sample.productionOrderID}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
          <p className="text-muted-foreground text-[9px] uppercase">Flute Type</p>
          <p className="font-bold text-xs">{sample.fluteType}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
          <p className="text-muted-foreground text-[9px] uppercase">Board Size</p>
          <p className="font-bold text-xs">
            {sample.sizeW} × {sample.sizeL} mm
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
          <p className="text-muted-foreground text-[9px] uppercase">Current Qty</p>
          <p className="font-bold text-xs">{sample.currentQty} pcs</p>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
        <p className="text-muted-foreground text-[9px] uppercase">BQ</p>
        <p className="font-mono font-bold text-[10px] break-all">{sample.bqComment}</p>
      </div>

      {/* Sample Details */}
      <div className="border-t border-dashed border-gray-200 pt-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase text-muted-foreground w-24 shrink-0">Customer</span>
          <span className="text-xs font-bold text-foreground">{sample.customerName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase text-muted-foreground w-24 shrink-0">Sample Qty</span>
          <span className="text-xs font-bold text-foreground">{sample.sampleQty} pcs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase text-muted-foreground w-24 shrink-0">Board Size</span>
          <span className="text-xs font-semibold">
            {sample.sizeW} × {sample.sizeL} mm
          </span>
        </div>
        {sample.remark && (
          <div className="flex items-start gap-1.5">
            <span className="text-[9px] uppercase text-muted-foreground w-24 shrink-0 mt-0.5">Remark</span>
            <span className="text-xs text-foreground">{sample.remark}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase text-muted-foreground w-24 shrink-0">Delivery</span>
          <span className="text-xs font-semibold flex items-center gap-1">
            <Truck size={11} className="text-muted-foreground" />
            {sample.deliveryMold === "send_to_pp1"
              ? "Send To PP1"
              : sample.deliveryMoldCustom ?? "Custom"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase text-muted-foreground w-24 shrink-0">Requested By</span>
          <span className="text-xs font-semibold">{sample.workerName}</span>
        </div>
      </div>

      {/* Status Trail */}
      {(sample.progressBy || sample.deliveryBy) && (
        <div className="border-t border-dashed border-gray-200 pt-2 space-y-1">
          {sample.progressBy && (
            <p className="text-[10px] text-purple-600">
              🔄 Progress by <strong>{sample.progressBy}</strong> —{" "}
              {sample.progressAt ? new Date(sample.progressAt).toLocaleString() : ""}
            </p>
          )}
          {sample.deliveryBy && (
            <p className="text-[10px] text-emerald-600">
              📦 Delivery by <strong>{sample.deliveryBy}</strong> —{" "}
              {sample.deliveryAt ? new Date(sample.deliveryAt).toLocaleString() : ""}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1 flex-wrap">
        <button
          onClick={() => printSampleLabel(sample)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
        >
          <Printer size={13} /> Print Label A4
        </button>
        {sample.status === "pending" && canProcessApprove && (
          <button
            onClick={() => handleUpdate("progress")}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white text-xs font-bold hover:shadow-lg transition-all disabled:opacity-60"
          >
            {isUpdating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <PlayCircle size={13} />
            )}{" "}
            Can Progress
          </button>
        )}
        {sample.status === "progress" && canApprove && (
          <button
            onClick={() => handleUpdate("delivery")}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:shadow-lg transition-all disabled:opacity-60"
          >
            {isUpdating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <PackageCheck size={13} />
            )}{" "}
            Delivery
          </button>
        )}
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
      await updateSampleStatus.mutateAsync({
        id,
        status,
        workerName: worker?.workerID ?? "",
      });
      await samplesQuery.refetch();
      toast.success(
        status === "progress"
          ? "Sample marked as In Progress!"
          : "Sample marked as Delivery!"
      );
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

  return (
    <AppLayout>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <FlaskConical size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Customer Sample</h1>
            <p className="text-xs text-muted-foreground">Sending Customer Sample Requests</p>
          </div>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await samplesQuery.refetch();
              toast.info("Refreshed");
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary px-3 py-2 rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Level Info Banner */}
        {canApprove && (
          <div className="flex items-start gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-xl p-3.5 mb-5 shadow-sm">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FlaskConical size={14} className="text-emerald-600" />
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              <strong className="text-emerald-800">Level 2</strong> — Mark as{" "}
              <strong>In Progress</strong> first, then advance to{" "}
              <strong>Delivery</strong>.
            </p>
          </div>
        )}
        {!canApprove && canProcessApprove && (
          <div className="flex items-start gap-2.5 bg-gradient-to-r from-purple-50 to-violet-50/50 border border-purple-200/80 rounded-xl p-3.5 mb-5 shadow-sm">
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FlaskConical size={14} className="text-purple-600" />
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">
              <strong className="text-purple-800">Level 1.1</strong> — You can mark sample requests as{" "}
              <strong>In Progress</strong>.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Production Order, Customer, BQ..."
            value={search}
            onChange={e => setSearch(e.target.value.toUpperCase())}
            className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(["pending", "progress", "delivery", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === f
                  ? f === "pending"
                    ? "bg-orange-500 text-white shadow-sm"
                    : f === "progress"
                    ? "bg-purple-500 text-white shadow-sm"
                    : f === "delivery"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-gray-700 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "pending"
                ? `⏳ Pending (${counts.pending})`
                : f === "progress"
                ? `🔄 Progress (${counts.progress})`
                : f === "delivery"
                ? `📦 Delivery (${counts.delivery})`
                : `📋 All (${counts.all})`}
            </button>
          ))}
        </div>

        {/* Cards */}
        {samplesQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-40 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <FlaskConical size={30} className="text-emerald-300" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No sample requests</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
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
      </main>
    </AppLayout>
  );
}
