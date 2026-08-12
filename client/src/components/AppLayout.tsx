/**
 * AppLayout — Responsive layout wrapper
 * Mobile  : sticky top header + full-width content + bottom nav
 * Desktop : fixed left dark-glassmorphism sidebar + scrollable main content
 */
import { useLocation } from "wouter";
import { useRef, useEffect, useState } from "react";
import {
  ClipboardList, Package, CheckCircle2, LogOut,
  User, BookOpen, Activity, ChevronRight, X, Building2, IdCard, Shield, HelpCircle, ScanLine, Home, MessageCircle, Bell, FlaskConical, FileText, LifeBuoy, CircleHelp, Camera, MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const LOGO_URL = "/manus-storage/gspp_logo_new_2db75f16.png";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",               label: "Home",             icon: <Home size={16} /> },
  { href: "/submit-order",   label: "Add Stock NPRM",     icon: <ClipboardList size={16} /> },
  { href: "/stock-history",  label: "Stock History",    icon: <Package size={16} /> },
  { href: "/approval-center",label: "NPRM Modify Order",icon: <CheckCircle2 size={16} /> },
  { href: "/customer-sample",label: "Customer Sample",  icon: <FlaskConical size={16} /> },
  { href: "/qr-scanner",     label: "QR Scanner",       icon: <ScanLine size={16} /> },
  { href: "/chat",           label: "Messages",         icon: <MessageCircle size={16} /> },
  { href: "/notifications",  label: "Notifications",    icon: <Bell size={16} /> },
  { href: "/admin",          label: "Admin Panel",      icon: <ChevronRight size={16} />, adminOnly: true },
];

const RESOURCE_NAV_ITEMS: NavItem[] = [
  { href: "/user-profile",   label: "My Profile",       icon: <User size={16} /> },
  { href: "/docs",           label: "Documentation",    icon: <BookOpen size={16} /> },
  { href: "/help",           label: "Help Center",       icon: <LifeBuoy size={16} /> },
  { href: "/faq",            label: "FAQ",               icon: <CircleHelp size={16} /> },
];

const MOBILE_MORE_ITEMS: NavItem[] = [
  { href: "/user-profile", label: "My Profile",    icon: <User size={19} /> },
  { href: "/docs",         label: "Documentation", icon: <BookOpen size={19} /> },
  { href: "/help",         label: "Help Center",   icon: <LifeBuoy size={19} /> },
  { href: "/faq",          label: "FAQ",           icon: <CircleHelp size={19} /> },
  { href: "/status",       label: "System Status", icon: <Activity size={19} /> },
];

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  headerActions?: React.ReactNode;
  fullHeight?: boolean;
  hideAppHeader?: boolean;
}

