/**
 * AppLayout — Responsive layout wrapper
 * Mobile  (<768px)  : sticky top header + bottom nav bar
 * Tablet  (768-1024): sticky top header + bottom nav bar (md breakpoint)
 * Laptop  (1024px+) : fixed left sidebar (220px) + scrollable main
 * Desktop (1280px+) : fixed left sidebar (260px) + wider main content
 * 2XL     (1536px+) : fixed left sidebar (280px) + max-width content
 */
import { useLocation } from "wouter";
import { useRef, useEffect, useState } from "react";
import {
  ClipboardList, Package, CheckCircle2, LogOut,
  User, BookOpen, Activity, ChevronRight, X, Building2, IdCard, Shield,
  HelpCircle, ScanLine, Home, MessageCircle, Bell, FlaskConical, Menu,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/manus-storage/gspp_logo_new_2db75f16.png";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",               label: "Home",              icon: <Home size={18} /> },
  { href: "/submit-order",   label: "Submit Order",      icon: <ClipboardList size={18} /> },
  { href: "/stock-history",  label: "Stock History",     icon: <Package size={18} /> },
  { href: "/approval-center",label: "NPRM Modify Order", icon: <CheckCircle2 size={18} /> },
  { href: "/customer-sample",label: "Customer Sample",   icon: <FlaskConical size={18} /> },
  { href: "/qr-scanner",     label: "QR Scanner",        icon: <ScanLine size={18} /> },
  { href: "/chat",           label: "Messages",          icon: <MessageCircle size={18} /> },
  { href: "/notifications",  label: "Notifications",     icon: <Bell size={18} /> },
  { href: "/admin",          label: "Admin Panel",       icon: <ChevronRight size={18} />, adminOnly: true },
];

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  headerActions?: React.ReactNode;
  /** When true: hides desktop page title bar and sets main to overflow-hidden (for full-height pages like Chat) */
  fullHeight?: boolean;
}

function levelLabel(level: string) {
  if (level === "1")   return { text: "Level 1",   bg: "bg-orange-100", fg: "text-orange-700", badge: "bg-orange-200 text-orange-700" };
  if (level === "1.1") return { text: "Level 1.1", bg: "bg-purple-100", fg: "text-purple-700", badge: "bg-purple-200 text-purple-700" };
  return                      { text: "Level 2",   bg: "bg-green-100",  fg: "text-green-700",  badge: "bg-green-200 text-green-700" };
}

