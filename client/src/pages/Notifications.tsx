/**
 * Notifications Center — Full-page notification history with filters
 */
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import {
  Bell, Package, CheckCircle2, XCircle, Loader2, Trash2,
  AlertTriangle, ShoppingCart, LogIn, Info, CheckCheck,
  MessageCircle, ExternalLink, Clock, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

const FILTER_TABS: { key: FilterCategory; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Bell size={14} /> },
  { key: "orders", label: "Orders", icon: <Package size={14} /> },
  { key: "system", label: "System", icon: <Info size={14} /> },
  { key: "chat", label: "Chat", icon: <MessageCircle size={14} /> },
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

  // Filter
  const filteredNotifs = allNotifs.filter(n => {
    if (filter === "all") return true;
    if (filter === "orders") return ["order_request", "order_approved", "order_cancelled", "order_in_process", "order_deleted", "out_of_stock", "new_order"].includes(n.type);
    if (filter === "system") return ["system", "login"].includes(n.type);
    if (filter === "chat") return n.type === "chat_message";
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

  const unreadCount = allNotifs.filter(n => !n.readBy.split(",").filter(Boolean).includes(workerID)).length;

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

  return (
    <AppLayout pageTitle="Notifications">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell size={20} className="text-blue-600" />
              Notification Center
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount > 0 ? (
                <span className="text-blue-600 font-medium">{unreadCount} unread</span>
              ) : (
                <span className="text-emerald-600 font-medium">All caught up!</span>
              )}
              {" "}&middot;{" "}{allNotifs.length} total
            </p>
          </div>
          <Button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markReadMutation.isPending}
            variant="outline"
            size="sm"
            className={`text-xs gap-1.5 transition-all ${
              unreadCount > 0
                ? "border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            {markReadMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCheck size={12} />
            )}
            Mark all as read
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                filter === tab.key
                  ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
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
                      <div
                        key={notif.id}
                        onClick={() => handleClick(notif)}
                        className={`flex gap-3 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm hover:border-gray-200 ${
                          isRead ? "bg-white border-gray-100 opacity-70" : "bg-white border-blue-100 shadow-sm"
                        }`}
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bgLight} ${cfg.color}`}>
                          {cfg.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${cfg.bgLight} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                              <Clock size={10} />
                              {timeAgo(notif.createdAt)}
                            </span>
                            {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />}
                            {notif.deepLink && <ExternalLink size={10} className="text-gray-300 ml-auto" />}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 leading-tight mb-0.5">{notif.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.message}</p>

                          {/* Context pills */}
                          {(notif.orderID || notif.jobNo || notif.qty) && (
                            <div className="flex flex-wrap gap-1 mt-2">
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
