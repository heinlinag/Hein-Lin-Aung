import { useLocation } from "wouter";
import { ClipboardList, Package, History, CheckCircle2, Settings, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";

const LOGO_URL = "/manus-storage/gspp-logo_988a5ce5.png";

const baseFeatures = [
  {
    icon: <ClipboardList size={32} />,
    title: "Submit Order",
    description: "Submit a new Manual Slitter order with Flute Type, Size, Qty and BQ comment.",
    href: "/submit-order",
    cardClass: "feature-card-blue",
    btnLabel: "Submit Order",
  },
  {
    icon: <Package size={32} />,
    title: "Stock History",
    description: "View current stock and out-of-stock orders. Update usage and filter by BQ.",
    href: "/stock-history",
    cardClass: "feature-card-green",
    btnLabel: "View Stock",
  },
  {
    icon: <History size={32} />,
    title: "Usage History",
    description: "Track how orders have been used — by Job No or Old Stock clearance.",
    href: "/usage-history",
    cardClass: "feature-card-purple",
    btnLabel: "View Usage",
  },
  {
    icon: <CheckCircle2 size={32} />,
    title: "Approval Center",
    description: "Review and manage pending requests for delete and used-update actions.",
    href: "/approval-center",
    cardClass: "feature-card-orange",
    btnLabel: "Open Approval Center",
    showBadge: true,
  },
  {
    icon: <Settings size={32} />,
    title: "Admin Panel",
    description: "Manage workers, view all orders, export reports, and system administration.",
    href: "/admin",
    cardClass: "feature-card-red",
    btnLabel: "Admin Login",
  },
  {
    icon: <BookOpen size={32} />,
    title: "Documentation",
    description: "Access user guides and admin documentation for the system.",
    href: "/docs",
    cardClass: "feature-card-indigo",
    btnLabel: "View Docs",
  },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { worker } = useAuth();
  usePushNotifications(worker?.workerID ?? null);
  const userLevel = worker?.userLevel ?? "2";

  const pendingQuery = trpc.pendingRequests.list.useQuery(
    { status: "pending" },
    { refetchInterval: 30000 }
  );
  const pendingCount = (pendingQuery.data ?? []).length;

  return (
    <AppLayout>
      {/* Hero banner */}
      <div className="gspp-gradient py-10 px-4 text-white text-center relative">
        {/* Bell badge (mobile only — desktop uses sidebar) */}
        <button
          onClick={() => navigate("/approval-center")}
          className="lg:hidden absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          title="Approval Center"
        >
          <CheckCircle2 size={20} className="text-white" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
        <img
          src={LOGO_URL}
          alt="GSPP"
          className="h-16 w-16 object-contain mx-auto mb-3 bg-white rounded-full p-1 shadow-md"
        />
        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Lora, serif" }}>
          PP4 Manual Slitter
        </h2>
        <p className="text-sm opacity-90">Stock Management System</p>
        {worker && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
            <span>Welcome, {worker.name}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
              userLevel === "1" ? "bg-orange-400 text-white" : "bg-green-400 text-white"
            }`}>
              Level {userLevel}
            </span>
          </div>
        )}
      </div>

      {/* Feature cards grid */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl mx-auto lg:mx-0">
          {baseFeatures.map((f) => (
            <div
              key={f.href}
              className={`rounded-xl p-5 shadow-sm ${f.cardClass} relative flex flex-col`}
            >
              {/* Badge on Approval Center */}
              {f.showBadge && pendingCount > 0 && (
                <span className="absolute top-3 right-3 min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
              <div className="flex items-start gap-4 mb-4 flex-1">
                <div className="bg-white/20 rounded-lg p-2.5 flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight text-white" style={{ fontFamily: "Lora, serif" }}>
                    {f.title}
                    {f.href === "/approval-center" && userLevel === "1" && (
                      <span className="ml-2 text-xs font-normal opacity-80">(View & Cancel)</span>
                    )}
                  </h3>
                  <p className="text-sm opacity-85 mt-0.5 text-white/90">{f.description}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(f.href)}
                className="w-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors rounded-lg py-2.5 text-sm font-semibold text-white border border-white/30"
              >
                {f.btnLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center px-4">
        <p className="text-xs text-muted-foreground">
          PP4 Manual Slitter Stock Management &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </AppLayout>
  );
}
