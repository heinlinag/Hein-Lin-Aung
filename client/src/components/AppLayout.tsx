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
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-gradient-to-b from-white to-gray-50/50 sticky top-0 h-screen overflow-y-auto shadow-sm">
        {/* Brand - Compact */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
          <img src={LOGO_URL} alt="GSPP" className="h-8 w-8 object-contain flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-xs text-foreground leading-tight tracking-tight">PP4 SLITTER</div>
            <div className="text-[10px] text-muted-foreground leading-tight">Stock System</div>
          </div>
        </div>

        {/* Worker info — clickable to open profile */}
        {worker && (
          <div
            className="mx-3 mt-3 mb-2 px-3 py-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 cursor-pointer hover:from-blue-100 hover:to-blue-50 transition-all duration-200 relative border border-blue-100/50 hover:border-blue-200/50"
            onClick={() => setProfileOpen(v => !v)}
            ref={profileRef}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <User size={13} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-foreground truncate leading-tight">{worker.name}</div>
                <div className="text-[9px] text-muted-foreground truncate leading-tight">{worker.workerID}</div>
              </div>
              <span className={`ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${lv.badge}`}>Lv{userLevel}</span>
            </div>
            {profileOpen && <ProfileDropdown />}
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.filter(item => !item.adminOnly).map(item => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative group ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                  : "text-muted-foreground hover:bg-gray-100/80 hover:text-foreground hover:scale-105"
              }`}
            >
              <span className={`flex-shrink-0 transition-transform duration-200 ${
                isActive(item.href) ? "scale-110" : "group-hover:scale-110"
              }`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left tracking-tight">{item.label}</span>
              {item.href === "/approval-center" && pendingCount > 0 && (
                <span className="min-w-[20px] h-[20px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-200 animate-pulse">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer - Logout */}
        <div className="px-2.5 pb-3 pt-2 border-t border-border/50 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          >
            <span className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              <LogOut size={16} />
            </span>
            <span className="flex-1 text-left tracking-tight">Logout</span>
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
