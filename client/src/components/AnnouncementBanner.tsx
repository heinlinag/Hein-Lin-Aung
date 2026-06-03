import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, Info, XCircle, Megaphone } from "lucide-react";
import type { Announcement } from "../../../drizzle/schema";

type AnnType = "info" | "warning" | "success" | "error";

const TYPE_ICON: Record<AnnType, React.ReactNode> = {
  info:    <Info size={13} />,
  warning: <AlertTriangle size={13} />,
  success: <CheckCircle2 size={13} />,
  error:   <XCircle size={13} />,
};

const TYPE_DOT: Record<AnnType, string> = {
  info:    "bg-blue-400",
  warning: "bg-amber-400",
  success: "bg-green-400",
  error:   "bg-red-400",
};

export function AnnouncementBanner() {
  const { data: active = [] } = trpc.announcements.listActive.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const items = active as Announcement[];
  if (items.length === 0) return null;

  // Build ticker items
  const tickerItems = items.map((a: Announcement) => ({
    id: a.id,
    type: a.type as AnnType,
    label: `${a.title} — ${a.message}`,
  }));

  // Triple the items: [Ann1, Ann2, Ann3, Ann1, Ann2, Ann3, Ann1, Ann2, Ann3]
  // Animation moves -33.333% (1 copy worth) so it loops: Ann1→Ann2→Ann3→Ann1→...
  const tripled = [...tickerItems, ...tickerItems, ...tickerItems];

  // Speed: ~7.5px per char at text-xs, target 100px/s
  // Duration covers 1 copy (33.333% of total width)
  const totalCharsOnce = tickerItems.reduce((sum, t) => sum + t.label.length + 15, 0);
  const estimatedPxOnce = totalCharsOnce * 7.5;
  const duration = Math.max(8, Math.round(estimatedPxOnce / 100));

  return (
    <div className="w-full bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 overflow-hidden relative">
      {/* Left NOTICE label — fixed, always visible */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-1.5 px-3 bg-gradient-to-r from-slate-800 via-slate-800/95 to-transparent pr-8">
        <Megaphone size={12} className="text-indigo-400 flex-shrink-0" />
        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest whitespace-nowrap">
          Notice
        </span>
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-slate-800 to-transparent pointer-events-none" />

      {/* Scrolling ticker */}
      <div className="flex items-center py-2 pl-24 overflow-hidden">
        <div
          className="flex items-center gap-0 whitespace-nowrap animate-marquee-loop"
          style={{ animationDuration: `${duration}s` }}
        >
          {tripled.map((item, idx) => (
            <span key={`${item.id}-${idx}`} className="inline-flex items-center gap-1.5 mr-12">
              {/* Colored dot */}
              <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_DOT[item.type]}`} />
              {/* Icon */}
              <span className={`flex-shrink-0 ${
                item.type === "info" ? "text-blue-400" :
                item.type === "warning" ? "text-amber-400" :
                item.type === "success" ? "text-green-400" :
                "text-red-400"
              }`}>
                {TYPE_ICON[item.type]}
              </span>
              {/* Text */}
              <span className="text-xs text-slate-200 font-medium">{item.label}</span>
              {/* Separator */}
              <span className="ml-10 text-slate-500 text-xs">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
