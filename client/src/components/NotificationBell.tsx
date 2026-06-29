import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Bell, X, CheckCheck, Package, CheckCircle2, XCircle,
  Loader2, Trash2, AlertTriangle, ShoppingCart, LogIn, Info,
  RefreshCw, Clock, MessageCircle, ExternalLink, Filter,
  Volume2, VolumeX,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
type NotifType =
  | "order_request" | "order_approved" | "order_cancelled"
  | "order_in_process" | "order_deleted" | "out_of_stock"
  | "new_order" | "login" | "system" | "chat_message";

interface Notif {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  orderID?: string | null;
  productionOrder?: string | null;
  jobNo?: string | null;
  qty?: number | null;
  fluteType?: string | null;
  workerID?: string | null;
  workerName?: string | null;
  trackingId?: string | null;
  deepLink?: string | null;
  readBy: string;
  createdAt: Date;
}

type FilterCategory = "all" | "orders" | "system" | "chat";

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotifType, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  badge: string;
  label: string;
}> = {
  order_request: {
    icon: <ShoppingCart size={14} />,
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    badge: "bg-blue-500",
    label: "Request",
  },
  order_approved: {
    icon: <CheckCircle2 size={14} />,
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500",
    label: "Approved",
  },
  order_cancelled: {
    icon: <XCircle size={14} />,
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    badge: "bg-red-500",
    label: "Cancelled",
  },
  order_in_process: {
    icon: <Loader2 size={14} className="animate-spin" />,
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    badge: "bg-amber-500",
    label: "In Process",
  },
  order_deleted: {
    icon: <Trash2 size={14} />,
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    badge: "bg-rose-500",
    label: "Deleted",
  },
  out_of_stock: {
    icon: <AlertTriangle size={14} />,
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    badge: "bg-orange-500",
    label: "Out of Stock",
  },
  new_order: {
    icon: <Package size={14} />,
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/30",
    badge: "bg-indigo-500",
    label: "New Order",
  },
  login: {
    icon: <LogIn size={14} />,
    bg: "bg-slate-500/15",
    border: "border-slate-500/30",
    badge: "bg-slate-500",
    label: "Login",
  },
  system: {
    icon: <Info size={14} />,
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
    badge: "bg-purple-500",
    label: "System",
  },
  chat_message: {
    icon: <MessageCircle size={14} />,
    bg: "bg-teal-500/15",
    border: "border-teal-500/30",
    badge: "bg-teal-500",
    label: "Chat",
  },
};

const FILTER_TABS: { key: FilterCategory; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Bell size={12} /> },
  { key: "orders", label: "Orders", icon: <Package size={12} /> },
  { key: "system", label: "System", icon: <Info size={12} /> },
  { key: "chat", label: "Chat", icon: <MessageCircle size={12} /> },
];

// ── Sound Hook ───────────────────────────────────────────────────────────────
function useNotifSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const play = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) { /* ignore */ }
  }, []);
  return play;
}

