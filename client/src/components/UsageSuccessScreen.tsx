import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface UsageSuccessScreenProps {
  usageTrackingId: string;
  jobNo?: string | null;
  usedQty: number;
  orderID: string;
  fluteType: string;
  bqComment: string;
  onClose: () => void;
  onRequestAnother: () => void;
}

export function UsageSuccessScreen({
  usageTrackingId,
  jobNo,
  usedQty,
  orderID,
  fluteType,
  bqComment,
  onClose,
  onRequestAnother,
}: UsageSuccessScreenProps) {
  const [, navigate] = useLocation();

  const handleViewApprovedCenter = () => {
    onClose();
    navigate("/approval-center");
  };

  const handleRequestAnother = () => {
    onRequestAnother();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header with success icon */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-8 text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 rounded-full p-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Order Submitted Successfully!</h2>
          <p className="text-sm text-gray-600 mt-2">Your request has been created and is ready for processing.</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Tracking ID */}
          <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">
              Tracking ID (Reference Number)
            </p>
            <p className="text-2xl font-mono font-bold text-teal-900 break-all">{usageTrackingId}</p>
          </div>

          {/* Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Status</p>
            <p className="text-lg font-semibold text-blue-900">Required to Pending</p>
          </div>

          {/* Job Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Job Details</p>
            
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">Job No</span>
              <span className="text-sm font-semibold text-gray-900">{jobNo || "N/A"}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">Used Quantity</span>
              <span className="text-sm font-semibold text-gray-900">{usedQty} pcs</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">Production Order</span>
              <span className="text-sm font-semibold text-gray-900">{orderID}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">Flute Type</span>
              <span className="text-sm font-semibold text-gray-900">{fluteType}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">BQ Comment</span>
              <span className="text-sm font-semibold text-gray-900">{bqComment || "—"}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleViewApprovedCenter}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-2 h-auto"
            >
              View in Approved Center
            </Button>
            
            <Button
              onClick={handleRequestAnother}
              variant="outline"
              className="w-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 h-auto"
            >
              Request Use/Used Update Another
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
