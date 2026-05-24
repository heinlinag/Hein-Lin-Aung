/**
 * AppLayout — Responsive layout wrapper
 * Mobile  : sticky top header + full-width content
 * Desktop : fixed left sidebar (240px) + scrollable main content
 */
import { useLocation } from "wouter";
import { useRef, useEffect, useState } from "react";
import {
  ClipboardList, Package, History, CheckCircle2, Settings, LogOut,
  User, BookOpen, Activity, ChevronRight, X, Building2, IdCard, Shield, Lock, Eye, EyeOff, HelpCircle, ScanLine, Home,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

const ADMIN_PASSWORD = "Qwer@7090heinann";

const LOGO_URL = "/manus-storage/gspp-logo_988a5ce5.png";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",               label: "Home",             icon: <Home size={18} /> },
  { href: "/submit-order",    label: "Submit Order",    icon: <ClipboardList size={18} /> },
  { href: "/stock-history",   label: "Stock History",   icon: <Package size={18} /> },
  { href: "/usage-history",   label: "Usage History",   icon: <History size={18} /> },
  { href: "/approval-center", label: "Approval Center", icon: <CheckCircle2 size={18} /> },
  { href: "/qr-scanner",      label: "QR Scanner",      icon: <ScanLine size={18} /> },
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
  const { worker, logoutWorker, loginAdmin } = useAuth();
  const userLevel = worker?.userLevel ?? "2";
  const lv = levelLabel(userLevel);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Admin password dialog
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminPwError, setAdminPwError] = useState("");
  const [showAdminPw, setShowAdminPw] = useState(false);

  const handleAdminPanelClick = () => {
    setProfileOpen(false);
    setAdminPwInput("");
    setAdminPwError("");
    setShowAdminPw(false);
    setShowAdminDialog(true);
  };

  const handleAdminPwSubmit = () => {
    if (adminPwInput === ADMIN_PASSWORD) {
      loginAdmin(); // set isAdminAuthenticated = true before navigating
      setShowAdminDialog(false);
      navigate("/admin");
    } else {
      setAdminPwError("Incorrect password. Please try again.");
    }
  };

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
    <div className="absolute top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-border z-50 overflow-hidden lg:left-1/2 lg:-translate-x-1/2 right-0 lg:right-auto">
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

        {userLevel === "2" && (
          <button
            onClick={handleAdminPanelClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Settings size={15} className="text-gray-600" />
            </div>
            <span className="flex-1 text-left">Admin Panel</span>
            <Lock size={12} className="text-gray-400 mr-0.5" />
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
          onClick={() => goTo("/faq")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <HelpCircle size={15} className="text-amber-600" />
          </div>
          <span className="flex-1 text-left">FAQ</span>
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
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200/60 bg-gradient-to-b from-slate-50/95 via-white to-slate-50/90 sticky top-0 h-screen overflow-y-auto shadow-2xl" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.02) 0%, transparent 50%)' }}>
        {/* Brand - Enterprise */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200/40 bg-gradient-to-r from-white/90 via-slate-50/50 to-white/80 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg blur-md opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <img src={LOGO_URL} alt="GSPP" className="h-8 w-8 object-contain flex-shrink-0 relative" />
          </div>
          <div className="min-w-0 relative">
            <div className="font-bold text-xs text-slate-900 leading-tight tracking-widest">PP4 SLITTER</div>
            <div className="text-[8.5px] text-slate-500 leading-tight font-semibold">Stock System</div>
          </div>
        </div>

        {/* Worker info — clickable to open profile */}
        {worker && (
          <div
            className="mx-3 mt-5 mb-4 px-4 py-4 rounded-xl bg-gradient-to-br from-blue-500/12 via-blue-400/6 to-cyan-400/8 cursor-pointer hover:from-blue-500/18 hover:via-blue-400/12 hover:to-cyan-400/14 transition-all duration-400 relative border border-blue-200/50 hover:border-blue-300/70 group shadow-md hover:shadow-lg overflow-hidden"
            onClick={() => setProfileOpen(v => !v)}
            ref={profileRef}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/0 via-transparent to-cyan-400/0 group-hover:from-blue-400/8 group-hover:via-blue-300/4 group-hover:to-cyan-400/8 transition-all duration-400"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }}></div>
            <div className="relative flex items-center gap-3.5">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-400 group-hover:scale-125 group-hover:-rotate-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                <User size={15} className="text-white relative z-10" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate leading-tight">{worker.name}</div>
                <div className="text-[8px] text-slate-500 truncate leading-tight font-semibold">{worker.workerID}</div>
              </div>
              <span className={`ml-auto shrink-0 text-[7.5px] font-bold px-2.5 py-0.5 rounded-lg ${lv.badge} shadow-md`}>Lv{userLevel}</span>
            </div>
            {profileOpen && <ProfileDropdown />}
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.filter(item => !item.adminOnly).map(item => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold transition-all duration-400 relative group overflow-hidden ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg shadow-blue-400/40 scale-105"
                  : "text-slate-600 hover:bg-gradient-to-r hover:from-slate-100/80 hover:via-slate-50 hover:to-slate-100/80 hover:text-slate-900 hover:scale-105 hover:shadow-md"
              }`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: isActive(item.href) ? 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 50%)' : 'linear-gradient(90deg, rgba(59,130,246,0.05) 0%, transparent 50%)' }}></div>
              <span className={`flex-shrink-0 transition-all duration-400 relative z-10 ${
                isActive(item.href) ? "scale-110 drop-shadow-lg" : "group-hover:scale-125"
              }`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left tracking-wider relative z-10">{item.label}</span>
              {item.href === "/approval-center" && pendingCount > 0 && (
                <span className="min-w-[24px] h-[24px] bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white text-[7px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-400/60 animate-pulse relative z-10">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer - Logout */}
        <div className="px-2.5 pb-4 pt-3.5 border-t border-slate-200/40 mt-auto bg-gradient-to-t from-slate-50/90 via-white/50 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)' }}></div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold text-slate-600 hover:bg-gradient-to-r hover:from-red-50/80 hover:via-red-50/50 hover:to-red-50/80 hover:text-red-600 transition-all duration-400 group shadow-sm hover:shadow-md relative z-10 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: 'linear-gradient(90deg, rgba(239,68,68,0.05) 0%, transparent 50%)' }}></div>
            <span className="flex-shrink-0 group-hover:scale-125 transition-transform duration-400 relative z-10">
              <LogOut size={17} />
            </span>
            <span className="flex-1 text-left tracking-wider relative z-10">Logout</span>
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

      {/* Admin Password Dialog */}
      {showAdminDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Lock size={18} className="text-gray-700" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Admin Panel Access</h3>
                  <p className="text-xs text-muted-foreground">Enter administrator password to continue</p>
                </div>
              </div>
              <div className="relative mb-3">
                <input
                  type={showAdminPw ? "text" : "password"}
                  value={adminPwInput}
                  onChange={e => { setAdminPwInput(e.target.value); setAdminPwError(""); }}
                  onKeyDown={e => { if (e.key === "Enter") handleAdminPwSubmit(); }}
                  placeholder="Administrator password"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showAdminPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {adminPwError && (
                <p className="text-xs text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2">{adminPwError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdminDialog(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminPwSubmit}
                  className="flex-1 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-700"
                >
                  Enter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
