import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  Bell, X, CheckCheck, Package, CheckCircle2, XCircle,
  Loader2, Trash2, AlertTriangle, ShoppingCart, LogIn, Info,
  RefreshCw, Clock
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type NotifType =
  | "order_request" | "order_approved" | "order_cancelled"
  | "order_in_process" | "order_deleted" | "out_of_stock"
  | "new_order" | "login" | "system";

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
  readBy: string;
  createdAt: Date;
}

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
};

// ── Time formatter ────────────────────────────────────────────────────────────
function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Notification Item ─────────────────────────────────────────────────────────
function NotifItem({ notif, workerID, onRead }: { notif: Notif; workerID: string; onRead: (id: number) => void }) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
  const isRead = notif.readBy.split(",").filter(Boolean).includes(workerID);

  return (
    <div
      className={`relative flex gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:brightness-110 ${cfg.bg} ${cfg.border} ${isRead ? "opacity-60" : ""}`}
      onClick={() => !isRead && onRead(notif.id)}
    >
      {/* Unread dot */}
      {!isRead && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white ${cfg.badge}`}>
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
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Unread count
  const unreadCount = notifications.filter(
    (n) => !n.readBy.split(",").filter(Boolean).includes(workerID)
  ).length;

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

  // Mark all as read when panel opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      // Delay slightly so user sees the unread state first
      const t = setTimeout(() => handleMarkAllRead(), 2000);
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
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  <CheckCheck size={11} />
                  Mark all read
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

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
            {listQuery.isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500">
                <Bell size={28} className="opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem key={n.id} notif={n} workerID={workerID} onRead={handleRead} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/10 bg-white/3">
            <p className="text-[10px] text-slate-500 text-center">
              Auto-refreshes every 15s · {notifications.length} total
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
