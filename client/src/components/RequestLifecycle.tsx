import React from "react";
import { User, Clock } from "lucide-react";

interface RequestLifecycleProps {
  requestedBy: string;
  requestedAt: Date;
  processApprovedBy?: string | null;
  processApprovedAt?: Date | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
}

export function RequestLifecycle({
  requestedBy,
  requestedAt,
  processApprovedBy,
  processApprovedAt,
  approvedBy,
  approvedAt,
}: RequestLifecycleProps) {
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      {/* Request by */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <User size={16} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Request by</p>
          <p className="text-sm font-medium text-foreground">{requestedBy}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(requestedAt)}</p>
        </div>
      </div>

      {/* In Process by */}
      {processApprovedBy && processApprovedAt && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Clock size={16} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">In Process by</p>
            <p className="text-sm font-medium text-foreground">{processApprovedBy}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(processApprovedAt)}</p>
          </div>
        </div>
      )}

      {/* Approved by */}
      {approvedBy && approvedAt && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <User size={16} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Approved by</p>
            <p className="text-sm font-medium text-foreground">{approvedBy}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(approvedAt)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