function levelLabel(level: string) {
  if (level === "1")   return { text: "Level 1",   bg: "bg-orange-100", fg: "text-orange-700", badge: "bg-orange-500/20 text-orange-300 border border-orange-400/30", badgeLight: "bg-orange-200 text-orange-700" };
  if (level === "1.1") return { text: "Level 1.1", bg: "bg-purple-100", fg: "text-purple-700", badge: "bg-purple-500/20 text-purple-300 border border-purple-400/30", badgeLight: "bg-purple-200 text-purple-700" };
  return                      { text: "Level 2",   bg: "bg-green-100",  fg: "text-green-700",  badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30", badgeLight: "bg-green-200 text-green-700" };
}

export default function AppLayout({ children, pageTitle, headerActions, fullHeight, hideAppHeader = false }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { worker, logoutWorker } = useAuth();
  // Register push notifications on every page load (uses correct VAPID key from server)
  const { permissionState, requestPermission } = usePushNotifications(worker?.workerID ?? null);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem("notif-banner-dismissed") === "1"; } catch { return false; }
  });
  const showBanner = !bannerDismissed && (permissionState === "default" || permissionState === "denied");
  const handleDismiss = () => {
    setBannerDismissed(true);
    try { sessionStorage.setItem("notif-banner-dismissed", "1"); } catch { /* ignore */ }
  };
  const deactivateDevice = trpc.workers.deactivateDevice.useMutation();
  const utils = trpc.useUtils();
  const userLevel = worker?.userLevel ?? "2";
  const lv = levelLabel(userLevel);

  const [moreOpen, setMoreOpen] = useState(false);
  const [moreMotion, setMoreMotion] = useState<"opening" | "open" | "closing">("opening");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [moreDragOffset, setMoreDragOffset] = useState(0);
  const [isDrawerDragging, setIsDrawerDragging] = useState(false);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [notificationsPanelMotion, setNotificationsPanelMotion] = useState<"opening" | "open" | "closing">("opening");
  const [notificationsPanelDragOffset, setNotificationsPanelDragOffset] = useState(0);
  const [isNotificationsPanelDragging, setIsNotificationsPanelDragging] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const moreCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationsPanelCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreTouchStartY = useRef<number | null>(null);
  const notificationsPanelTouchStartX = useRef<number | null>(null);

  // Fetch profile picture & display name
  const profileQuery = trpc.profile.get.useQuery(
    { workerID: worker?.workerID ?? "" },
    { enabled: !!worker?.workerID, staleTime: 60_000 }
  );
  const profilePic = profileQuery.data?.profilePicture ?? null;
  const displayName = profileQuery.data?.displayName ?? worker?.name ?? "";

  useEffect(() => () => {
    if (moreCloseTimer.current) clearTimeout(moreCloseTimer.current);
    if (notificationsPanelCloseTimer.current) clearTimeout(notificationsPanelCloseTimer.current);
  }, []);

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  const heartbeatMutation = trpc.chat.heartbeat.useMutation({
    onSuccess: (data) => {
      if (data && (data as { displaced?: boolean }).displaced) {
        if (worker?.workerID) {
          logoutWorker();
          navigate("/login?reason=displaced");
        }
      }
    },
  });

  useEffect(() => {
    if (!worker?.workerID) return;
    const deviceToken = localStorage.getItem("gspp_device_token") ?? undefined;
    heartbeatMutation.mutate({ workerID: worker.workerID, deviceToken });
    const interval = setInterval(() => {
      heartbeatMutation.mutate({ workerID: worker.workerID, deviceToken });
    }, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker?.workerID]);

  const pendingQuery = trpc.pendingRequests.list.useQuery(
    { status: "pending" },
    { refetchInterval: 30000 }
  );
  const pendingCount = (pendingQuery.data ?? []).length;

  const samplePendingQuery = trpc.customerSamples.list.useQuery(
    { status: "pending" },
    { refetchInterval: 30000 }
  );
  const sampleProgressQuery = trpc.customerSamples.list.useQuery(
    { status: "progress" },
    { refetchInterval: 30000 }
  );
  const sampleCount = (samplePendingQuery.data?.length ?? 0) + (sampleProgressQuery.data?.length ?? 0);

  const unreadMsgQuery = trpc.chat.getUnreadCount.useQuery(
    { workerID: worker?.workerID ?? "" },
    { refetchInterval: 5000, enabled: !!worker?.workerID }
  );
  const unreadMsgCount = unreadMsgQuery.data?.count ?? 0;

  const unreadNotifQuery = trpc.notifications.unreadCount.useQuery(
    { workerID: worker?.workerID ?? "" },
    { refetchInterval: 10000, enabled: !!worker?.workerID }
  );
  const unreadNotifCount = unreadNotifQuery.data?.count ?? 0;
  const notificationsPanelQuery = trpc.notifications.list.useQuery(undefined, {
    enabled: notificationsPanelOpen && !!worker?.workerID,
    refetchInterval: notificationsPanelOpen ? 5000 : false,
  });
  const notificationsMarkRead = trpc.notifications.markRead.useMutation();

  const handleLogout = () => {
    if (worker?.workerID) {
      deactivateDevice.mutate({ workerID: worker.workerID });
    }
    logoutWorker();
    navigate("/login");
  };

  const isActive = (href: string) => location === href;
  const goTo = (href: string) => navigate(href);
  const isMoreActive = MOBILE_MORE_ITEMS.some(item => location === item.href);
  const openMore = () => {
    closeNotificationsPanel();
    if (moreCloseTimer.current) clearTimeout(moreCloseTimer.current);
    setMoreDragOffset(0);
    setMoreOpen(true);
    setMoreMotion("opening");
    requestAnimationFrame(() => setMoreMotion("open"));
  };
  const closeMore = () => {
    if (!moreOpen || moreMotion === "closing") return;
    setMoreMotion("closing");
    moreCloseTimer.current = setTimeout(() => {
      setMoreOpen(false);
      moreCloseTimer.current = null;
    }, 280);
  };
  const handleMoreTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    moreTouchStartY.current = event.touches[0]?.clientY ?? null;
    setIsDrawerDragging(true);
  };
  const handleMoreTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (moreTouchStartY.current === null) return;
    const distance = (event.touches[0]?.clientY ?? moreTouchStartY.current) - moreTouchStartY.current;
    if (distance > 0) setMoreDragOffset(Math.min(distance, 160));
  };
  const handleMoreTouchEnd = () => {
    const shouldClose = moreDragOffset > 88;
    moreTouchStartY.current = null;
    setIsDrawerDragging(false);
    setMoreDragOffset(0);
    if (shouldClose) closeMore();
  };
  const openNotificationsPanel = () => {
    closeMore();
    if (notificationsPanelCloseTimer.current) clearTimeout(notificationsPanelCloseTimer.current);
    setNotificationsPanelDragOffset(0);
    setNotificationsPanelOpen(true);
    setNotificationsPanelMotion("opening");
    requestAnimationFrame(() => setNotificationsPanelMotion("open"));
  };
  const closeNotificationsPanel = () => {
    if (!notificationsPanelOpen || notificationsPanelMotion === "closing") return;
    setNotificationsPanelMotion("closing");
    notificationsPanelCloseTimer.current = setTimeout(() => {
      setNotificationsPanelOpen(false);
      notificationsPanelCloseTimer.current = null;
    }, 260);
  };
  const handleNotificationsPanelTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    notificationsPanelTouchStartX.current = event.touches[0]?.clientX ?? null;
    setIsNotificationsPanelDragging(true);
  };
  const handleNotificationsPanelTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (notificationsPanelTouchStartX.current === null) return;
    const distance = (event.touches[0]?.clientX ?? notificationsPanelTouchStartX.current) - notificationsPanelTouchStartX.current;
    if (distance > 0) setNotificationsPanelDragOffset(Math.min(distance, 260));
  };
  const handleNotificationsPanelTouchEnd = () => {
    const shouldClose = notificationsPanelDragOffset > 104;
    notificationsPanelTouchStartX.current = null;
    setIsNotificationsPanelDragging(false);
    setNotificationsPanelDragOffset(0);
    if (shouldClose) closeNotificationsPanel();
  };
  const panelNotifications = notificationsPanelQuery.data ?? [];
  const isPanelNotificationUnread = (notification: { readBy: string }) => !notification.readBy.split(",").filter(Boolean).includes(worker?.workerID ?? "");
  const handlePanelNotificationClick = (notification: { id: number; readBy: string; deepLink?: string | null }) => {
    const workerID = worker?.workerID;
    if (!workerID) return;
    if (isPanelNotificationUnread(notification)) {
      notificationsMarkRead.mutate({ workerID, ids: [notification.id] }, {
        onSuccess: () => {
          utils.notifications.list.invalidate();
          utils.notifications.unreadCount.invalidate();
        },
      });
    }
    if (notification.deepLink) {
      closeNotificationsPanel();
      navigate(notification.deepLink);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Desktop/Laptop/Tablet Dark Glassmorphism Sidebar ─────────── */}
      <aside
        className="hidden lg:flex flex-col w-[220px] xl:w-[256px] 2xl:w-[272px] shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          borderRight: "1px solid rgba(99,102,241,0.15)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.35)",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Glow orb top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        {/* Glow orb bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div
          className="relative flex items-center gap-3 px-4 xl:px-5 py-4"
          style={{ borderBottom: "1px solid rgba(99,102,241,0.2)" }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <img src={LOGO_URL} alt="GSPP" className="h-6 w-6 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-white leading-tight truncate">PP4 Manual Slitter</div>
            <div className="text-[10px] text-indigo-300/70 leading-tight font-medium">Stock Management</div>
          </div>
          {/* Online indicator */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Worker info card */}
        {worker && (
          <div className="relative mx-3 mt-4 mb-3">
            <button
              type="button"
              aria-label="Open My Profile"
              className="px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 group"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                backdropFilter: "blur(8px)",
              }}
              onClick={() => navigate("/user-profile")}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                  {profilePic ? (
                    <img src={profilePic} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{worker.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{displayName || worker.name}</div>
                  <div className="text-[10px] text-indigo-300/70 truncate">{worker.workerID}</div>
                </div>
                <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-md ${lv.badge}`}>Lv{userLevel}</span>
              </div>
            </button>
          </div>
        )}

        {/* Section label */}
        <div className="relative px-4 mb-1">
          <p className="text-[9px] font-bold text-indigo-400/50 uppercase tracking-widest">Navigation</p>
        </div>

        {/* Nav links */}
        <nav className="relative flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.filter(item => !item.adminOnly).map(item => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative"
                style={active ? {
                  background: "linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(59,130,246,0.9) 100%)",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
                  color: "white",
                } : {
                  color: "rgba(148,163,184,0.85)",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(99,102,241,0.12)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(148,163,184,0.85)";
                  }
                }}
              >
                {/* Active left accent */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/60 rounded-full" />
                )}
                <span className={`flex-shrink-0 transition-colors duration-200 ${active ? "text-white" : "text-slate-500 group-hover:text-indigo-300"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.href === "/approval-center" && pendingCount > 0 && (
                  <span className="min-w-[20px] h-[20px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
                {item.href === "/customer-sample" && sampleCount > 0 && (
                  <span className="min-w-[20px] h-[20px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                    {sampleCount > 99 ? "99+" : sampleCount}
                  </span>
                )}
                {item.href === "/chat" && unreadMsgCount > 0 && (
                  <span className="min-w-[20px] h-[20px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                    {unreadMsgCount > 99 ? "99+" : unreadMsgCount}
                  </span>
                )}
                {item.href === "/notifications" && unreadNotifCount > 0 && (
                  <span className="min-w-[20px] h-[20px] bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                    {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Resources section */}
        <div className="relative px-2.5 py-2" style={{ borderTop: "1px solid rgba(99,102,241,0.10)" }}>
          <p className="text-[9px] font-bold text-indigo-400/50 uppercase tracking-widest px-3 mb-1">Resources</p>
          {RESOURCE_NAV_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative"
                style={active ? {
                  background: "linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(59,130,246,0.9) 100%)",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
                  color: "white",
                } : {
                  color: "rgba(148,163,184,0.85)",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(99,102,241,0.12)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(148,163,184,0.85)";
                  }
                }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/60 rounded-full" />
                )}
                <span className={`flex-shrink-0 transition-colors duration-200 ${active ? "text-white" : "text-slate-500 group-hover:text-indigo-300"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="relative px-2.5 pb-4 pt-3 space-y-1"
          style={{ borderTop: "1px solid rgba(99,102,241,0.15)" }}
        >
          <p className="text-[9px] text-indigo-400/40 text-center px-2 py-1 font-medium">Created by HEiNANN</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ color: "rgba(148,163,184,0.7)" }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.12)";
              e.currentTarget.style.color = "rgba(252,165,165,1)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(148,163,184,0.7)";
            }}
          >
            <LogOut size={15} />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile/Tablet top header */}
        {!hideAppHeader && <header className={`${fullHeight ? "flex" : "lg:hidden"} border-b border-gray-200/60 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm`}>
          <div className="px-3 py-2 flex items-center gap-2">
            <button onClick={() => navigate("/")} className="p-1 -ml-1 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <img src={LOGO_URL} alt="GSPP" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs sm:text-sm text-gray-900 leading-tight truncate">PP4 Manual Slitter</div>
              <div className="text-[10px] sm:text-[11px] text-gray-500 leading-tight">Stock Management System</div>
            </div>
            {worker && (
              <div className="flex items-center gap-1.5 shrink-0">
                {headerActions && <div className="shrink-0">{headerActions}</div>}
                <button
                  onClick={() => navigate("/notifications")}
                  className="relative hidden p-2 rounded-xl transition-colors hover:bg-gray-100 sm:block"
                  aria-label="Notifications"
                >
                  <Bell size={18} className="text-gray-600" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm">
                      {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/user-profile")}
                  aria-label="Open My Profile"
                  className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 rounded-full pl-0.5 pr-2.5 py-0.5 text-[10px] font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                    {profilePic ? (
                      <img src={profilePic} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-200 flex items-center justify-center">
                        <User size={10} className="text-indigo-600" />
                      </div>
                    )}
                  </div>
                  <span>{displayName?.split(" ")[0] || worker?.name?.split(" ")[0] || "Profile"}</span>
                </button>
              </div>
            )}
          </div>
        </header>}

        {/* Desktop page title bar */}
        {pageTitle && !fullHeight && (
          <div className="hidden lg:flex items-center px-8 py-4 border-b border-border bg-white">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
              {pageTitle}
            </h1>
          </div>
        )}

        {/* Page content */}
        {/* Notification permission banner */}
        {showBanner && worker && (
          <NotificationPermissionBanner
            permissionState={permissionState}
            onEnable={async () => { await requestPermission(); if (Notification.permission === "granted") handleDismiss(); }}
            onDismiss={handleDismiss}
          />
        )}
        <main className={`flex-1 min-h-0 ${fullHeight ? "overflow-hidden pb-[64px] lg:pb-0" : "overflow-y-auto pb-[64px] lg:pb-0"}`}>
          {children}
        </main>
      </div>

      {/* ── Mobile Swipe-in Notifications Panel ───────────────────── */}
      {worker && notificationsPanelOpen && (
        <>
          <button
            aria-label="Close notifications panel"
            onClick={closeNotificationsPanel}
            className={`fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${notificationsPanelMotion === "open" ? "opacity-100" : "opacity-0"}`}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            onTouchStart={handleNotificationsPanelTouchStart}
            onTouchMove={handleNotificationsPanelTouchMove}
            onTouchEnd={handleNotificationsPanelTouchEnd}
            style={{ transform: `translateX(${notificationsPanelMotion === "open" ? notificationsPanelDragOffset : 110}%)` }}
            className={`fixed inset-y-0 right-0 z-[80] flex w-[min(100%,24rem)] flex-col overflow-hidden border-l border-white/10 bg-slate-950 shadow-[-18px_0_44px_rgba(2,6,23,0.45)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${isNotificationsPanelDragging ? "!transition-none" : ""} ${notificationsPanelMotion === "open" ? "opacity-100" : "opacity-0"}`}
          >
            <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-indigo-950 via-slate-950 to-cyan-950 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
              <div className="relative mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" aria-hidden="true" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/15 text-indigo-100 shadow-inner"><Bell size={19} />
                    {unreadNotifCount > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm">{unreadNotifCount > 99 ? "99+" : unreadNotifCount}</span>}
                  </div>
                  <div className="min-w-0"><p className="text-sm font-black text-white">Alerts</p><p className="truncate text-[10px] font-medium text-indigo-200/70">{unreadNotifCount > 0 ? `${unreadNotifCount} unread notification${unreadNotifCount === 1 ? "" : "s"}` : "You are all caught up"}</p></div>
                </div>
                <button onClick={closeNotificationsPanel} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-300 transition-colors hover:bg-white/15" aria-label="Close notifications"><X size={17} /></button>
              </div>
              {panelNotifications.some(isPanelNotificationUnread) && (
                <button onClick={() => notificationsMarkRead.mutate({ workerID: worker.workerID, ids: panelNotifications.filter(isPanelNotificationUnread).map(notification => notification.id) }, { onSuccess: () => { utils.notifications.list.invalidate(); utils.notifications.unreadCount.invalidate(); } })}
                  disabled={notificationsMarkRead.isPending} className="relative mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-300/20 bg-white/10 px-3 py-2 text-[11px] font-bold text-indigo-100 transition-colors hover:bg-white/15 disabled:opacity-50">
                  <CheckCircle2 size={13} /> {notificationsMarkRead.isPending ? "Marking read..." : "Mark all as read"}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
              {notificationsPanelQuery.isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map(item => <div key={item} className="h-20 animate-pulse rounded-2xl border border-white/5 bg-white/[0.06]" />)}</div>
              ) : panelNotifications.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-indigo-300"><Bell size={24} /></div><p className="text-sm font-bold text-slate-200">No notifications</p><p className="mt-1 text-xs leading-relaxed text-slate-500">New stock and request updates will appear here.</p></div>
              ) : (
                <div className="space-y-2">
                  {panelNotifications.slice(0, 20).map(notification => {
                    const unread = isPanelNotificationUnread(notification);
                    return <button key={notification.id} onClick={() => handlePanelNotificationClick(notification)} className={`w-full rounded-2xl border p-3 text-left transition-all ${unread ? "border-indigo-300/20 bg-indigo-400/[0.10] shadow-[0_6px_16px_rgba(15,23,42,0.18)]" : "border-white/[0.07] bg-white/[0.045] opacity-80"}`}>
                      <div className="flex items-start gap-2.5"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${unread ? "bg-indigo-400/20 text-indigo-200" : "bg-white/10 text-slate-400"}`}><Bell size={15} /></div><div className="min-w-0 flex-1"><div className="flex items-start gap-2"><p className="line-clamp-1 flex-1 text-xs font-black text-slate-100">{notification.title}</p>{unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />}</div><p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{notification.message}</p><p className="mt-1.5 text-[10px] font-medium text-slate-500">{new Date(notification.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div></div>
                    </button>;
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-white/10 bg-slate-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"><button onClick={() => { closeNotificationsPanel(); navigate("/notifications"); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/15 px-3 py-2.5 text-xs font-black text-indigo-200 transition-colors hover:bg-indigo-500/25">View all notifications <ChevronRight size={14} /></button></div>
          </section>
        </>
      )}

      {worker && !notificationsPanelOpen && (
        <button onClick={openNotificationsPanel} aria-label={`Open alerts${unreadNotifCount ? `, ${unreadNotifCount} unread` : ""}`}
          className="fixed right-0 top-[46%] z-40 flex h-12 w-10 items-center justify-center rounded-l-2xl border border-r-0 border-indigo-300/25 bg-slate-950/90 text-indigo-100 shadow-[-7px_8px_20px_rgba(15,23,42,0.25)] backdrop-blur-xl transition-transform duration-200 hover:w-11 active:scale-95 lg:hidden">
          <Bell size={19} />
          {unreadNotifCount > 0 && <span className="absolute -left-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm">{unreadNotifCount > 99 ? "99+" : unreadNotifCount}</span>}
        </button>
      )}

      {/* ── Mobile More Drawer ───────────────────────────────────── */}
      {worker && moreOpen && (
        <>
          <button
            aria-label="Close more navigation"
            onClick={closeMore}
            className={`fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-[1px] transition-opacity duration-300 ease-out lg:hidden ${moreMotion === "open" ? "opacity-100" : "opacity-0"}`}
          />
          <section
            onTouchStart={handleMoreTouchStart}
            onTouchMove={handleMoreTouchMove}
            onTouchEnd={handleMoreTouchEnd}
            style={{ transform: `translateY(${moreDragOffset}px) ${moreMotion === "open" ? "scale(1)" : "scale(0.97)"}` }}
            className={`fixed inset-x-3 bottom-[72px] z-40 overflow-hidden rounded-3xl border border-white/80 bg-white/96 p-3 shadow-[0_14px_44px_rgba(15,23,42,0.2)] backdrop-blur-xl transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${isDrawerDragging ? "!transition-none" : ""} ${moreMotion === "open" ? "opacity-100" : "opacity-0"}`}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" aria-hidden="true" />
            <div className="flex items-center justify-between px-1.5 pb-2.5">
              <div>
                <p className="text-sm font-black text-slate-800">More</p>
                <p className="text-[10px] font-medium text-slate-400">Quick access to your account and support</p>
              </div>
              <button onClick={closeMore} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-transform active:scale-90" aria-label="Close more navigation">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MOBILE_MORE_ITEMS.map((item, index) => {
                const active = location === item.href;
                const badge = item.href === "/notifications" ? unreadNotifCount : 0;
                const isSystemStatus = item.href === "/status";
                return (
                  <button key={item.href} onClick={() => { closeMore(); navigate(item.href); }}
                    style={{ transitionDelay: moreMotion === "open" ? `${70 + index * 35}ms` : "0ms" }}
                    className={`relative flex min-h-[74px] flex-col items-center justify-center gap-1 rounded-2xl border px-1.5 py-2 text-center transition-[opacity,transform,background-color,border-color] duration-300 active:scale-[0.98] ${moreMotion === "open" ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"} ${
                      active ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-100 bg-slate-50 text-slate-600"
                    }`}>
                    <span className={`relative flex h-8 w-8 items-center justify-center rounded-xl ${active ? "bg-indigo-100" : "bg-white shadow-sm"}`}>
                      {item.icon}
                      {badge > 0 && <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm">{badge > 99 ? "99+" : badge}</span>}
                      {isSystemStatus && <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`} aria-label={isOnline ? "System online" : "System offline"} />}
                    </span>
                    <span className="line-clamp-2 text-[10px] font-bold leading-tight">{item.label}</span>
                    {isSystemStatus && <span className={`text-[8px] font-bold ${isOnline ? "text-emerald-600" : "text-rose-600"}`}>{isOnline ? "Online" : "Offline"}</span>}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setLogoutConfirmOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-600 transition-all hover:bg-rose-100 active:scale-[0.99]"
            >
              <LogOut size={15} />
              Logout
            </button>
          </section>
        </>
      )}

      {worker && logoutConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Confirm logout">
          <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-5 shadow-2xl home-card-in">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-100 text-sm font-black text-indigo-600 shadow-sm">
                {profilePic ? <img src={profilePic} alt={`${displayName} profile`} className="h-full w-full object-cover" /> : (displayName || worker.name || "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Signed in as</p>
                <p className="truncate text-sm font-black text-slate-900">{displayName || worker.name}</p>
                <p className="truncate text-[11px] font-medium text-slate-500">{worker.workerID}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><LogOut size={18} /></div>
            </div>
            <h2 className="mt-4 text-base font-black text-slate-900">Log out of StockDash?</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Your active device session for {displayName || worker.name} will be safely closed. You can sign in again anytime.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setLogoutConfirmOpen(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600">Cancel</button>
              <button onClick={() => { setLogoutConfirmOpen(false); closeMore(); handleLogout(); }} className="rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-black text-white shadow-[0_6px_14px_rgba(225,29,72,0.25)]">Log out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar ──────────────────────────── */}
      {worker && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/98 shadow-[0_-5px_20px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex h-[72px] items-stretch pb-[env(safe-area-inset-bottom)] sm:h-16 sm:pb-0">
            {[
              { href: "/",                       icon: <Home size={22} />,          label: "Home",   order: "order-1" },
              { href: "/submit-order/ai-scanner", icon: <Camera size={22} />,        label: "Add",    order: "order-2" },
              { href: "/stock-history",          icon: <Package size={22} />,       label: "Stock",  order: "order-3 sm:order-5" },
              { href: "/chat",                   icon: <MessageCircle size={22} />, label: "Messages", order: "order-4", badge: unreadMsgCount },
              { href: "#more",                   icon: <MoreHorizontal size={23} />, label: "More",  order: "order-5 sm:order-3", isMore: true },
            ].map(item => {
              const active = item.isMore ? isMoreActive || moreOpen : location === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => item.isMore ? (moreOpen ? closeMore() : openMore()) : (closeMore(), navigate(item.href))}
                  className={`${item.order} relative flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 ${
                    active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className={`relative flex h-8 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                    active ? "bg-indigo-50 text-indigo-600" : "text-slate-400"
                  }`}>
                    {item.icon}
                    {item.badge && item.badge > 0 ? (
                      <span className={`absolute -top-1.5 -right-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white shadow-[0_2px_5px_rgba(15,23,42,0.2)] ${
                         item.href === "/notifications" ? "bg-blue-500" : "bg-red-500"
                       }`}>
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={`text-[11px] font-semibold leading-none tracking-[-0.01em] ${active ? "text-indigo-600" : "text-slate-400"}`}>
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute left-1/2 top-0 h-1 w-10 -translate-x-1/2 rounded-b-full bg-indigo-500 shadow-[0_2px_6px_rgba(99,102,241,0.45)]" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

    </div>
  );
}
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
