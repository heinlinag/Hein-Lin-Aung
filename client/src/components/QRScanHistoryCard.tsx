import { Clock, User, ArrowRight, ScanLine, Edit3 } from "lucide-react";

interface QRScanLog {
  id: number;
  orderId: string;
  scannedBy: string;
  scannedByName: string;
  action: string;
  oldQty?: number | null;
  newQty?: number | null;
  createdAt: string | Date;
}

interface QRScanHistoryCardProps {
  log: QRScanLog;
}

export function QRScanHistoryCard({ log }: QRScanHistoryCardProps) {
  const isBalanceUpdate = log.action === "balance_update";
  const eventTime = typeof log.createdAt === 'string' ? new Date(log.createdAt).toLocaleString() : log.createdAt.toLocaleString();
  const adjustment = log.oldQty != null && log.newQty != null ? log.newQty - log.oldQty : 0;
  const adjustmentText = adjustment > 0 ? `+${adjustment}` : `${adjustment}`;
  const hasBalanceInfo = log.oldQty != null && log.newQty != null;

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 transition-all duration-300 hover:shadow-md ${
        isBalanceUpdate ? "border-blue-200 hover:border-blue-300" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div
            className={`p-2.5 rounded-lg shrink-0 transition-colors duration-300 ${
              isBalanceUpdate ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            {isBalanceUpdate ? (
              <Edit3 size={16} className="text-blue-600" />
            ) : (
              <ScanLine size={16} className="text-gray-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Tracking ID + Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{log.orderId}</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors duration-300 ${
                  isBalanceUpdate
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isBalanceUpdate ? "Balance Updated" : "Scanned"}
              </span>
            </div>

            {/* Scanned By */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
              <User size={12} className="text-gray-400" />
              <span className="font-medium text-gray-700">{log.scannedByName}</span>
              <span className="text-gray-400">({log.scannedBy})</span>
            </div>

            {/* Balance Update Info */}
            {isBalanceUpdate && hasBalanceInfo && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-orange-50 text-orange-700 px-2.5 py-1.5 rounded-lg font-semibold border border-orange-200">
                      {log.oldQty} pcs
                    </span>
                    <ArrowRight size={14} className="text-gray-300" />
                    <span className="bg-green-50 text-green-700 px-2.5 py-1.5 rounded-lg font-semibold border border-green-200">
                      {log.newQty} pcs
                    </span>
                  </div>
                  <span className={`text-xs font-bold ml-1 ${adjustment > 0 ? "text-green-600" : "text-orange-600"}`}>
                    {adjustment > 0 ? "↑" : "↓"} {adjustmentText} pcs
                  </span>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                  <span className="font-medium">Adjustment:</span> {adjustmentText} pcs
                </div>
              </div>
            )}

            {/* No Balance Info Fallback */}
            {isBalanceUpdate && !hasBalanceInfo && (
              <div className="mt-2 text-xs text-gray-400 italic">
                Balance update recorded (details not available)
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0 whitespace-nowrap">
          <Clock size={12} />
          <span>{eventTime}</span>
        </div>
      </div>
    </div>
  );
}
