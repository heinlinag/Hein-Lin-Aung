import { useLocation } from "wouter";
import { ClipboardList, Package, Settings, History, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LOGO_URL = "/manus-storage/gspp-logo_988a5ce5.png";

const features = [
  {
    icon: <ClipboardList size={28} />,
    title: "Submit Order",
    description: "Submit a new Manual Slitter order with Flute Type, Size, Qty and BQ",
    href: "/submit-order",
    cardClass: "feature-card-blue",
    btnLabel: "Submit Order",
  },
  {
    icon: <Package size={28} />,
    title: "Stock History",
    description: "View current stock and out-of-stock orders. Update usage and filter by BQ.",
    href: "/stock-history",
    cardClass: "feature-card-green",
    btnLabel: "View Stock",
  },
  {
    icon: <History size={28} />,
    title: "Usage History",
    description: "Track how orders have been used — by Job No or Old Stock clearance.",
    href: "/usage-history",
    cardClass: "feature-card-purple",
    btnLabel: "View Usage",
  },
  {
    icon: <Settings size={28} />,
    title: "Admin",
    description: "Manage workers, view all orders, and access system administration.",
    href: "/admin",
    cardClass: "feature-card-red",
    btnLabel: "Admin Login",
  },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { worker, logoutWorker } = useAuth();

  const handleLogout = () => {
    logoutWorker();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10 shadow-sm">
        <div className="container py-3 flex items-center gap-3">
          <img
            src={LOGO_URL}
            alt="GSPP Logo"
            className="h-10 w-10 object-contain"
          />
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>
              PP4 Manual Slitter
            </h1>
            <p className="text-xs text-muted-foreground leading-tight">Stock Management System</p>
          </div>
          {worker && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-medium">
                <User size={12} />
                <span>{worker.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="gspp-gradient py-8 px-4 text-white text-center">
        <img
          src={LOGO_URL}
          alt="GSPP"
          className="h-16 w-16 object-contain mx-auto mb-3 bg-white rounded-full p-1 shadow-md"
        />
        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Lora, serif" }}>
          PP4 Manual Slitter
        </h2>
        <p className="text-sm opacity-90">Stock Management System</p>
      </div>

      {/* Feature Cards */}
      <main className="container py-6 flex-1">
        <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
          {features.map((f) => (
            <div
              key={f.href}
              className={`rounded-xl p-5 shadow-sm ${f.cardClass}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight" style={{ fontFamily: "Lora, serif" }}>
                    {f.title}
                  </h3>
                  <p className="text-sm opacity-85 mt-0.5">{f.description}</p>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">PP4 Manual Slitter Stock Management &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