export default function AppLayout({ children, pageTitle, headerActions, fullHeight }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { worker, logoutWorker } = useAuth();
  const deactivateDevice = trpc.workers.deactivateDevice.useMutation();
  const userLevel = worker?.userLevel ?? "2";
  const lv = levelLabel(userLevel);

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!profileOpen && !mobileMenuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setProfileOpen(false); setMobileMenuOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [profileOpen, mobileMenuOpen]);

  // ── Global single-device heartbeat ─────────────────────────────────────
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
  // ─────────────────────────────────────────────────────────────────────────

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

  const handleLogout = () => {
    if (worker?.workerID) {
      deactivateDevice.mutate({ workerID: worker.workerID });
    }
    logoutWorker();
    navigate("/login");
  };

  const isActive = (href: string) => location === href;
  const goTo = (href: string) => { setProfileOpen(false); setMobileMenuOpen(false); navigate(href); };

  /* ── Badge helper ──────────────────────────────────────────────────── */
  function getBadge(href: string) {
    if (href === "/approval-center" && pendingCount > 0) return { count: pendingCount, color: "bg-red-500" };
    if (href === "/customer-sample" && sampleCount > 0) return { count: sampleCount, color: "bg-red-500" };
    if (href === "/chat" && unreadMsgCount > 0) return { count: unreadMsgCount, color: "bg-red-500" };
    if (href === "/notifications" && unreadNotifCount > 0) return { count: unreadNotifCount, color: "bg-blue-500" };
    return null;
  }

  /* ── Profile Dropdown ─────────────────────────────────────────────── */
  const ProfileDropdown = () => (
    <div className="absolute top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-border z-[60] overflow-hidden left-0 lg:left-1/2 lg:-translate-x-1/2" style={{ pointerEvents: 'auto' }}>
      {/* Header */}
      <div className={`px-5 py-4 ${lv.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
            <User size={20} className={lv.fg} />
          </div>
          <div>
            <p className={`font-bold text-sm ${lv.fg}`}>{worker?.name}</p>
            <p className="text-xs text-gray-500">{worker?.workerID}</p>
          </div>
        </div>
        <button onClick={() => setProfileOpen(false)} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
          <X size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Info rows */}
      <div className="px-5 py-3 space-y-2 border-b border-border">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <IdCard size={13} className="shrink-0 text-gray-400" />
          <span className="font-medium text-foreground">Employee ID</span>
          <span className="ml-auto font-mono font-semibold text-foreground">{worker?.workerID}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <Building2 size={13} className="shrink-0 text-gray-400" />
          <span className="font-medium text-foreground">Department</span>
          <span className="ml-auto text-foreground">{worker?.department || "—"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <Shield size={13} className="shrink-0 text-gray-400" />
          <span className="font-medium text-foreground">Access Level</span>
          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${lv.badge}`}>{lv.text}</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-3 py-2 border-b border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-1">Quick Access</p>
        {[
          { href: "/docs", icon: <BookOpen size={15} className="text-blue-600" />, bg: "bg-blue-50", label: "Documentation" },
          { href: "/help", icon: <HelpCircle size={15} className="text-blue-600" />, bg: "bg-blue-50", label: "Help Center" },
          { href: "/faq",  icon: <HelpCircle size={15} className="text-amber-600" />, bg: "bg-amber-50", label: "FAQ" },
          { href: "/status", icon: <Activity size={15} className="text-green-600" />, bg: "bg-green-50", label: "System Status", extra: <span className="w-2 h-2 rounded-full bg-green-500 mr-1" /> },
        ].map(item => (
          <button
            key={item.href}
            onClick={() => goTo(item.href)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-gray-100 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
              {item.icon}
            </div>
            <span className="flex-1 text-left">{item.label}</span>
            {item.extra}
            <ChevronRight size={13} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="px-3 py-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <LogOut size={15} className="text-red-500" />
          </div>
          <span className="flex-1 text-left">Logout</span>
        </button>
      </div>
    </div>
  );

  /* ── Mobile Drawer Menu (tablet/mobile) ──────────────────────────── */
  const MobileDrawer = () => (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        onClick={() => setMobileMenuOpen(false)}
      />
      {/* Drawer */}
      <div className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-2xl flex flex-col overflow-y-auto">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <img src={LOGO_URL} alt="GSPP" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <div className="font-bold text-xs text-gray-900 leading-tight">PP4 Manual Slitter</div>
              <div className="text-[10px] text-gray-500 leading-tight">Stock Management</div>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Worker info */}
        {worker && (
          <div className="mx-3 mt-3 mb-2 px-3 py-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/50">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <User size={15} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900 truncate">{worker.name}</div>
                <div className="text-xs text-gray-500 truncate">{worker.workerID} · {worker.department || "—"}</div>
              </div>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ${lv.badge}`}>Lv{userLevel}</span>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-2.5 py-2 space-y-0.5">
          {NAV_ITEMS.filter(item => !item.adminOnly).map(item => {
            const badge = getBadge(item.href);
            return (
              <button
                key={item.href}
                onClick={() => goTo(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={`flex-shrink-0 ${isActive(item.href) ? "" : "text-gray-400"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {badge && (
                  <span className={`min-w-[20px] h-[20px] ${badge.color} text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm`}>
                    {badge.count > 99 ? "99+" : badge.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2.5 pb-4 pt-2 border-t border-gray-100 space-y-1">
          <p className="text-xs text-gray-400 text-center py-1">Created by HEiNANN</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut size={16} />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* ── Desktop/Laptop Sidebar (lg+) ──────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[220px] xl:w-[260px] 2xl:w-[280px] shrink-0 border-r border-gray-200/60 bg-white sticky top-0 h-screen overflow-y-auto shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 xl:px-5 py-4 xl:py-5 border-b border-gray-100">
          <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
            <img src={LOGO_URL} alt="GSPP" className="h-6 w-6 xl:h-7 xl:w-7 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs xl:text-sm text-gray-900 leading-tight truncate">PP4 Manual Slitter</div>
            <div className="text-[10px] xl:text-xs text-gray-500 leading-tight font-medium">Stock Management</div>
          </div>
        </div>

        {/* Worker info */}
        {worker && (
          <div
            className="mx-3 mt-4 mb-3 px-3 py-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 cursor-pointer hover:from-blue-100/80 hover:to-indigo-100/50 transition-all duration-300 border border-blue-100/50 hover:border-blue-200 group relative"
            onClick={() => setProfileOpen(v => !v)}
            ref={profileRef}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 xl:h-9 xl:w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                <User size={14} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs xl:text-sm font-bold text-gray-900 truncate">{worker.name}</div>
                <div className="text-[10px] xl:text-xs text-gray-500 truncate">{worker.workerID}</div>
              </div>
              <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-md ${lv.badge}`}>Lv{userLevel}</span>
            </div>
            {profileOpen && <ProfileDropdown />}
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.filter(item => !item.adminOnly).map(item => {
            const badge = getBadge(item.href);
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 xl:py-3 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={`flex-shrink-0 ${isActive(item.href) ? "" : "text-gray-400"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {badge && (
                  <span className={`min-w-[20px] h-[20px] ${badge.color} text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse`}>
                    {badge.count > 99 ? "99+" : badge.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2.5 pb-3 pt-2 border-t border-gray-100 mt-auto space-y-1">
          <p className="text-[10px] xl:text-xs text-gray-400 text-center px-2 py-1">Created by HEiNANN</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs xl:text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut size={16} />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && <MobileDrawer />}

      {/* ── Main content area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile/Tablet top header */}
        <header className={`${fullHeight ? "flex" : "lg:hidden"} border-b border-gray-200/60 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm`}>
          <div className="px-3 md:px-4 py-2 md:py-3 flex items-center gap-2 w-full">
            {/* Hamburger menu button for tablet/mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} className="text-gray-600" />
            </button>

            {/* Logo + title */}
            <button onClick={() => navigate("/")} className="flex items-center gap-2 rounded-xl hover:bg-gray-50 transition-colors px-1 py-0.5 flex-shrink-0">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <img src={LOGO_URL} alt="GSPP" className="h-5 w-5 md:h-6 md:w-6 object-contain" />
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-xs md:text-sm text-gray-900 leading-tight">PP4 Manual Slitter</div>
                <div className="text-[10px] md:text-[11px] text-gray-500 leading-tight">Stock Management</div>
              </div>
            </button>

            {/* Page title on mobile */}
            {pageTitle && (
              <div className="flex-1 min-w-0 sm:hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{pageTitle}</p>
              </div>
            )}
            <div className="flex-1 sm:flex-none" />

            {worker && (
              <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
                {headerActions && (
                  <div className="shrink-0">{headerActions}</div>
                )}
                {/* Notification Bell */}
                <button
                  onClick={() => navigate("/notifications")}
                  className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={18} className="text-gray-600" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm">
                      {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                    </span>
                  )}
                </button>
                {/* Profile button */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(v => !v)}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-full px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-100"
                  >
                    <User size={11} className="shrink-0" />
                    <span className="hidden sm:inline">{worker.name?.split(" ")[0] ?? "Profile"}</span>
                    <span className="sm:hidden">Me</span>
                  </button>
                  {profileOpen && <ProfileDropdown />}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Desktop page title bar */}
        {pageTitle && !fullHeight && (
          <div className="hidden lg:flex items-center justify-between px-6 xl:px-8 py-4 xl:py-5 border-b border-border bg-white">
            <h1 className="text-lg xl:text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
              {pageTitle}
            </h1>
            {headerActions && (
              <div className="shrink-0">{headerActions}</div>
            )}
          </div>
        )}

        {/* Page content */}
        <main className={`flex-1 min-h-0 ${fullHeight ? "overflow-hidden pb-[64px] lg:pb-0" : "overflow-y-auto pb-[72px] lg:pb-0"}`}>
          {children}
        </main>
      </div>

      {/* ── Mobile/Tablet Bottom Navigation Bar ────────────────────── */}
      {worker && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-md border-t border-gray-200/60 shadow-[0_-2px_16px_rgba(0,0,0,0.08)]">
          <div className="flex items-stretch h-[64px] md:h-[68px] max-w-2xl mx-auto">
            {[
              { href: "/",              icon: <Home size={20} />,          label: "Home" },
              { href: "/submit-order",  icon: <ClipboardList size={20} />, label: "Orders" },
              { href: "/chat",          icon: <MessageCircle size={20} />, label: "Chat",   badge: unreadMsgCount },
              { href: "/notifications", icon: <Bell size={20} />,          label: "Alerts", badge: unreadNotifCount },
              { href: "/stock-history", icon: <Package size={20} />,       label: "Stock" },
            ].map(item => {
              const active = location === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200 ${
                    active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-blue-500 rounded-full" />
                  )}
                  <span className={`relative transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                    {item.icon}
                    {item.badge && item.badge > 0 ? (
                      <span className={`absolute -top-1 -right-1.5 min-w-[15px] h-[15px] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm ${
                        item.href === "/notifications" ? "bg-blue-500" : "bg-red-500"
                      }`}>
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={`text-[10px] md:text-[11px] font-medium leading-none ${
                    active ? "text-blue-600 font-semibold" : "text-gray-400"
                  }`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