// ── Time formatter ────────────────────────────────────────────────────────────
function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── Notification Item ─────────────────────────────────────────────────────────
function NotifItem({ notif, workerID, onRead, onNavigate }: {
  notif: Notif; workerID: string; onRead: (id: number) => void; onNavigate: (path: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
  const isRead = notif.readBy.split(",").filter(Boolean).includes(workerID);

  const handleClick = () => {
    if (!isRead) onRead(notif.id);
    if (notif.deepLink) onNavigate(notif.deepLink);
  };

  return (
    <div
      className={`relative flex gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] ${cfg.bg} ${cfg.border} ${isRead ? "opacity-55" : ""}`}
      onClick={handleClick}
    >
      {/* Unread dot */}
      {!isRead && (
        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)] animate-pulse" />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white ${cfg.badge} shadow-sm`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
            <Clock size={9} />
            {timeAgo(notif.createdAt)}
          </span>
          {notif.deepLink && (
            <ExternalLink size={9} className="text-slate-400 ml-auto" />
          )}
        </div>
        <p className="text-xs font-semibold text-white leading-tight mb-0.5 truncate">{notif.title}</p>
        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{notif.message}</p>

        {/* Order context pills */}
        {(notif.orderID || notif.jobNo || notif.qty) && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {notif.orderID && (
              <span className="text-[10px] bg-white/10 border border-white/15 rounded-md px-1.5 py-0.5 text-slate-200 font-mono">
                PO: {notif.orderID}
              </span>
            )}
            {notif.jobNo && (
              <span className="text-[10px] bg-white/10 border border-white/15 rounded-md px-1.5 py-0.5 text-slate-200 font-mono">
                Job: {notif.jobNo}
              </span>
            )}
            {notif.qty != null && (
              <span className="text-[10px] bg-white/10 border border-white/15 rounded-md px-1.5 py-0.5 text-slate-200">
                {notif.qty} pcs
              </span>
            )}
            {notif.fluteType && (
              <span className="text-[10px] bg-white/10 border border-white/15 rounded-md px-1.5 py-0.5 text-slate-200">
                {notif.fluteType}
              </span>
            )}
          </div>
        )}

        {/* Actor */}
        {notif.workerName && (
          <div className="mt-1 text-[10px] text-slate-400">
            by {notif.workerName}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface NotificationBellProps {
  workerID: string;
  workerName?: string;
}

export default function NotificationBell({ workerID, workerName }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const [, navigate] = useLocation();
  const playSound = useNotifSound();

  // tRPC queries — poll every 3s when open, 8s when closed
  const listQuery = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: open ? 3000 : 8000,
    staleTime: 2000,
  });
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => listQuery.refetch(),
  });
  const utils = trpc.useUtils();

  const notifications = (listQuery.data ?? []) as Notif[];

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "orders") return ["order_request", "order_approved", "order_cancelled", "order_in_process", "order_deleted", "out_of_stock", "new_order"].includes(n.type);
    if (filter === "system") return ["system", "login"].includes(n.type);
    if (filter === "chat") return n.type === "chat_message";
    return true;
  });

  // Group by date
  const groupedNotifs: { label: string; items: Notif[] }[] = [];
  filteredNotifications.forEach(n => {
    const d = new Date(n.createdAt);
    const now = new Date();
    let label = "Older";
    if (d.toDateString() === now.toDateString()) label = "Today";
    else {
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
      else if (now.getTime() - d.getTime() < 7 * 86400000) label = "This Week";
    }
    const last = groupedNotifs[groupedNotifs.length - 1];
    if (!last || last.label !== label) groupedNotifs.push({ label, items: [n] });
    else last.items.push(n);
  });

  // Unread count
  const unreadCount = notifications.filter(
    (n) => !n.readBy.split(",").filter(Boolean).includes(workerID)
  ).length;

  // Sound + toast on new notification
  useEffect(() => {
    if (prevCountRef.current > 0 && notifications.length > prevCountRef.current) {
      const newNotifs = notifications.slice(0, notifications.length - prevCountRef.current);
      if (newNotifs.length > 0 && soundEnabled) {
        playSound();
        // Show toast for latest notification
        const latest = newNotifs[0];
        if (latest && !open) {
          const cfg = TYPE_CONFIG[latest.type] ?? TYPE_CONFIG.system;
          toast(latest.title, {
            description: latest.message,
            duration: 4000,
            action: latest.deepLink ? {
              label: "View",
              onClick: () => { navigate(latest.deepLink!); },
            } : undefined,
          });
        }
      }
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length]);

  // Mark single as read
  const handleRead = useCallback((id: number) => {
    markReadMutation.mutate({ workerID, ids: [id] });
  }, [workerID, markReadMutation]);

  // Mark all as read
  const handleMarkAllRead = useCallback(() => {
    const unreadIds = notifications
      .filter((n) => !n.readBy.split(",").filter(Boolean).includes(workerID))
      .map((n) => n.id);
    if (unreadIds.length > 0) {
      markReadMutation.mutate({ workerID, ids: unreadIds });
    }
  }, [notifications, workerID, markReadMutation]);

  // Navigate to deep link
  const handleNavigate = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  // Listen for PUSH_RECEIVED from service worker → immediate refetch
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_RECEIVED") {
        listQuery.refetch();
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, [listQuery]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Mark all as read when panel opens (with delay)
  useEffect(() => {
    if (open && unreadCount > 0) {
      const t = setTimeout(() => handleMarkAllRead(), 3000);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all active:scale-95"
        aria-label="Notifications"
      >
        <Bell size={16} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-bounce">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 sm:w-[420px] bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-blue-400" />
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Sound toggle */}
              <button
                onClick={() => setSoundEnabled(v => !v)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title={soundEnabled ? "Mute sounds" : "Enable sounds"}
              >
                {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  <CheckCheck size={11} />
                  Read all
                </button>
              )}
              <button
                onClick={() => utils.notifications.list.invalidate()}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw size={12} className={listQuery.isFetching ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 overflow-x-auto">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  filter === tab.key
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            {listQuery.isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500">
                <Bell size={28} className="opacity-30" />
                <p className="text-sm">No notifications{filter !== "all" ? ` in ${filter}` : ""}</p>
              </div>
            ) : (
              groupedNotifs.map(({ label, items }) => (
                <div key={label}>
                  <div className="flex items-center gap-2 py-1.5 px-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    {items.map((n) => (
                      <NotifItem key={n.id} notif={n} workerID={workerID} onRead={handleRead} onNavigate={handleNavigate} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/10 bg-white/3 flex items-center justify-between">
            <p className="text-[10px] text-slate-500">
              {filteredNotifications.length} notifications
            </p>
            <button
              onClick={() => { setOpen(false); navigate("/notifications"); }}
              className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              View all <ExternalLink size={9} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
