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
  MessageCircle, ExternalLink, Clock, ShieldAlert, ShieldX, Sparkles,
} from "lucide-react";

// ── Swipeable Notification Item ───────────────────────────────────────────────
const SWIPE_THRESHOLD = 72;

function isForceLogoutAlert(notif: Notif): boolean {
  return notif.type === "system" && notif.title === "Session Force-Logged Out";
}

function SwipeableNotifItem({
  notif, isRead, cfg, onDelete, onClick, isDeleting,
}: {
  notif: Notif;
  isRead: boolean;
  cfg: { icon: React.ReactNode; color: string; bgLight: string; label: string; gradient: string };
  onDelete: (id: number) => void;
  onClick: (notif: Notif) => void;
  isDeleting: boolean;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
    if (!isHorizontal.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return;
    e.preventDefault();
    const clamped = Math.max(-120, Math.min(0, dx));
    setOffsetX(clamped);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX < -SWIPE_THRESHOLD) setOffsetX(-80);
    else setOffsetX(0);
  };

  const handleDelete = () => {
    setPhase("sliding");
    setOffsetX(-400);
    setTimeout(() => setPhase("collapsing"), 280);
    setTimeout(() => { setPhase("gone"); onDelete(notif.id); }, 580);
  };

  const handleItemClick = () => {
    if (offsetX < -10) { setOffsetX(0); return; }
    onClick(notif);
  };

  if (phase === "gone") return null;

  const forceLogout = isForceLogoutAlert(notif);

  // Glassmorphism card styles
  const cardBg = forceLogout
    ? "rgba(254,242,242,0.92)"
    : isRead
    ? "rgba(255,255,255,0.65)"
    : "rgba(255,255,255,0.92)";
  const cardBorder = forceLogout
    ? "rgba(252,165,165,0.5)"
    : isRead
    ? "rgba(226,232,240,0.5)"
    : "rgba(255,255,255,0.95)";
  const accentGradient = forceLogout
    ? "linear-gradient(90deg, #ef4444, #dc2626)"
    : cfg.gradient;
  const iconBg = forceLogout ? "linear-gradient(135deg, #ef4444, #dc2626)" : cfg.gradient;
  const labelBg = forceLogout ? "rgba(254,226,226,0.8)" : "rgba(241,245,249,0.8)";
  const labelColor = forceLogout ? "#b91c1c" : "#64748b";
  const iconEl = forceLogout ? <ShieldX size={15} className="text-white" /> : cfg.icon;
  const labelText = forceLogout ? "Security Alert" : cfg.label;

  return (
    <div
      ref={itemRef}
      style={{
        maxHeight: phase === "collapsing" ? "0px" : "500px",
        opacity: phase === "collapsing" ? 0 : isRead ? 0.75 : 1,
        marginBottom: phase === "collapsing" ? "0px" : undefined,
        overflow: "hidden",
        transition: phase === "collapsing"
          ? "max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, margin 0.3s ease"
          : "none",
      }}
    >
      <div className="relative overflow-hidden rounded-2xl">
        {/* Delete background */}
        <div className="absolute inset-0 flex items-center justify-end rounded-2xl" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex flex-col items-center justify-center w-20 h-full text-white gap-1 hover:bg-red-700/30 transition-colors rounded-r-2xl"
          >
            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            <span className="text-[10px] font-semibold">Delete</span>
          </button>
        </div>

        {/* Notification card */}
        <div
          style={{
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
            background: cardBg,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${cardBorder}`,
            boxShadow: isRead ? "none" : "0 4px 16px rgba(0,0,0,0.06)",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleItemClick}
          className="relative flex gap-3 p-3 sm:p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md"
        >
          {/* Accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl" style={{ background: accentGradient }} />

          {/* Icon */}
          <div
            className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: iconBg }}
          >
            {iconEl}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ background: labelBg, color: labelColor }}
              >
                {labelText}
              </span>
              <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                <Clock size={10} />
                {timeAgo(notif.createdAt)}
              </span>
              {!isRead && (
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
              )}
              {notif.deepLink && <ExternalLink size={10} className="text-gray-300 ml-auto" />}
            </div>
            <p className="text-sm font-semibold leading-tight mb-0.5 text-gray-800">{notif.title}</p>
            <p className="text-xs leading-relaxed line-clamp-2 text-gray-500">{notif.message}</p>

            {/* Context pills */}
            {(notif.orderID || notif.jobNo || notif.qty) && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {notif.orderID && (
                  <span className="text-[10px] rounded-md px-1.5 py-0.5 text-gray-600 font-mono"
                    style={{ background: "rgba(241,245,249,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}>
                    PO: {notif.orderID}
                  </span>
                )}
                {notif.jobNo && (
                  <span className="text-[10px] rounded-md px-1.5 py-0.5 text-gray-600 font-mono"
                    style={{ background: "rgba(241,245,249,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}>
                    Job: {notif.jobNo}
                  </span>
                )}
                {notif.qty != null && (
                  <span className="text-[10px] rounded-md px-1.5 py-0.5 text-gray-600"
                    style={{ background: "rgba(241,245,249,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}>
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

const TYPE_CONFIG: Record<NotifType, {
  icon: React.ReactNode;
  color: string;
  bgLight: string;
  label: string;
  gradient: string;
}> = {
  order_request:  { icon: <ShoppingCart size={15} className="text-white" />, color: "text-blue-600",   bgLight: "bg-blue-50",   label: "Request",    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)" },
  order_approved: { icon: <CheckCircle2 size={15} className="text-white" />, color: "text-emerald-600",bgLight: "bg-emerald-50",label: "Approved",   gradient: "linear-gradient(135deg, #10b981, #059669)" },
  order_cancelled:{ icon: <XCircle size={15} className="text-white" />,      color: "text-red-600",    bgLight: "bg-red-50",    label: "Cancelled",  gradient: "linear-gradient(135deg, #ef4444, #dc2626)" },
  order_in_process:{ icon: <Loader2 size={15} className="text-white animate-spin" />, color: "text-amber-600", bgLight: "bg-amber-50", label: "In Process", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  order_deleted:  { icon: <Trash2 size={15} className="text-white" />,       color: "text-rose-600",   bgLight: "bg-rose-50",   label: "Deleted",    gradient: "linear-gradient(135deg, #f43f5e, #e11d48)" },
  out_of_stock:   { icon: <AlertTriangle size={15} className="text-white" />,color: "text-orange-600", bgLight: "bg-orange-50", label: "Out of Stock",gradient: "linear-gradient(135deg, #f97316, #ea580c)" },
  new_order:      { icon: <Package size={15} className="text-white" />,      color: "text-indigo-600", bgLight: "bg-indigo-50", label: "New Order",  gradient: "linear-gradient(135deg, #6366f1, #4f46e5)" },
  login:          { icon: <LogIn size={15} className="text-white" />,        color: "text-slate-600",  bgLight: "bg-slate-50",  label: "Login",      gradient: "linear-gradient(135deg, #64748b, #475569)" },
  system:         { icon: <Info size={15} className="text-white" />,         color: "text-purple-600", bgLight: "bg-purple-50", label: "System",     gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
  chat_message:   { icon: <MessageCircle size={15} className="text-white" />,color: "text-teal-600",   bgLight: "bg-teal-50",   label: "Chat",       gradient: "linear-gradient(135deg, #14b8a6, #0d9488)" },
};

const FILTER_TABS: { key: FilterCategory; label: string; icon: React.ReactNode; gradient: string }[] = [
  { key: "all",    label: "All",           icon: <Bell size={13} />,          gradient: "linear-gradient(135deg, #3b82f6, #2563eb)" },
  { key: "orders", label: "Orders",        icon: <Package size={13} />,       gradient: "linear-gradient(135deg, #6366f1, #4f46e5)" },
  { key: "system", label: "System Alerts", icon: <ShieldAlert size={13} />,   gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
  { key: "chat",   label: "Chat",          icon: <MessageCircle size={13} />, gradient: "linear-gradient(135deg, #14b8a6, #0d9488)" },
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

  const isUnread = (n: Notif) => !n.readBy.split(",").filter(Boolean).includes(workerID);
  const countFor = (types: NotifType[]) => allNotifs.filter(n => types.includes(n.type) && isUnread(n)).length;
  const tabCounts: Record<FilterCategory, number> = {
    all:    allNotifs.filter(isUnread).length,
    orders: countFor(ORDER_TYPES),
    system: countFor(SYSTEM_TYPES),
    chat:   countFor(CHAT_TYPES),
  };

  const filteredNotifs = allNotifs.filter(n => {
    if (filter === "all") return true;
    if (filter === "orders") return ORDER_TYPES.includes(n.type);
    if (filter === "system") return SYSTEM_TYPES.includes(n.type);
    if (filter === "chat") return CHAT_TYPES.includes(n.type);
    return true;
  });

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
  }, [allNotifs, workerID, markReadMutation]);

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
      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.04); }
        }
        .notif-orb { animation: floatOrb 8s ease-in-out infinite; }
        .notif-orb-slow { animation: floatOrb 11s ease-in-out infinite reverse; }
        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(500%); opacity: 0; }
        }
        .notif-scan { animation: scanLine 4s ease-in-out infinite; }
      `}</style>

      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)",
        minHeight: "120px"
      }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        {/* Floating orbs */}
        <div className="absolute top-2 right-10 w-24 h-24 rounded-full notif-orb opacity-20"
          style={{ background: "radial-gradient(circle, #a5b4fc, #6366f1)" }} />
        <div className="absolute bottom-0 right-32 w-14 h-14 rounded-full notif-orb-slow opacity-15"
          style={{ background: "radial-gradient(circle, #c7d2fe, #818cf8)" }} />
        <div className="absolute top-4 left-1/3 w-10 h-10 rounded-full notif-orb opacity-10"
          style={{ background: "radial-gradient(circle, #e0e7ff, #a5b4fc)" }} />
        {/* Scan line */}
        <div className="absolute inset-x-0 h-px notif-scan"
          style={{ background: "linear-gradient(90deg, transparent, rgba(165,180,252,0.6), transparent)" }} />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/40"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))", border: "1px solid rgba(255,255,255,0.3)" }}>
                <Bell size={22} className="text-white" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center shadow-sm px-1">
                  <span className="text-[9px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-300 flex items-center justify-center shadow-sm">
                <Sparkles size={8} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Notification Center</h1>
              <p className="text-indigo-200 text-xs mt-0.5">
                {unreadCount > 0
                  ? <span className="text-indigo-100 font-semibold">{unreadCount} unread</span>
                  : <span className="text-emerald-300 font-semibold">All caught up!</span>
                }
                {" · "}{allNotifs.length} total
              </p>
            </div>
          </div>

          {/* Mark all read button */}
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markReadMutation.isPending}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-100 transition-all disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            {markReadMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
            Mark all read
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-5" style={{ background: "linear-gradient(180deg, rgba(238,242,255,0.5) 0%, rgba(245,247,255,0.2) 100%)" }}>
        <div className="max-w-3xl mx-auto">

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {FILTER_TABS.map(tab => {
              const isActive = filter === tab.key;
              const cnt = tabCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                  style={isActive
                    ? { background: tab.gradient, color: "white", boxShadow: "0 3px 10px rgba(0,0,0,0.15)" }
                    : { background: "rgba(255,255,255,0.8)", color: "#6b7280", border: "1px solid rgba(229,231,235,0.8)" }
                  }
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {cnt > 0 && (
                    <span
                      className="inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-0.5"
                      style={isActive
                        ? { background: "rgba(255,255,255,0.3)", color: "white" }
                        : { background: "rgba(99,102,241,0.1)", color: "#6366f1" }
                      }
                    >
                      {cnt > 99 ? "99+" : cnt}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mobile mark all read */}
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markReadMutation.isPending}
              className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 transition-all ml-auto disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(229,231,235,0.8)" }}
            >
              {markReadMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
              Mark all
            </button>
          </div>

          {/* Notification List */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded-2xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.6)", animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(165,180,252,0.3)" }}>
                <Bell size={28} className="text-indigo-200" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No notifications{filter !== "all" ? ` in ${filter}` : ""}</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedNotifs.map(({ label, items }) => (
                <div key={label}>
                  {/* Date group label */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{label}</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(165,180,252,0.3)" }} />
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
      </div>
    </AppLayout>
  );
}
