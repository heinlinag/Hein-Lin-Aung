import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package, AlertCircle, Loader2, ExternalLink } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "current") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        In Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-200">
      <span className="w-2 h-2 rounded-full bg-red-500" />
      Out of Stock
    </span>
  );
}

export default function PublicOrderCard() {
  const params = useParams<{ trackingId: string }>();
  const trackingId = params.trackingId?.toUpperCase() ?? "";

  const { data, isLoading, isError } = trpc.orders.qrVerifyByTrackingId.useQuery(
    { trackingId },
    { enabled: !!trackingId, retry: 1 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-4">
      {/* Header branding */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-bold text-slate-700 tracking-tight">StockDash</span>
        </div>
        <p className="text-xs text-slate-400 font-mono">{trackingId}</p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-100 p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Looking up order…</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-red-100 p-8 flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-slate-700 font-semibold text-center">Unable to load order</p>
          <p className="text-slate-400 text-sm text-center">Please check your connection and try again.</p>
        </div>
      )}

      {/* Not found */}
      {!isLoading && !isError && data && !data.found && (
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-orange-100 p-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-slate-700 font-bold text-lg text-center">Order Not Found</p>
          <p className="text-slate-400 text-sm text-center">
            No order matches tracking ID <span className="font-mono font-semibold text-slate-600">{trackingId}</span>.
          </p>
          <p className="text-slate-400 text-xs text-center">
            The label may have been removed or the ID is incorrect.
          </p>
        </div>
      )}

      {/* Found */}
      {!isLoading && !isError && data?.found && data.order && (
        <div className="w-full max-w-sm">
          {/* Success header */}
          <div className="bg-green-50 border border-green-200 rounded-t-2xl px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-800 text-base leading-tight">Order Found in Stock History</p>
              <p className="text-green-600 text-sm">This label matches a record in the system</p>
            </div>
          </div>

          {/* Card body */}
          <div className="bg-white border border-slate-100 border-t-0 rounded-b-2xl shadow-lg p-5 space-y-4">
            {/* Section title */}
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Current Stock Record</span>
            </div>

            {/* Grid: Production Order + Balance */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Production Order</p>
                <p className="text-xl font-extrabold text-slate-800">{data.order.orderID}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Balance</p>
                <p className="text-xl font-extrabold text-green-600">{data.order.qty.toLocaleString()} <span className="text-sm font-semibold text-green-500">pcs</span></p>
              </div>
            </div>

            {/* Grid: Flute Type + Board Size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Flute Type</p>
                <p className="text-xl font-extrabold text-slate-800">{data.order.fluteType}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Board Size</p>
                <p className="text-base font-extrabold text-slate-800">
                  {data.order.sizeW} <span className="text-slate-400 font-normal">×</span> {data.order.sizeL} <span className="text-xs font-semibold text-slate-500">mm</span>
                </p>
              </div>
            </div>

            {/* BQ Comment */}
            {data.order.bqComment && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">BQ Comment</p>
                <span className="inline-block bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold text-sm px-3 py-1.5 rounded-lg">
                  {data.order.bqComment}
                </span>
              </div>
            )}

            {/* Status */}
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</p>
              <StatusBadge status={data.order.status} />
            </div>

            {/* Tracking ID */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Tracking ID</p>
              <p className="text-xs font-mono font-semibold text-slate-500">{data.order.trackingId ?? trackingId}</p>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-400 mt-4">
            Powered by{" "}
            <a href="https://stockdash.click" className="text-blue-500 hover:underline inline-flex items-center gap-0.5">
              StockDash <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
