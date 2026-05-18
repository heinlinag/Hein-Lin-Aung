import { useLocation } from "wouter";
import { ClipboardList, Package, History, CheckCircle2, Bell, BellOff, X, ScanLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useState, useEffect } from "react";

const LOGO_URL = "/manus-storage/gspp-logo_988a5ce5.png";

const baseFeatures = [
  {
    icon: <ScanLine size={48} className="text-teal-300 drop-shadow-lg" />,
    title: "QR Scanner",
    description: "Scan QR codes on stock labels to verify orders and update balances in real time.",
    href: "/qr-scanner",
    cardClass: "feature-card-teal",
    btnLabel: "Open Scanner",
    iconBg: "bg-gradient-to-br from-teal-500/40 via-cyan-500/30 to-cyan-400/20",
    accentColor: "teal",
  },
  {
    icon: <ClipboardList size={48} className="text-blue-300 drop-shadow-lg" />,
    title: "Submit Order",
    description: "Submit a new Manual Slitter order with Flute Type, Size, Qty and BQ comment.",
    href: "/submit-order",
    cardClass: "feature-card-blue",
    btnLabel: "Submit Order",
    iconBg: "bg-gradient-to-br from-blue-500/40 via-indigo-500/30 to-indigo-400/20",
    accentColor: "blue",
  },
  {
    icon: <Package size={48} className="text-green-300 drop-shadow-lg" />,
    title: "Stock History",
    description: "View current stock and out-of-stock orders. Update usage and filter by BQ.",
    href: "/stock-history",
    cardClass: "feature-card-green",
    btnLabel: "View Stock",
    iconBg: "bg-gradient-to-br from-green-500/40 via-emerald-500/30 to-emerald-400/20",
    accentColor: "green",
  },
  {
    icon: <History size={48} className="text-purple-300 drop-shadow-lg" />,
    title: "Usage History",
    description: "Track how orders have been used — by Job No or Old Stock clearance.",
    href: "/usage-history",
    cardClass: "feature-card-purple",
    btnLabel: "View Usage",
    iconBg: "bg-gradient-to-br from-purple-500/40 via-violet-500/30 to-violet-400/20",
    accentColor: "purple",
  },
  {
    icon: <CheckCircle2 size={48} className="text-orange-300 drop-shadow-lg" />,
    title: "Approval Center",
    description: "Review and manage pending requests for delete and used-update actions.",
    href: "/approval-center",
    cardClass: "feature-card-orange",
    btnLabel: "Open Approval Center",
    showBadge: true,
    iconBg: "bg-gradient-to-br from-orange-500/40 via-amber-500/30 to-amber-400/20",
    accentColor: "orange",
  },
];

function NotificationBanner({ onDismiss }: { onDismiss: () => void }) {
  const [requesting, setRequesting] = useState(false);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted" || permission === "denied") {
        onDismiss();
      }
    } catch {
      // ignore
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="mx-4 lg:mx-8 mt-4 mb-0 max-w-6xl lg:mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Bell size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900 leading-tight">Enable Notifications</p>
          <p className="text-xs text-blue-700 opacity-80 leading-tight mt-0.5">
            Get instant alerts when your requests are approved or new orders arrive.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {requesting ? "..." : "Enable"}
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // Notification permission banner state
  const DISMISS_KEY = "notif_banner_dismissed";
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setShowNotifBanner(true);
  }, []);

  const dismissBanner = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShowNotifBanner(false);
  };

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
              userLevel === "1" ? "bg-orange-400 text-white" : userLevel === "1.1" ? "bg-purple-500 text-white" : "bg-green-400 text-white"
            }`}>
              Level {userLevel}
            </span>
          </div>
        )}
      </div>

      {/* Notification permission banner */}
      {showNotifBanner && <NotificationBanner onDismiss={dismissBanner} />}

      {/* Feature cards grid */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl mx-auto lg:mx-0">
          {baseFeatures.map((f) => (
            <div
              key={f.href}
              className={`rounded-xl p-5 shadow-sm ${f.cardClass} relative flex flex-col`}
            >
              <div className="flex items-start gap-4 mb-4 flex-1">
                <div className={`${f.iconBg} rounded-2xl p-4 flex-shrink-0 backdrop-blur-md border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 hover:border-white/50 relative group`}>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                    background: f.accentColor === 'teal' ? 'rgba(20, 184, 166, 0.3)' : 
                               f.accentColor === 'blue' ? 'rgba(59, 130, 246, 0.3)' :
                               f.accentColor === 'green' ? 'rgba(34, 197, 94, 0.3)' :
                               f.accentColor === 'purple' ? 'rgba(168, 85, 247, 0.3)' :
                               'rgba(249, 115, 22, 0.3)'
                  }} />
                  <div className="relative z-10">
                    {f.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight text-white" style={{ fontFamily: "Lora, serif" }}>
                    {f.title}
                    {f.href === "/approval-center" && (userLevel === "1" || userLevel === "1.1") && (
                      <span className="ml-2 text-xs font-normal opacity-80">{userLevel === "1.1" ? "(View & Process)" : "(View & Cancel)"}</span>
                    )}
                  </h3>
                  <p className="text-sm opacity-85 mt-0.5 text-white/90">{f.description}</p>
                </div>
              </div>
              {/* Badge on Approval Center */}
              {f.showBadge && pendingCount > 0 && (
                <span className="absolute top-3 right-3 min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
              <button
                onClick={() => navigate(f.href)}
                className="w-full bg-white/20 hover:bg-white/35 active:bg-white/40 transition-all duration-300 rounded-lg py-2.5 text-sm font-semibold text-white border border-white/30 hover:border-white/50 hover:shadow-lg transform hover:-translate-y-1"
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
          PP4 Manual Slitter Stock Management &copy; {new Date().getFullYear()} &middot; v9030889b
        </p>
      </footer>
    </AppLayout>
  );
}
