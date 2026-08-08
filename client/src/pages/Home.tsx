import { useLocation } from "wouter";
import {
  ClipboardList, Camera, Package, CheckCircle2, Bell, X, ScanLine, ArrowRight,
  Activity, MessageCircle, FlaskConical, Info, Zap, TrendingUp,
  Users, BarChart3, Clock, Sparkles, User, BookOpen, LifeBuoy, CircleHelp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";

// ─── SEO ─────────────────────────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute("content", "stock management, inventory tracking, order management, QR scanner, StockDash");
  } else {
    const meta = document.createElement("meta");
    meta.name = "keywords";
    meta.content = "stock management, inventory tracking, order management, QR scanner, StockDash";
    document.head.appendChild(meta);
  }
}

const LOGO_URL = "/manus-storage/gspp_logo_new_2db75f16.png";
const APP_VERSION = "Web App Version 3.2.0";

// ─── Keyframe Animations ─────────────────────────────────────────────────────
const ANIM_STYLES = `
@keyframes homeSlideUp {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes homeFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes homeFloatOrb {
  0%, 100% { transform: translateY(0) translateX(0) scale(1); }
  33%  { transform: translateY(-14px) translateX(6px) scale(1.03); }
  66%  { transform: translateY(8px) translateX(-5px) scale(0.98); }
}
@keyframes homeShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes homeCountUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes homePulseRing {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes homeCardIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes homeGradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes homeScanLine {
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.6; }
  100% { transform: translateY(500%); opacity: 0; }
}
@keyframes notifPop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.home-slide-up  { animation: homeSlideUp 0.6s cubic-bezier(0.22,0.61,0.36,1) both; }
.home-fade-in   { animation: homeFadeIn 0.5s cubic-bezier(0.22,0.61,0.36,1) both; }
.home-card-in   { animation: homeCardIn 0.55s cubic-bezier(0.22,0.61,0.36,1) both; }
.home-count-up  { animation: homeCountUp 0.5s ease both; }
.home-gradient  { background-size: 300% 300%; animation: homeGradientShift 12s ease infinite; }
.home-shimmer-text {
  background: linear-gradient(90deg, #6366f1 0%, #818cf8 30%, #c7d2fe 50%, #818cf8 70%, #6366f1 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: homeShimmer 3s linear infinite;
}
.home-notif-pop { animation: notifPop 0.4s cubic-bezier(0.36,0.07,0.19,0.97) both; }
`;

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    const start = 0;
    const end = value;

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span>{display}</span>;
}

// ─── Notification Banner ──────────────────────────────────────────────────────
function NotificationBanner({ onDismiss }: { onDismiss: () => void }) {
  const [requesting, setRequesting] = useState(false);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted" || permission === "denied") onDismiss();
    } catch { /* ignore */ }
    finally { setRequesting(false); }
  };

  return (
    <div className="mx-4 lg:mx-8 mt-4 mb-0 max-w-6xl xl:mx-auto home-fade-in">
      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background: "rgba(238,242,255,0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(99,102,241,0.2)",
          boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
        }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ background: "linear-gradient(180deg, #6366f1, #3b82f6)" }} />
        <div className="flex items-center gap-3 px-5 py-3.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
            <Bell size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">Enable Push Notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">Get instant alerts when requests are approved or new orders arrive.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleEnable} disabled={requesting}
              className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
              {requesting ? "..." : "Enable"}
            </button>
            <button onClick={onDismiss}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feature Cards Config ─────────────────────────────────────────────────────
