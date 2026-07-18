import { useLocation } from "wouter";
import { ClipboardList, Package, History, CheckCircle2, Bell, BellOff, X, ScanLine, ArrowRight, Activity, TrendingUp, MessageCircle, Info, FlaskConical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

// Add SEO meta keywords
if (typeof document !== 'undefined') {
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute('content', 'stock management, inventory tracking, order management, QR scanner, StockDash');
  } else {
    const meta = document.createElement('meta');
    meta.name = 'keywords';
    meta.content = 'stock management, inventory tracking, order management, QR scanner, StockDash';
    document.head.appendChild(meta);
  }
}

const LOGO_URL = "/manus-storage/gspp_logo_new_2db75f16.png";
const APP_VERSION = "Web App Version 3.2.0";

const baseFeatures = [
  {
    icon: <ScanLine size={28} className="text-white" />,
    title: "QR Scanner",
    description: "Scan QR codes to verify orders and update balances in real time.",
    href: "/qr-scanner",
    gradient: "from-teal-500 to-cyan-600",
    shadowColor: "shadow-teal-500/20",
    btnLabel: "Open Scanner",
    accentColor: "teal",
  },
  {
    icon: <ClipboardList size={28} className="text-white" />,
    title: "Submit Order",
    description: "Submit a new Manual Slitter order with Flute Type, Size, and Qty.",
    href: "/submit-order",
    gradient: "from-blue-500 to-indigo-600",
    shadowColor: "shadow-blue-500/20",
    btnLabel: "Submit Order",
    accentColor: "blue",
  },
  {
    icon: <Package size={28} className="text-white" />,
    title: "Stock History",
    description: "View current stock and out-of-stock orders. Filter by BQ.",
    href: "/stock-history",
    gradient: "from-emerald-500 to-green-600",
    shadowColor: "shadow-emerald-500/20",
    btnLabel: "View Stock",
    accentColor: "green",
  },
  {
    icon: <History size={28} className="text-white" />,
    title: "Usage History",
    description: "Track how orders have been used by Job No or Old Stock.",
    href: "/usage-history",
    gradient: "from-purple-500 to-violet-600",
    shadowColor: "shadow-purple-500/20",
    btnLabel: "View Usage",
    accentColor: "purple",
  },
  {
    icon: <CheckCircle2 size={28} className="text-white" />,
    title: "NPRM Modify Order",
    description: "Review and manage pending requests for actions.",
    href: "/approval-center",
    gradient: "from-orange-500 to-amber-600",
    shadowColor: "shadow-orange-500/20",
    btnLabel: "View Requests",
    showBadge: true,
    accentColor: "orange",
  },
  {
    icon: <FlaskConical size={28} className="text-white" />,
    title: "Customer Sample",
    description: "Manage customer sample requests and track delivery status.",
    href: "/customer-sample",
    gradient: "from-emerald-400 to-teal-600",
    shadowColor: "shadow-emerald-500/20",
    btnLabel: "View Samples",
    accentColor: "emerald",
    showSampleBadge: true,
  },
  {
    icon: <MessageCircle size={28} className="text-white" />,
    title: "Messages",
    description: "Send direct messages to other workers in real time.",
    href: "/chat",
    gradient: "from-[#075e54] to-[#128c7e]",
    shadowColor: "shadow-teal-700/20",
    btnLabel: "Open Messages",
    showMessageBadge: true,
    accentColor: "teal",
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
    <div className="mx-4 lg:mx-8 mt-4 mb-0 max-w-6xl xl:mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
          <Bell size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">Enable Notifications</p>
          <p className="text-xs text-gray-600 leading-tight mt-0.5">
            Get instant alerts when requests are approved.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 shadow-md shadow-blue-500/20"
          >
            {requesting ? "..." : "Enable"}
          </button>
          <button
            onClick={onDismiss}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const levelConfig = {
    "1": { label: "Level 1", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
    "1.1": { label: "Level 1.1", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
    "2": { label: "Level 2", bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  };
  const lvl = levelConfig[userLevel as keyof typeof levelConfig] || levelConfig["2"];

  return (
    <AppLayout>
      {/* Hero banner - Premium design */}
      <div className="gspp-gradient relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative px-4 lg:px-8 py-8 lg:py-10">
          {/* Mobile bell badge */}
          <button
            onClick={() => navigate("/approval-center")}
            className="lg:hidden absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all border border-white/20"
            title="Approval Center"
          >
            <CheckCircle2 size={18} className="text-white" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </button>

          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:gap-6">
            {/* Logo and title */}
            <div className="flex items-center gap-4 mb-4 lg:mb-0">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <img src={LOGO_URL} alt="GSPP" className="h-10 w-10 lg:h-12 lg:w-12 object-contain" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white" style={{ fontFamily: "Lora, serif" }}>
                  PP4 Manual Slitter
                </h2>
                <p className="text-white/70 text-xs lg:text-sm font-medium">Stock Management System</p>
              </div>
            </div>

            {/* User info */}
            {worker && (
              <div className="lg:ml-auto flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15">
                  <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">{getGreeting()}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-white font-bold text-sm">{worker.name}</p>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${lvl.bg} ${lvl.text}`}>
                      {lvl.label}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick stats */}
          {pendingCount > 0 && (
            <div className="max-w-6xl mx-auto mt-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/15">
                <Activity size={14} className="text-orange-300" />
                <span className="text-white/80 text-xs font-medium">
                  {pendingCount} pending {pendingCount === 1 ? "approval" : "approvals"}
                </span>
                <button onClick={() => navigate("/approval-center")} className="text-white/90 text-xs font-bold hover:text-white flex items-center gap-0.5">
                  View <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEO H2 Heading */}
      <h2 className="sr-only">Stock Management Tools and Features</h2>

      {/* Announcement marquee ticker */}
      <AnnouncementBanner />

      {/* Notification permission banner */}
      {showNotifBanner && <NotificationBanner onDismiss={dismissBanner} />}

      {/* Feature cards grid */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>Quick Actions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Access your most used features</p>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400">
              <TrendingUp size={12} />
              <span>5 features available</span>
            </div>
          </div>

          {/* Cards grid - responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {baseFeatures.map((f) => {
              const isNPRMCard = f.title === "NPRM Modify Order";
              const tooltipText = isNPRMCard 
                ? "Review pending requests from Level 1/1.1 users. Approve, cancel, or process-approve based on your user level."
                : undefined;
              
              const cardContent = (
                <div
                  key={f.href}
                  onClick={() => navigate(f.href)}
                  className={`group relative rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-xl ${f.shadowColor} transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden`}
                >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />

                {/* Badge on Approval Center */}
                {f.showBadge && pendingCount > 0 && (
                  <span className="absolute top-3 right-3 min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg notif-badge z-10">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
                {/* Badge on Customer Sample */}
                {(f as { showSampleBadge?: boolean }).showSampleBadge && sampleCount > 0 && (
                  <span className="absolute top-3 right-3 min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg notif-badge z-10">
                    {sampleCount > 99 ? "99+" : sampleCount}
                  </span>
                )}
                {/* Badge on Messages */}
                {(f as { showMessageBadge?: boolean }).showMessageBadge && unreadMsgCount > 0 && (
                  <span className="absolute top-3 right-3 min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg notif-badge z-10">
                    {unreadMsgCount > 99 ? "99+" : unreadMsgCount}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg ${f.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>

                {/* Content */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base mb-1.5 group-hover:text-gray-800">
                      {f.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
                      {f.description}
                    </p>
                  </div>
                  {isNPRMCard && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors mt-0.5">
                          <Info size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="end" className="max-w-xs text-xs">
                        {tooltipText}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Action */}
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-blue-600 transition-colors">
                  <span>{f.btnLabel}</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              );
              
              return isNPRMCard ? (
                <Tooltip key={f.href}>
                  <TooltipTrigger asChild>
                    {cardContent}
                  </TooltipTrigger>
                </Tooltip>
              ) : (
                cardContent
              );
            })
            }
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-4 text-center px-4 bg-gray-50/50">
        <div className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <p className="text-xs text-gray-500 font-medium">
            PP4 Manual Slitter Stock Management &copy; {new Date().getFullYear()}
          </p>
          <span className="text-[10px] text-gray-300">|</span>
          <span className="text-xs font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{APP_VERSION}</span>
        </div>
      </footer>
    </AppLayout>
  );
}
