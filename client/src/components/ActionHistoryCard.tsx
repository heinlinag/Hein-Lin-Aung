import { CheckCircle2, XCircle, Search } from "lucide-react";

export type ActionHistoryEvent = 
  | {
      type: "approved";
      id: number;
      jobNo: string;
      productionOrder: string;
      usageQty: number;
      currentBalance: number;
      newBalance: number;
      requestedBy: string;
      approvedBy: string;
      createdAt: Date;
    }
  | {
      type: "cancelled";
      id: number;
      jobNo?: string;
      productionOrder: string;
      cancelReason: string;
      requestedBy: string;
      cancelledBy: string;
      createdAt: Date;
    }
  | {
      type: "qr_scanner";
      id: number;
      trackingId: string;
      productionOrder: string;
      scannedBy: string;
      scannedByName: string;
      oldQty: number;
      newQty: number;
      adjustment: number;
      createdAt: Date;
    };

export function ActionHistoryCard({ event }: { event: ActionHistoryEvent }) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  if (event.type === "approved") {
    return (
      <div className="border border-green-200 rounded-xl p-4 bg-green-50 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-900">Approved ☑️</p>
              <p className="text-xs text-green-700">Order Usage Approved</p>
            </div>
          </div>
          <span className="text-xs text-green-600 flex-shrink-0 font-semibold">
            {formatDate(event.createdAt)}
          </span>
        </div>

        <div className="space-y-2 bg-white rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Job No</span>
            <span className="text-sm font-mono font-bold text-green-700">{event.jobNo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Production Order</span>
            <span className="text-sm font-bold text-primary">{event.productionOrder}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Usage Qty</span>
            <span className="text-sm font-semibold text-orange-600">-{event.usageQty} pcs</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Current Balance</span>
              <span className="text-sm font-semibold">{event.currentBalance} pcs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">New Balance</span>
              <span className="text-sm font-bold text-green-700">{event.newBalance} pcs</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-green-700 mt-3 pt-2 border-t border-green-200">
          <p>Requested by <strong>{event.requestedBy}</strong> · Approved by <strong>{event.approvedBy}</strong></p>
        </div>
      </div>
    );
  }

  if (event.type === "cancelled") {
    return (
      <div className="border border-red-200 rounded-xl p-4 bg-red-50 shadow-sm hover:shadow-md transition-shadow opacity-85">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircle size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900">Cancelled ❌</p>
              <p className="text-xs text-red-700">Request Cancelled</p>
            </div>
          </div>
          <span className="text-xs text-red-600 flex-shrink-0 font-semibold">
            {formatDate(event.createdAt)}
          </span>
        </div>

        <div className="space-y-2 bg-white rounded-lg p-3">
          {event.jobNo && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Job No</span>
              <span className="text-sm font-mono font-bold text-red-700">{event.jobNo}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Production Order</span>
            <span className="text-sm font-bold text-primary">{event.productionOrder}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <p className="text-xs font-semibold text-red-700 mb-1">Cancel Reason</p>
            <p className="text-xs text-red-600 bg-red-100 rounded p-2">{event.cancelReason}</p>
          </div>
        </div>

        <div className="text-xs text-red-700 mt-3 pt-2 border-t border-red-200">
          <p>Requested by <strong>{event.requestedBy}</strong> · Cancelled by <strong>{event.cancelledBy}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Search size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">QR Scanner 🔍</p>
            <p className="text-xs text-blue-700">Balance Update</p>
          </div>
        </div>
        <span className="text-xs text-blue-600 flex-shrink-0 font-semibold">
          {formatDate(event.createdAt)}
        </span>
      </div>

      <div className="space-y-2 bg-white rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tracking ID</span>
          <span className="text-sm font-mono font-bold text-blue-700">{event.trackingId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Production Order</span>
          <span className="text-sm font-bold text-primary">{event.productionOrder}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Current Balance</span>
            <span className="text-sm font-semibold">{event.oldQty} pcs</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">New Balance</span>
            <span className="text-sm font-bold text-blue-700">{event.newQty} pcs</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Adjustment</span>
            <span className={`text-sm font-semibold ${event.adjustment < 0 ? "text-orange-600" : "text-green-600"}`}>
              {event.adjustment > 0 ? "+" : ""}{event.adjustment} pcs
            </span>
          </div>
        </div>
      </div>

      <div className="text-xs text-blue-700 mt-3 pt-2 border-t border-blue-200">
        <p>Scanned by <strong>{event.scannedByName}</strong> ({event.scannedBy})</p>
      </div>
    </div>
  );
}
