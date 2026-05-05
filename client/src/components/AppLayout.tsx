/**
 * AppLayout — Responsive layout wrapper
 * Mobile  : sticky top header + full-width content
 * Desktop : fixed left sidebar (240px) + scrollable main content
 */
import { useLocation } from "wouter";
import { ClipboardList, Package, History, CheckCircle2, Settings, LogOut, User } from "lucide-react";
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
  { href: "/submit-order", label: "Submit Order", icon: <ClipboardList size={18} /> },
  { href: "/stock-history", label: "Stock History", icon: <Package size={18} /> },
  { href: "/usage-history", label: "Usage History", icon: <History size={18} /> },
  { href: "/approval-center", label: "Approval Center", icon: <CheckCircle2 size={18} /> },
  { href: "/admin", label: "Admin Panel", icon: <Settings size={18} />, adminOnly: true },
];

interface AppLayoutProps {
  children: React.ReactNode;
  /** Page title shown in the desktop sidebar header area */
  pageTitle?: string;
}

export default function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { worker, logoutWorker } = useAuth();
  const userLevel = worker?.userLevel ?? "2";

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

        {/* Worker info */}
        {worker && (
          <div className="px-4 py-3 border-b border-border bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User size={15} className="text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{worker.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{worker.workerID} · {worker.department}</div>
              </div>
              <span className={`ml-auto shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                userLevel === "1" ? "bg-orange-100 text-orange-700" : userLevel === "1.1" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
              }`}>Lv.{userLevel}</span>
            </div>
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
                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 text-xs font-medium max-w-[90px] truncate">
                  <User size={11} className="shrink-0" />
                  <span className="truncate">{worker.name}</span>
                  <span className={`ml-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full ${
                    userLevel === "1" ? "bg-orange-200 text-orange-700" : userLevel === "1.1" ? "bg-purple-200 text-purple-700" : "bg-green-200 text-green-700"
                  }`}>Lv.{userLevel}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
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
