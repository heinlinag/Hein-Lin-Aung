import React from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

type Stage = "pending" | "in_process" | "approved";

interface StatusProgressionIndicatorProps {
  currentStage: Stage;
  onStageChange: (stage: Stage) => void;
  pendingCount: number;
  inProcessCount: number;
  approvedCount: number;
}

export function StatusProgressionIndicator({
  currentStage,
  onStageChange,
  pendingCount,
  inProcessCount,
  approvedCount,
}: StatusProgressionIndicatorProps) {
  const stages: { id: Stage; label: string; count: number; icon: React.ReactNode; color: string }[] = [
    {
      id: "pending",
      label: "Pending",
      count: pendingCount,
      icon: <AlertCircle size={16} />,
      color: "bg-orange-100 text-orange-700",
    },
    {
      id: "in_process",
      label: "In Process",
      count: inProcessCount,
      icon: <Clock size={16} />,
      color: "bg-purple-100 text-purple-700",
    },
    {
      id: "approved",
      label: "Approved",
      count: approvedCount,
      icon: <CheckCircle2 size={16} />,
      color: "bg-green-100 text-green-700",
    },
  ];

  const currentIndex = stages.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full">
      {/* Visual progression line */}
      <div className="flex items-center gap-2 mb-6">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            {/* Stage circle */}
            <button
              onClick={() => onStageChange(stage.id)}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                index <= currentIndex
                  ? stage.color
                  : "bg-gray-200 text-gray-400"
              } hover:scale-110 cursor-pointer flex-shrink-0`}
              title={`${stage.label} (${stage.count})`}
            >
              {stage.icon}
            </button>

            {/* Connecting line */}
            {index < stages.length - 1 && (
              <div
                className={`flex-1 h-1 transition-colors ${
                  index < currentIndex ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Stage labels and counts */}
      <div className="flex justify-between text-center">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => onStageChange(stage.id)}
            className={`flex-1 transition-opacity ${
              stage.id === currentStage ? "opacity-100" : "opacity-60 hover:opacity-80"
            }`}
          >
            <p className="text-sm font-semibold text-foreground">{stage.label}</p>
            <p className="text-xs text-muted-foreground">{stage.count} request{stage.count !== 1 ? "s" : ""}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
