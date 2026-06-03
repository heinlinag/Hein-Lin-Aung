import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, Info, XCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import type { Announcement } from "../../../drizzle/schema";

type AnnType = "info" | "warning" | "success" | "error";

const TYPE_CONFIG: Record<AnnType, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  closeHover: string;
}> = {
  info:    { icon: <Info size={15} />,          bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-800",   closeHover: "hover:bg-blue-100" },
  warning: { icon: <AlertTriangle size={15} />, bg: "bg-amber-50",  border: "border-amber-200", text: "text-amber-800",  closeHover: "hover:bg-amber-100" },
  success: { icon: <CheckCircle2 size={15} />,  bg: "bg-green-50",  border: "border-green-200", text: "text-green-800",  closeHover: "hover:bg-green-100" },
  error:   { icon: <XCircle size={15} />,       bg: "bg-red-50",    border: "border-red-200",   text: "text-red-800",    closeHover: "hover:bg-red-100" },
};

// Session storage key prefix — dismissed banners are remembered per session
const DISMISSED_KEY = "dismissed_announcements";

function getDismissed(): Set<number> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<number>) {
  try {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

export function AnnouncementBanner() {
  const { data: active = [] } = trpc.announcements.listActive.useQuery(undefined, {
    refetchInterval: 60_000, // refresh every 60s
    staleTime: 30_000,
  });

  const [dismissed, setDismissed] = useState<Set<number>>(getDismissed);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Sync dismissed state to session storage
  useEffect(() => {
    saveDismissed(dismissed);
  }, [dismissed]);

  const visible = (active as Announcement[]).filter((a: Announcement) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  function dismiss(id: number) {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="w-full space-y-1.5 px-3 pt-2 pb-0">
      {visible.map((ann: Announcement) => {
        const cfg = TYPE_CONFIG[ann.type as AnnType] ?? TYPE_CONFIG.info;
        const isLong = ann.message.length > 120;
        const isExpanded = expanded.has(ann.id);

        return (
          <div
            key={ann.id}
            className={`rounded-xl border ${cfg.bg} ${cfg.border} px-3 py-2.5 flex items-start gap-2.5 shadow-sm animate-in slide-in-from-top-2 duration-300`}
          >
            {/* Icon */}
            <div className={`flex-shrink-0 mt-0.5 ${cfg.text}`}>{cfg.icon}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${cfg.text}`}>{ann.title}</p>
              <p className={`text-xs ${cfg.text} opacity-90 mt-0.5 ${isLong && !isExpanded ? "line-clamp-2" : ""}`}>
                {ann.message}
              </p>
              {isLong && (
                <button
                  onClick={() => toggleExpand(ann.id)}
                  className={`mt-1 flex items-center gap-0.5 text-[10px] font-semibold ${cfg.text} opacity-70 hover:opacity-100 transition-opacity`}
                >
                  {isExpanded ? <><ChevronUp size={10} /> Show less</> : <><ChevronDown size={10} /> Read more</>}
                </button>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => dismiss(ann.id)}
              className={`flex-shrink-0 p-1 rounded-md ${cfg.text} opacity-60 hover:opacity-100 ${cfg.closeHover} transition-all`}
              title="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
