/**
 * Notifications Center — Full-page notification history with filters
 */
import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import {
  Bell, Package, CheckCircle2, XCircle, Loader2, Trash2,
  AlertTriangle, ShoppingCart, LogIn, Info, CheckCheck,
  MessageCircle, ExternalLink, Clock, ShieldAlert, ShieldX,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Swipeable Notification Item ───────────────────────────────────────────────
const SWIPE_THRESHOLD = 72; // px to trigger delete reveal

/** Detect if a notification is a force-logout security alert */
function isForceLogoutAlert(notif: Notif): boolean {
  return notif.type === "system" && notif.title === "Session Force-Logged Out";
}

function SwipeableNotifItem({
  notif, isRead, cfg, onDelete, onClick, isDeleting,
}: {
  notif: Notif;
  isRead: boolean;
  cfg: { icon: React.ReactNode; color: string; bgLight: string; label: string };
  onDelete: (id: number) => void;
  onClick: (notif: Notif) => void;
  isDeleting: boolean;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // Animation phases: idle → sliding → collapsing → gone
  const [phase, setPhase] = useState<"idle" | "sliding" | "collapsing" | "gone">("idle");
  const itemRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    // Determine direction on first significant move
    if (!isHorizontal.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return;
    e.preventDefault();
    // Only allow left swipe (negative dx)
    const clamped = Math.max(-120, Math.min(0, dx));
    setOffsetX(clamped);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX < -SWIPE_THRESHOLD) {
      // Snap to reveal delete button
      setOffsetX(-80);
    } else {
      setOffsetX(0);
    }
  };

  const handleDelete = () => {
    // Phase 1: slide fully off-screen (fade + translate)
    setPhase("sliding");
    setOffsetX(-400);
    // Phase 2: collapse height after slide completes
    setTimeout(() => setPhase("collapsing"), 280);
    // Phase 3: gone — call parent
    setTimeout(() => {
      setPhase("gone");
      onDelete(notif.id);
    }, 580);
  };

  const handleItemClick = () => {
    if (offsetX < -10) {
      // Close swipe on click if swiped
      setOffsetX(0);
      return;
    }
    onClick(notif);
  };

  if (phase === "gone") return null;

  return (
    <div
      ref={itemRef}
      style={{
        // Collapse: animate max-height + opacity + margin to zero
        maxHeight: phase === "collapsing" ? "0px" : "500px",
        opacity: phase === "collapsing" ? 0 : 1,
        marginBottom: phase === "collapsing" ? "0px" : undefined,
        overflow: "hidden",
        transition: phase === "collapsing"
          ? "max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, margin 0.3s ease"
          : "none",
      }}
    >
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <div className="absolute inset-0 flex items-center justify-end bg-red-500 rounded-xl">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex flex-col items-center justify-center w-20 h-full text-white gap-1 hover:bg-red-600 transition-colors rounded-r-xl"
        >
          {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          <span className="text-[10px] font-semibold">Delete</span>
        </button>
      </div>

      {/* Notification card */}
      {(() => {
        const forceLogout = isForceLogoutAlert(notif);
        const cardClass = forceLogout
          ? isRead
            ? "bg-red-50/60 border-red-200 opacity-80 hover:border-red-300"
            : "bg-red-50 border-red-300 shadow-md shadow-red-100 hover:border-red-400"
          : isRead
            ? "bg-white border-gray-100 opacity-70 hover:border-gray-200"
            : "bg-white border-blue-100 shadow-sm hover:border-gray-200";
        const iconBg = forceLogout ? "bg-red-100 ring-2 ring-red-200" : cfg.bgLight;
        const iconColor = forceLogout ? "text-red-600" : cfg.color;
        const iconEl = forceLogout ? <ShieldX size={16} /> : cfg.icon;
        const labelBg = forceLogout ? "bg-red-100" : cfg.bgLight;
        const labelColor = forceLogout ? "text-red-700" : cfg.color;
        const labelText = forceLogout ? "Security Alert" : cfg.label;
        const titleColor = forceLogout ? "text-red-900" : "text-gray-900";
        const msgColor = forceLogout ? "text-red-700" : "text-gray-500";
        return (
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleItemClick}
        className={`relative flex gap-3 p-3 sm:p-4 rounded-xl border transition-colors cursor-pointer hover:shadow-sm ${cardClass}`}
      >
        {/* Red left accent bar for force-logout */}
        {forceLogout && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl" />
        )}
        {/* Icon */}
        <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
          {iconEl}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${labelBg} ${labelColor}`}>
              {labelText}
            </span>
            <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
              <Clock size={10} />
              {timeAgo(notif.createdAt)}
            </span>
            {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />}
            {notif.deepLink && <ExternalLink size={10} className="text-gray-300 ml-auto" />}
          </div>
          <p className={`text-sm font-semibold leading-tight mb-0.5 ${titleColor}`}>{notif.title}</p>
          <p className={`text-xs leading-relaxed line-clamp-2 ${msgColor}`}>{notif.message}</p>

          {/* Context pills */}
          {(notif.orderID || notif.jobNo || notif.qty) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {notif.orderID && (
                <span className="text-[10px] bg-gray-100 border border-gray-200 rounded-md px-1.5 py-0.5 text-gray-600 font-mono">
                  PO: {notif.orderID}
                </span>
              )}
              {notif.jobNo && (
                <span className="text-[10px] bg-gray-100 border border-gray-200 rounded-md px-1.5 py-0.5 text-gray-600 font-mono">
                  Job: {notif.jobNo}
                </span>
              )}
              {notif.qty != null && (
                <span className="text-[10px] bg-gray-100 border border-gray-200 rounded-md px-1.5 py-0.5 text-gray-600">
                  {notif.qty} pcs
                </span>
              )}
            </div>
          )}

          {notif.workerName && (
            <div className="mt-1 text-[10px] text-gray-400">by {notif.workerName}</div>
          )}
        </div>
      </div>
        );
      })()}
    </div>
    </div>
  );
}

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

const ORDER_TYPES: NotifType[] = ["order_request", "order_approved", "order_cancelled", "order_in_process", "order_deleted", "out_of_stock", "new_order"];
const SYSTEM_TYPES: NotifType[] = ["system", "login"];
const CHAT_TYPES: NotifType[] = ["chat_message"];

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotifType, {
  icon: React.ReactNode;
  color: string;
  bgLight: string;
  label: string;
}> = {
  order_request: { icon: <ShoppingCart size={16} />, color: "text-blue-600", bgLight: "bg-blue-50", label: "Request" },
  order_approved: { icon: <CheckCircle2 size={16} />, color: "text-emerald-600", bgLight: "bg-emerald-50", label: "Approved" },
  order_cancelled: { icon: <XCircle size={16} />, color: "text-red-600", bgLight: "bg-red-50", label: "Cancelled" },
  order_in_process: { icon: <Loader2 size={16} className="animate-spin" />, color: "text-amber-600", bgLight: "bg-amber-50", label: "In Process" },
  order_deleted: { icon: <Trash2 size={16} />, color: "text-rose-600", bgLight: "bg-rose-50", label: "Deleted" },
  out_of_stock: { icon: <AlertTriangle size={16} />, color: "text-orange-600", bgLight: "bg-orange-50", label: "Out of Stock" },
  new_order: { icon: <Package size={16} />, color: "text-indigo-600", bgLight: "bg-indigo-50", label: "New Order" },
  login: { icon: <LogIn size={16} />, color: "text-slate-600", bgLight: "bg-slate-50", label: "Login" },
  system: { icon: <Info size={16} />, color: "text-purple-600", bgLight: "bg-purple-50", label: "System" },
  chat_message: { icon: <MessageCircle size={16} />, color: "text-teal-600", bgLight: "bg-teal-50", label: "Chat" },
};

const FILTER_TABS: { key: FilterCategory; label: string; icon: React.ReactNode; color: string; activeBg: string; activeBorder: string; activeText: string }[] = [
  { key: "all",    label: "All",           icon: <Bell size={14} />,         color: "text-gray-500",   activeBg: "bg-blue-50",   activeBorder: "border-blue-300",   activeText: "text-blue-700" },
  { key: "orders", label: "Orders",        icon: <Package size={14} />,      color: "text-indigo-500", activeBg: "bg-indigo-50", activeBorder: "border-indigo-300", activeText: "text-indigo-700" },
  { key: "system", label: "System Alerts", icon: <ShieldAlert size={14} />,  color: "text-purple-500", activeBg: "bg-purple-50", activeBorder: "border-purple-300", activeText: "text-purple-700" },
  { key: "chat",   label: "Chat",          icon: <MessageCircle size={14} />,color: "text-teal-500",   activeBg: "bg-teal-50",   activeBorder: "border-teal-300",   activeText: "text-teal-700" },
];

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
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function Notifications() {
  const { worker } = useAuth();
  const workerID = worker?.workerID || "";
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();
  const { data: notifications = [], isLoading } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const allNotifs = notifications as Notif[];

  // Per-category counts
  const isUnread = (n: Notif) => !n.readBy.split(",").filter(Boolean).includes(workerID);
  const countFor = (types: NotifType[]) => allNotifs.filter(n => types.includes(n.type) && isUnread(n)).length;
  const tabCounts: Record<FilterCategory, number> = {
    all:    allNotifs.filter(isUnread).length,
    orders: countFor(ORDER_TYPES),
    system: countFor(SYSTEM_TYPES),
    chat:   countFor(CHAT_TYPES),
  };

  // Filter
  const filteredNotifs = allNotifs.filter(n => {
    if (filter === "all") return true;
    if (filter === "orders") return ORDER_TYPES.includes(n.type);
    if (filter === "system") return SYSTEM_TYPES.includes(n.type);
    if (filter === "chat") return CHAT_TYPES.includes(n.type);
    return true;
  });

  // Group by date
  const groupedNotifs: { label: string; items: Notif[] }[] = [];
  filteredNotifs.forEach(n => {
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

  const unreadCount = tabCounts.all;

  const handleMarkAllRead = useCallback(() => {
    const unreadIds = allNotifs
      .filter(n => !n.readBy.split(",").filter(Boolean).includes(workerID))
      .map(n => n.id);
    if (unreadIds.length > 0) markReadMutation.mutate({ workerID, ids: unreadIds });
  }, [allNotifs, workerID]);

  const handleClick = (notif: Notif) => {
    const isRead = notif.readBy.split(",").filter(Boolean).includes(workerID);
    if (!isRead) markReadMutation.mutate({ workerID, ids: [notif.id] });
    if (notif.deepLink) navigate(notif.deepLink);
  };

  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
  const handleDelete = useCallback((id: number) => {
    setDeletingIds(prev => new Set(prev).add(id));
    deleteMutation.mutate({ id }, {
      onSettled: () => setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; }),
    });
  }, [deleteMutation]);

  return (
    <AppLayout pageTitle="Notifications">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 xl:max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-5 gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-1.5 leading-tight">
              <Bell size={16} className="text-blue-600 shrink-0" />
              <span className="truncate">Notification Center</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-blue-500 text-white text-[9px] font-bold rounded-full px-1 shadow-sm shrink-0">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {unreadCount > 0 ? (
                <span className="text-blue-600 font-medium">{unreadCount} unread</span>
              ) : (
                <span className="text-emerald-600 font-medium">All caught up!</span>
              )}
              {" "}·{" "}{allNotifs.length} total
            </p>
          </div>
          <Button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markReadMutation.isPending}
            variant="outline"
            size="sm"
            className={`text-[11px] gap-1 shrink-0 h-8 px-2.5 transition-all ${
              unreadCount > 0
                ? "border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            {markReadMutation.isPending ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <CheckCheck size={11} />
            )}
            Mark all as read
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTER_TABS.map(tab => {
            const isActive = filter === tab.key;
            const cnt = tabCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border-2 ${
                  isActive
                    ? `${tab.activeBg} ${tab.activeBorder} ${tab.activeText} shadow-sm`
                    : `${tab.color} hover:bg-gray-50 border-transparent hover:border-gray-200`
                }`}
              >
                <span className={isActive ? tab.activeText : tab.color}>{tab.icon}</span>
                {tab.label}
                {cnt > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-0.5 ${
                    isActive
                      ? `${tab.activeBorder.replace("border-", "bg-").replace("-300", "-500")} text-white`
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {cnt > 99 ? "99+" : cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span>Loading notifications...</span>
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <Bell size={28} className="opacity-30" />
            </div>
            <p className="text-sm font-medium">No notifications{filter !== "all" ? ` in ${filter}` : ""}</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedNotifs.map(({ label, items }) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-2">
                  {items.map(notif => {
                    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
                    const isRead = notif.readBy.split(",").filter(Boolean).includes(workerID);
                    return (
                      <SwipeableNotifItem
                        key={notif.id}
                        notif={notif}
                        isRead={isRead}
                        cfg={cfg}
                        onDelete={handleDelete}
                        onClick={handleClick}
                        isDeleting={deletingIds.has(notif.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