const baseFeatures = [
  {
    icon: <ScanLine size={26} className="text-white" />,
    title: "QR Scanner",
    description: "Scan QR codes to verify orders and update balances in real time.",
    href: "/qr-scanner",
    gradient: "linear-gradient(135deg, #14b8a6, #0891b2)",
    glowColor: "rgba(20,184,166,0.3)",
    btnLabel: "Open Scanner",
    accentRgb: "20,184,166",
  },
  {
    icon: <Camera size={26} className="text-white" />,
    title: "Add Stock NPRM",
    description: "Submit a new Manual Slitter Stock NPRM",
    href: "/submit-order",
    gradient: "linear-gradient(135deg, #6366f1, #3b82f6)",
    glowColor: "rgba(99,102,241,0.3)",
    btnLabel: "Add Stock NPRM",
    accentRgb: "99,102,241",
  },
  {
    icon: <Package size={26} className="text-white" />,
    title: "Stock History",
    description: "View current stock and out-of-stock orders. Filter by BQ.",
    href: "/stock-history",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    glowColor: "rgba(16,185,129,0.3)",
    btnLabel: "View Stock",
    accentRgb: "16,185,129",
  },
  {
    icon: <CheckCircle2 size={26} className="text-white" />,
    title: "NPRM Modify Order",
    description: "Review and manage pending requests for actions.",
    href: "/approval-center",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    glowColor: "rgba(245,158,11,0.3)",
    btnLabel: "View Requests",
    showBadge: true,
    accentRgb: "245,158,11",
    isNPRM: true,
  },
  {
    icon: <FlaskConical size={26} className="text-white" />,
    title: "Customer Sample",
    description: "Manage customer sample requests and track delivery status.",
    href: "/customer-sample",
    gradient: "linear-gradient(135deg, #34d399, #0d9488)",
    glowColor: "rgba(52,211,153,0.3)",
    btnLabel: "View Samples",
    accentRgb: "52,211,153",
    showSampleBadge: true,
  },
  {
    icon: <MessageCircle size={26} className="text-white" />,
    title: "Messages",
    description: "Send direct messages to other workers in real time.",
    href: "/chat",
    gradient: "linear-gradient(135deg, #075e54, #128c7e)",
    glowColor: "rgba(7,94,84,0.3)",
    btnLabel: "Open Messages",
    showMessageBadge: true,
    accentRgb: "7,94,84",
  },
  {
    icon: <User size={26} className="text-white" />,
    title: "My Profile",
    description: "Update your profile picture, display name, and Employee ID.",
    href: "/user-profile",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    glowColor: "rgba(99,102,241,0.3)",
    btnLabel: "View Profile",
    accentRgb: "99,102,241",
  },
  {
    icon: <BookOpen size={26} className="text-white" />,
    title: "Documentation",
    description: "Read the full user guide and system documentation.",
    href: "/docs",
    gradient: "linear-gradient(135deg, #3b82f6, #0ea5e9)",
    glowColor: "rgba(59,130,246,0.3)",
    btnLabel: "Read Docs",
    accentRgb: "59,130,246",
  },
  {
    icon: <LifeBuoy size={26} className="text-white" />,
    title: "Help Center",
    description: "Get support, troubleshooting guides, and contact assistance.",
    href: "/help",
    gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    glowColor: "rgba(6,182,212,0.3)",
    btnLabel: "Get Help",
    accentRgb: "6,182,212",
  },
  {
    icon: <CircleHelp size={26} className="text-white" />,
    title: "FAQ",
    description: "Find answers to the most frequently asked questions.",
    href: "/faq",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    glowColor: "rgba(245,158,11,0.3)",
    btnLabel: "Browse FAQ",
    accentRgb: "245,158,11",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [, navigate] = useLocation();
  const { worker } = useAuth();
  usePushNotifications(worker?.workerID ?? null);
  const userLevel = worker?.userLevel ?? "2";

  const styleInjected = useRef(false);
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = ANIM_STYLES;
    document.head.appendChild(el);
  }, []);

  const pendingQuery = trpc.pendingRequests.list.useQuery({ status: "pending" }, { refetchInterval: 30000 });
  const pendingCount = (pendingQuery.data ?? []).length;

  const stockCurrentQuery = trpc.orders.list.useQuery({ status: "current" }, { refetchInterval: 60000 });
  const stockOutQuery = trpc.orders.list.useQuery({ status: "out_of_stock" }, { refetchInterval: 60000 });
  const stockCurrentCount = stockCurrentQuery.data?.length ?? 0;
  const stockOutCount = stockOutQuery.data?.length ?? 0;

  const samplePendingQuery = trpc.customerSamples.list.useQuery({ status: "pending" }, { refetchInterval: 30000 });
  const sampleProgressQuery = trpc.customerSamples.list.useQuery({ status: "progress" }, { refetchInterval: 30000 });
  const sampleCount = (samplePendingQuery.data?.length ?? 0) + (sampleProgressQuery.data?.length ?? 0);

  const unreadMsgQuery = trpc.chat.getUnreadCount.useQuery(
    { workerID: worker?.workerID ?? "" },
    { refetchInterval: 5000, enabled: !!worker?.workerID }
  );
  const unreadMsgCount = unreadMsgQuery.data?.count ?? 0;

  const workersQuery = trpc.workers.list.useQuery();
  const workersCount = workersQuery.data?.length ?? 0;

  // Profile picture for greeting card
  const profileQuery = trpc.profile.get.useQuery(
    { workerID: worker?.workerID ?? "" },
    { enabled: !!worker?.workerID, staleTime: 60_000 }
  );
  const profilePic = profileQuery.data?.profilePicture ?? null;
  const displayName = profileQuery.data?.displayName ?? worker?.name ?? "";

  const [showAccessRestricted, setShowAccessRestricted] = useState(false);

  const DISMISS_KEY = "notif_banner_dismissed";
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setShowNotifBanner(true);
  }, []);
  const dismissBanner = () => { sessionStorage.setItem(DISMISS_KEY, "1"); setShowNotifBanner(false); };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const levelConfig: Record<string, { label: string; gradient: string; textColor: string }> = {
    "1":   { label: "Level 1",   gradient: "linear-gradient(135deg, #f59e0b, #d97706)", textColor: "#92400e" },
    "1.1": { label: "Level 1.1", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)", textColor: "#4c1d95" },
    "2":   { label: "Level 2",   gradient: "linear-gradient(135deg, #10b981, #059669)", textColor: "#064e3b" },
  };
  const lvl = levelConfig[userLevel] ?? levelConfig["2"];

  const stats = [
    {
      label: "Current Stock",
      value: stockCurrentCount,
      icon: <Package size={18} className="text-white" />,
      gradient: "linear-gradient(135deg, #10b981, #059669)",
      glow: "rgba(16,185,129,0.25)",
      href: "/stock-history",
    },
    {
      label: "Out of Stock",
      value: stockOutCount,
      icon: <TrendingUp size={18} className="text-white" />,
      gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
      glow: "rgba(239,68,68,0.25)",
      href: "/stock-history",
    },
    {
      label: "Pending Approvals",
      value: pendingCount,
      icon: <Clock size={18} className="text-white" />,
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      glow: "rgba(245,158,11,0.25)",
      href: "/approval-center",
    },
    {
      label: "Active Workers",
      value: workersCount,
      icon: <Users size={18} className="text-white" />,
      gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
      glow: "rgba(99,102,241,0.25)",
      href: undefined,
      onClickOverride: () => setShowAccessRestricted(true),
    },
  ];

  return (
    <AppLayout>
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #1e3a5f 100%)" }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)", animation: "homeFloatOrb 10s ease-in-out infinite" }} />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)", animation: "homeFloatOrb 14s ease-in-out 2s infinite" }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
          {/* Scan line */}
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"
            style={{ animation: "homeScanLine 6s ease-in-out infinite" }} />
        </div>

        <div className="relative px-4 lg:px-8 py-7 lg:py-9">
          {/* Mobile quick action badge */}
          <button onClick={() => navigate("/approval-center")}
            className="lg:hidden absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <CheckCircle2 size={18} className="text-white" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg home-notif-pop">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </button>

          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8">
              {/* Logo + Title */}
              <div className="flex items-center gap-4 mb-5 lg:mb-0 home-slide-up">
                <div className="relative">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-2xl"
                    style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                    <img src={LOGO_URL} alt="GSPP" className="h-10 w-10 lg:h-12 lg:w-12 object-contain drop-shadow-lg" />
                  </div>
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-2xl"
                    style={{ border: "2px solid rgba(99,102,241,0.4)", animation: "homePulseRing 2.5s ease-out infinite" }} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-white leading-tight" style={{ fontFamily: "Lora, serif" }}>
                    PP4 Manual Slitter
                  </h2>
                  <p className="text-white/50 text-xs font-medium tracking-wide mt-0.5">Stock Management System</p>
                </div>
              </div>

              {/* User greeting card */}
              {worker && (
                <div className="lg:ml-auto home-fade-in" style={{ animationDelay: "0.15s" }}>
                  <div className="rounded-2xl px-5 py-3.5 flex items-center gap-4"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}>
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shrink-0">
                      {profilePic ? (
                        <img src={profilePic} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-white text-base"
                          style={{ background: lvl.gradient }}>
                          {worker.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">{getGreeting()}</p>
                      <p className="text-white font-bold text-sm leading-tight mt-0.5">{displayName || worker.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                          {worker.department}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: lvl.gradient, color: lvl.textColor }}>
                          {lvl.label}
                        </span>
                      </div>
                    </div>
                    {/* Online dot */}
                    <div className="ml-2 flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] text-emerald-400 font-bold">LIVE</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Announcement + Notification ──────────────────────────────────── */}
      <h2 className="sr-only">Stock Management Tools and Features</h2>
      <AnnouncementBanner />
      {showNotifBanner && <NotificationBanner onDismiss={dismissBanner} />}

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="px-4 lg:px-8 pt-6 pb-2">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
            {stats.map((stat, i) => (
              <div key={stat.label}
                onClick={() => {
                  if ((stat as any).onClickOverride) { (stat as any).onClickOverride(); return; }
                  if (stat.href) navigate(stat.href);
                }}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 home-card-in ${(stat.href || (stat as any).onClickOverride) ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
                style={{
                  animationDelay: `${i * 0.08}s`,
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.9)",
                  boxShadow: `0 4px 24px ${stat.glow}, 0 1px 4px rgba(0,0,0,0.04)`,
                }}>
                {/* Top accent */}
                <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl" style={{ background: stat.gradient }} />
                <div className="p-3 lg:p-4">
                  <div className="flex items-start justify-between mb-2 lg:mb-3">
                    <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl flex items-center justify-center shadow-md [&>svg]:w-3.5 [&>svg]:h-3.5 lg:[&>svg]:w-4 lg:[&>svg]:h-4"
                      style={{ background: stat.gradient, boxShadow: `0 4px 12px ${stat.glow}` }}>
                      {stat.icon}
                    </div>
                    {stat.label === "Pending Approvals" && pendingCount > 0 && (
                      <span className="hidden lg:inline text-[10px] font-bold px-2 py-0.5 rounded-full text-amber-700"
                        style={{ background: "rgba(245,158,11,0.12)" }}>
                        Action needed
                      </span>
                    )}
                  </div>
                  <div className="home-count-up" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                    <div className="text-xl lg:text-3xl font-black text-gray-900 leading-none">
                      <AnimatedNumber value={stat.value} duration={700 + i * 100} />
                    </div>
                    <p className="text-[10px] lg:text-xs text-gray-500 font-medium mt-0.5 lg:mt-1 leading-tight">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5 home-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 leading-tight" style={{ fontFamily: "Lora, serif" }}>
                  Quick Actions
                </h2>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Access your most used features</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <BarChart3 size={13} />
              <span>{baseFeatures.length} features</span>
            </div>
          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {baseFeatures.map((f, i) => {
              const badge = f.showBadge ? pendingCount
                : (f as { showSampleBadge?: boolean }).showSampleBadge ? sampleCount
                : (f as { showMessageBadge?: boolean }).showMessageBadge ? unreadMsgCount
                : 0;

              const card = (
                <div key={f.href}
                  onClick={() => navigate(f.href)}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 home-card-in"
                  style={{
                    animationDelay: `${0.1 + i * 0.07}s`,
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    boxShadow: `0 4px 24px ${f.glowColor.replace("0.3", "0.08")}, 0 1px 4px rgba(0,0,0,0.04)`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 48px ${f.glowColor}, 0 4px 16px rgba(0,0,0,0.06)`;
                    (e.currentTarget as HTMLDivElement).style.border = `1px solid rgba(${f.accentRgb},0.25)`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 24px ${f.glowColor.replace("0.3", "0.08")}, 0 1px 4px rgba(0,0,0,0.04)`;
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.9)";
                  }}>

                  {/* Top accent bar */}
                  <div className="absolute top-0 inset-x-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: f.gradient }} />

                  {/* Badge */}
                  {badge > 0 && (
                    <span className="absolute top-3.5 right-3.5 min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg z-10 home-notif-pop">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}

                  <div className="p-3 sm:p-5">
                    {/* Icon */}
                    <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110"
                      style={{ background: f.gradient, boxShadow: `0 8px 24px ${f.glowColor}` }}>
                      <span className="[&>svg]:w-[18px] [&>svg]:h-[18px] sm:[&>svg]:w-[26px] sm:[&>svg]:h-[26px]">{f.icon}</span>
                      {/* Shimmer on hover */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2), transparent)" }} />
                    </div>

                    {/* Content */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-black text-gray-900 text-[11px] sm:text-sm leading-tight group-hover:text-gray-800 line-clamp-2">
                        {f.title}
                      </h3>
                      {(f as { isNPRM?: boolean }).isNPRM && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="hidden sm:flex flex-shrink-0 w-5 h-5 rounded-full items-center justify-center transition-colors"
                              style={{ background: "rgba(245,158,11,0.12)", color: "#d97706" }}>
                              <Info size={11} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="max-w-xs text-xs">
                            Review pending requests from Level 1/1.1 users. Approve, cancel, or process-approve based on your user level.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="hidden sm:block text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{f.description}</p>

                    {/* CTA */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold transition-all duration-200"
                      style={{ color: `rgb(${f.accentRgb})` }}>
                      <span>{f.btnLabel}</span>
                      <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );

              return (f as { isNPRM?: boolean }).isNPRM ? (
                <Tooltip key={f.href}>
                  <TooltipTrigger asChild>{card}</TooltipTrigger>
                </Tooltip>
              ) : card;
            })}
          </div>
        </div>
      </div>

      {/* ── System Status Bar ────────────────────────────────────────────── */}
      <div className="px-4 lg:px-8 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(226,232,240,0.6)",
            }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700">System Online</span>
              </div>
              <span className="hidden sm:block text-gray-200">|</span>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
                <Activity size={12} />
                <span>Real-time data sync active</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-indigo-400" />
              <span className="text-xs font-mono font-bold"
                style={{
                  background: "linear-gradient(90deg, #6366f1, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                {APP_VERSION}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100/80 py-4 text-center px-4"
        style={{ background: "rgba(248,250,252,0.5)" }}>
        <p className="text-xs text-gray-400 font-medium">
          PP4 Manual Slitter Stock Management &copy; {new Date().getFullYear()}
        </p>
      </footer>
      {/* Access Restricted Dialog */}
      <Dialog open={showAccessRestricted} onOpenChange={setShowAccessRestricted}>
        <DialogContent className="w-full max-w-sm data-[state=open]:slide-in-from-bottom-6 data-[state=closed]:slide-out-to-bottom-4 duration-300">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ background: "rgba(245,158,11,0.12)" }}>
              <ShieldOff size={32} style={{ color: "#d97706" }} />
            </div>
            <DialogTitle className="text-xl font-bold">Access Restricted</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-center space-y-1 text-sm">
            <p className="text-foreground">You don&apos;t have permission to access this page.</p>
            <p className="text-muted-foreground">Please contact your Administrator to update your account.</p>
          </DialogDescription>
          <div className="flex flex-col gap-2 mt-4">
            {import.meta.env.VITE_ADMIN_WHATSAPP && (
              <a
                href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #25d366, #128c4e)", boxShadow: "0 4px 14px rgba(37,211,102,0.3)" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contact Administrator
              </a>
            )}
            <Button variant="outline" onClick={() => setShowAccessRestricted(false)} className="w-full">
              Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
