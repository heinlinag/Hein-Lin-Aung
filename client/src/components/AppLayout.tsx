/**
 * AppLayout — Responsive layout wrapper
 * Mobile  : sticky top header + full-width content + bottom nav
 * Desktop : fixed left dark-glassmorphism sidebar + scrollable main content
 */
import { useLocation } from "wouter";
import { useRef, useEffect, useState } from "react";
import {
  ClipboardList, Package, CheckCircle2, LogOut,
  User, BookOpen, Activity, ChevronRight, X, Building2, IdCard, Shield, HelpCircle, ScanLine, Home, MessageCircle, Bell, FlaskConical,
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
  { href: "/",               label: "Home",             icon: <Home size={16} /> },
  { href: "/submit-order",   label: "Submit Order",     icon: <ClipboardList size={16} /> },
  { href: "/stock-history",  label: "Stock History",    icon: <Package size={16} /> },
  { href: "/approval-center",label: "NPRM Modify Order",icon: <CheckCircle2 size={16} /> },
  { href: "/customer-sample",label: "Customer Sample",  icon: <FlaskConical size={16} /> },
  { href: "/qr-scanner",     label: "QR Scanner",       icon: <ScanLine size={16} /> },
  { href: "/chat",           label: "Messages",         icon: <MessageCircle size={16} /> },
  { href: "/notifications",  label: "Notifications",    icon: <Bell size={16} /> },
  { href: "/admin",          label: "Admin Panel",      icon: <ChevronRight size={16} />, adminOnly: true },
];

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  headerActions?: React.ReactNode;
  fullHeight?: boolean;
}

function levelLabel(level: string) {
  if (level === "1")   return { text: "Level 1",   bg: "bg-orange-100", fg: "text-orange-700", badge: "bg-orange-500/20 text-orange-300 border border-orange-400/30", badgeLight: "bg-orange-200 text-orange-700" };
  if (level === "1.1") return { text: "Level 1.1", bg: "bg-purple-100", fg: "text-purple-700", badge: "bg-purple-500/20 text-purple-300 border border-purple-400/30", badgeLight: "bg-purple-200 text-purple-700" };
  return                      { text: "Level 2",   bg: "bg-green-100",  fg: "text-green-700",  badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30", badgeLight: "bg-green-200 text-green-700" };
}

export default function AppLayout({ children, pageTitle, headerActions, fullHeight }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { worker, logoutWorker } = useAuth();
  const deactivateDevice = trpc.workers.deactivateDevice.useMutation();
  const userLevel = worker?.userLevel ?? "2";
  const lv = levelLabel(userLevel);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch profile picture & display name
  const profileQuery = trpc.profile.get.useQuery(
    { workerID: worker?.workerID ?? "" },
    { enabled: !!worker?.workerID, staleTime: 60_000 }
  );
  const profilePic = profileQuery.data?.profilePicture ?? null;
  const displayName = profileQuery.data?.displayName ?? worker?.name ?? "";

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

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setProfileOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [profileOpen]);

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

  const handleLogout = () => {
    if (worker?.workerID) {
      deactivateDevice.mutate({ workerID: worker.workerID });
    }
    logoutWorker();
    navigate("/login");
  };

  const isActive = (href: string) => location === href;
  const goTo = (href: string) => { setProfileOpen(false); navigate(href); };

  /* ── Profile Dropdown (light style for readability) ─────────────── */
  const ProfileDropdown = () => (
    <div
      className="absolute top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden lg:left-0 right-0 lg:right-auto"
      style={{ pointerEvents: "auto" }}
    >
      {/* Header */}
      <div className={`px-5 py-4 ${lv.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-white/70 shadow-sm shrink-0">
            {profilePic ? (
              <img src={profilePic} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center`}>
                <User size={20} className={lv.fg} />
              </div>
            )}
          </div>
          <div>
            <p className={`font-bold text-sm ${lv.fg}`}>{displayName || worker?.name}</p>
            <p className="text-xs text-gray-500">{worker?.workerID}</p>
          </div>
        </div>
        <button onClick={() => setProfileOpen(false)} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
          <X size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Info rows */}
      <div className="px-5 py-3 space-y-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <IdCard size={13} className="shrink-0 text-slate-400" />
          <span className="font-medium text-slate-700">Employee ID</span>
          <span className="ml-auto font-mono font-semibold text-slate-900">{worker?.workerID}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <Building2 size={13} className="shrink-0 text-slate-400" />
          <span className="font-medium text-slate-700">Department</span>
          <span className="ml-auto text-slate-900">{worker?.department || "—"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <Shield size={13} className="shrink-0 text-slate-400" />
          <span className="font-medium text-slate-700">Access Level</span>
          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${lv.badgeLight}`}>{lv.text}</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1">Quick Access</p>
        {[
          { href: "/user-profile", icon: <User size={15} className="text-indigo-600" />, bg: "bg-indigo-50", label: "My Profile" },
          { href: "/docs",   icon: <BookOpen size={15} className="text-blue-600" />, bg: "bg-blue-50",   label: "Documentation" },
          { href: "/help",   icon: <HelpCircle size={15} className="text-blue-600" />, bg: "bg-blue-50", label: "Help Center" },
          { href: "/faq",    icon: <HelpCircle size={15} className="text-amber-600" />, bg: "bg-amber-50",label: "FAQ" },
          { href: "/status", icon: <Activity size={15} className="text-green-600" />, bg: "bg-green-50",  label: "System Status", extra: <span className="w-2 h-2 rounded-full bg-green-500 mr-1" /> },
        ].map(({ href, icon, bg, label, extra }) => (
          <button
            key={href}
            onClick={() => goTo(href)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
            <span className="flex-1 text-left">{label}</span>
            {extra}
            <ChevronRight size={13} className="text-slate-400" />
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
            <div
              className="px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 group"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                backdropFilter: "blur(8px)",
              }}
              onClick={() => setProfileOpen(v => !v)}
              ref={profileRef}
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
            </div>
            {profileOpen && <ProfileDropdown />}
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

        {/* Footer */}
        <div
          className="relative px-2.5 pb-4 pt-3 mt-auto space-y-1"
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
        <header className={`${fullHeight ? "flex" : "lg:hidden"} border-b border-gray-200/60 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm`}>
          <div className="px-3 py-2 flex items-center gap-2">
            <button onClick={() => navigate("/")} className="p-1 -ml-1 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
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
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(v => !v)}
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
                  {profileOpen && <ProfileDropdown />}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Desktop page title bar */}
        {pageTitle && !fullHeight && (
          <div className="hidden lg:flex items-center px-8 py-4 border-b border-border bg-white">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
              {pageTitle}
            </h1>
          </div>
        )}

        {/* Page content */}
        <main className={`flex-1 min-h-0 ${fullHeight ? "overflow-hidden pb-[64px] lg:pb-0" : "overflow-y-auto pb-[64px] lg:pb-0"}`}>
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ──────────────────────────── */}
      {worker && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200/60 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-stretch h-16">
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
                    active ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <span className="relative">
                    {item.icon}
                    {item.badge && item.badge > 0 ? (
                      <span className={`absolute -top-1 -right-1.5 min-w-[15px] h-[15px] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm ${
                        item.href === "/notifications" ? "bg-blue-500" : "bg-red-500"
                      }`}>
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={`text-[10px] font-medium leading-none ${active ? "text-indigo-600" : "text-gray-400"}`}>
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
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
