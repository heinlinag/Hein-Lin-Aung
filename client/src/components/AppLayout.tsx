/**
 * AppLayout — Responsive layout wrapper
 * Mobile  : sticky top header + full-width content
 * Desktop : fixed left sidebar (240px) + scrollable main content
 */
import { useLocation } from "wouter";
import { useRef, useEffect, useState } from "react";
import {
  ClipboardList, Package, History, CheckCircle2, Settings, LogOut,
  User, BookOpen, Activity, ChevronRight, X, Building2, IdCard, Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/manus-storage/gspp-logo_988a5ce5.png";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/submit-order",    label: "Submit Order",    icon: <ClipboardList size={18} /> },
  { href: "/stock-history",   label: "Stock History",   icon: <Package size={18} /> },
  { href: "/usage-history",   label: "Usage History",   icon: <History size={18} /> },
  { href: "/approval-center", label: "Approval Center", icon: <CheckCircle2 size={18} /> },
  { href: "/admin",           label: "Admin Panel",     icon: <Settings size={18} />, adminOnly: true },
];

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

function levelLabel(level: string) {
  if (level === "1")   return { text: "Level 1",   bg: "bg-orange-100", fg: "text-orange-700", badge: "bg-orange-200 text-orange-700" };
  if (level === "1.1") return { text: "Level 1.1", bg: "bg-purple-100", fg: "text-purple-700", badge: "bg-purple-200 text-purple-700" };
  return                      { text: "Level 2",   bg: "bg-green-100",  fg: "text-green-700",  badge: "bg-green-200 text-green-700" };
}

export default function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { worker, logoutWorker } = useAuth();
  const userLevel = worker?.userLevel ?? "2";
  const lv = levelLabel(userLevel);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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
    if (!profileOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setProfileOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [profileOpen]);

  const pendingQuery = trpc.pendingRequests.list.useQuery(
    { status: "pending" },
    { refetchInterval: 30000 }
  );
  const pendingCount = (pendingQuery.data ?? []).length;

  const handleLogout = () => {
    logoutWorker();
    navigate("/login");
  };

  const isActive = (href: string) => location === href;

  const goTo = (href: string) => { setProfileOpen(false); navigate(href); };

  /* ── Profile Dropdown ─────────────────────────────────────────────── */
  const ProfileDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-border z-50 overflow-hidden">
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

        {(userLevel === "2" || userLevel === "1.1") && (
          <button
            onClick={() => goTo("/admin")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Settings size={15} className="text-gray-600" />
            </div>
            <span className="flex-1 text-left">Admin Panel</span>
            <ChevronRight size={13} className="text-muted-foreground" />
          </button>
        )}

        <button
          onClick={() => goTo("/docs")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <BookOpen size={15} className="text-blue-600" />
          </div>
          <span className="flex-1 text-left">Documentation</span>
          <ChevronRight size={13} className="text-muted-foreground" />
        </button>

        <button
          onClick={() => goTo("/status")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Activity size={15} className="text-green-600" />
          </div>
          <span className="flex-1 text-left">System Status</span>
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          <ChevronRight size={13} className="text-muted-foreground" />
        </button>
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
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-white sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <img src={LOGO_URL} alt="GSPP" className="h-9 w-9 object-contain" />
          <div>
            <div className="font-bold text-sm text-foreground leading-tight">PP4 Manual Slitter</div>
            <div className="text-[11px] text-muted-foreground leading-tight">Stock Management</div>
          </div>
        </div>

        {/* Worker info — clickable to open profile */}
        {worker && (
          <div
            className="px-4 py-3 border-b border-border bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors relative"
            onClick={() => setProfileOpen(v => !v)}
            ref={profileRef}
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User size={15} className="text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{worker.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{worker.workerID} · {worker.department}</div>
              </div>
              <span className={`ml-auto shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${lv.badge}`}>Lv.{userLevel}</span>
            </div>
            {profileOpen && <ProfileDropdown />}
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive(item.href)
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.href === "/approval-center" && pendingCount > 0 && (
                <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top header */}
        <header className="lg:hidden border-b border-border bg-white sticky top-0 z-20 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors">
              <img src={LOGO_URL} alt="GSPP" className="h-8 w-8 object-contain" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground leading-tight truncate">PP4 Manual Slitter</div>
              <div className="text-[11px] text-muted-foreground leading-tight">Stock Management System</div>
            </div>
            {worker && (
              <div className="flex items-center gap-2 shrink-0">
                {/* Clickable profile badge */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(v => !v)}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <User size={11} className="shrink-0" />
                    <span>User Profile</span>
                  </button>
                  {profileOpen && <ProfileDropdown />}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Desktop page title bar */}
        {pageTitle && (
          <div className="hidden lg:flex items-center px-8 py-4 border-b border-border bg-white">
            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
              {pageTitle}
            </h1>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
