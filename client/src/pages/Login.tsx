import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2, User, MessageCircle, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, Lock, Zap } from "lucide-react";
import { toast } from "sonner";

// ─── Device Fingerprint ──────────────────────────────────────────────────────
function getDeviceToken(): string {
  const key = "gspp_device_token";
  let token = localStorage.getItem(key);
  if (!token) {
    token = Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem(key, token);
  }
  return token;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  let device = "Unknown Device";
  if (/iPhone/i.test(ua)) device = "iPhone";
  else if (/iPad/i.test(ua)) device = "iPad";
  else if (/Android/i.test(ua) && /Mobile/i.test(ua)) device = "Android Phone";
  else if (/Android/i.test(ua)) device = "Android Tablet";
  else if (/Macintosh/i.test(ua)) device = "Mac";
  else if (/Windows/i.test(ua)) device = "Windows PC";
  else if (/Linux/i.test(ua)) device = "Linux PC";
  let browser = "";
  if (/Edg/i.test(ua)) browser = " (Edge)";
  else if (/Chrome/i.test(ua)) browser = " (Chrome)";
  else if (/Firefox/i.test(ua)) browser = " (Firefox)";
  else if (/Safari/i.test(ua)) browser = " (Safari)";
  return device + browser;
}

const GSPP_LOGO = "/manus-storage/gspp_logo_new_2db75f16.png";
const APP_VERSION = "Web App Version 6.2.5";

// ─── Keyframe Animations ─────────────────────────────────────────────────────
const ANIM_STYLES = `
@keyframes loginSlideUp {
  from { opacity: 0; transform: translateY(32px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes loginFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes successPop {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.18); opacity: 1; }
  80%  { transform: scale(0.94); }
  100% { transform: scale(1); }
}
@keyframes successRing {
  0%   { transform: scale(0.6); opacity: 0; }
  50%  { transform: scale(1.4); opacity: 0.35; }
  100% { transform: scale(2.0); opacity: 0; }
}
@keyframes successFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes successBg {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes floatOrb {
  0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
  33%  { transform: translateY(-18px) translateX(8px) scale(1.04); }
  66%  { transform: translateY(10px) translateX(-6px) scale(0.97); }
}
@keyframes floatOrbSlow {
  0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
  50%  { transform: translateY(-28px) translateX(12px) rotate(15deg); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
  50%       { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
}
@keyframes scanLine {
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(400%); opacity: 0; }
}
@keyframes progressBar {
  from { width: 0%; }
  to   { width: 100%; }
}
@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1); opacity: 1; }
}
@keyframes cardEntrance {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes logoSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes borderGlow {
  0%, 100% { border-color: rgba(99,102,241,0.3); }
  50%       { border-color: rgba(99,102,241,0.8); }
}

.anim-slide-up    { animation: loginSlideUp 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
.anim-fade-in     { animation: loginFadeIn 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
.anim-card        { animation: cardEntrance 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) 0.1s both; }
.anim-success-bg  { animation: successBg 0.4s ease both; }
.anim-success-pop { animation: successPop 0.7s cubic-bezier(.36,.07,.19,.97) both; }
.anim-success-ring{ animation: successRing 1.2s ease-out infinite; }
.anim-success-text{ animation: successFadeUp 0.6s ease 0.5s both; }
.gradient-animate { background-size: 300% 300%; animation: gradientShift 10s ease infinite; }
.shimmer-text {
  background: linear-gradient(90deg, #6366f1 0%, #818cf8 30%, #c7d2fe 50%, #818cf8 70%, #6366f1 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
}
.pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
.border-glow { animation: borderGlow 2s ease-in-out infinite; }
`;

// ─── Success Overlay ─────────────────────────────────────────────────────────
function SuccessOverlay({ name }: { name: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center anim-success-bg overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e40af 100%)" }}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)", animation: "floatOrb 6s ease-in-out infinite" }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)", animation: "floatOrbSlow 8s ease-in-out 1s infinite" }} />
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.1 + Math.random() * 0.3,
              animation: `floatOrb ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite`,
            }} />
        ))}
      </div>

      {/* Success icon */}
      <div className="relative flex items-center justify-center mb-10">
        <div className="absolute w-44 h-44 rounded-full border border-blue-400/20 anim-success-ring" />
        <div className="absolute w-36 h-36 rounded-full border border-indigo-400/20"
          style={{ animation: "successRing 1.2s ease-out 0.4s infinite" }} />
        <div className="w-28 h-28 rounded-full flex items-center justify-center anim-success-pop shadow-2xl"
          style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)", boxShadow: "0 0 60px rgba(99,102,241,0.5)" }}>
          <CheckCircle2 size={48} className="text-white drop-shadow-lg" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center px-8 anim-success-text">
        <p className="text-indigo-300 text-xs font-bold mb-3 uppercase tracking-[0.3em]">Authentication Successful</p>
        <h2 className="text-white text-4xl font-bold mb-3" style={{ fontFamily: "Lora, serif" }}>
          Welcome, {name}!
        </h2>
        <p className="text-white/50 text-sm mb-10">Redirecting to Dashboard...</p>
        {/* Progress bar */}
        <div className="w-64 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #6366f1, #3b82f6, #06b6d4)",
              animation: "progressBar 1.5s ease-out forwards",
            }} />
        </div>
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 0.15, 0.3].map((delay, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
              style={{ animation: `dotBounce 1s ease-in-out ${delay}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Animated Background ─────────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large gradient orbs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #6366f1, transparent)", animation: "floatOrb 12s ease-in-out infinite" }} />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)", animation: "floatOrbSlow 15s ease-in-out 2s infinite" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", animation: "floatOrb 18s ease-in-out 4s infinite" }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div key={i}
          className="absolute rounded-full"
          style={{
            width: `${4 + i * 2}px`,
            height: `${4 + i * 2}px`,
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 3) * 25}%`,
            background: i % 2 === 0 ? "rgba(99,102,241,0.15)" : "rgba(59,130,246,0.12)",
            animation: `floatOrb ${5 + i * 1.5}s ease-in-out ${i * 0.7}s infinite`,
          }} />
      ))}
    </div>
  );
}

// ─── Main Login Component ─────────────────────────────────────────────────────
export default function Login() {
  const [workerID, setWorkerID] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [displacedBanner, setDisplacedBanner] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const { loginWorker } = useAuth();
  const [, navigate] = useLocation();
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = ANIM_STYLES;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "displaced") {
      setDisplacedBanner(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const workersQuery = trpc.workers.list.useQuery();
  const pendingQuery = trpc.pendingRequests.list.useQuery({ status: "pending" });
  const notifyLogin = trpc.push.sendToAll.useMutation();
  const checkDevice = trpc.workers.checkDevice.useMutation();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const completeLogin = (
    worker: { workerID: string; name: string; department: string; userLevel: "1" | "1.1" | "2" },
    deviceToken: string,
    deviceName: string,
  ) => {
    loginWorker(worker.workerID, worker.name, worker.department, worker.userLevel, deviceToken);
    notifyLogin.mutate({ title: "Employee Login", body: worker.name + " (" + worker.workerID + ") logged in on " + deviceName, tag: "worker-login" });
    setSuccessName(worker.name);
    setTimeout(() => {
      const pendingCount = pendingQuery.data?.length ?? 0;
      const greeting = getGreeting();
      const pendingMsg = pendingCount > 0 ? `You have ${pendingCount} pending ${pendingCount === 1 ? "job" : "jobs"} in the Approval Center.` : "No pending jobs.";
      toast.success(`${greeting}, ${worker.name}! ${pendingMsg}`, { duration: 5000, icon: "👋" });
      const returnTo = sessionStorage.getItem("gspp_post_login_return");
      sessionStorage.removeItem("gspp_post_login_return");
      navigate(returnTo === "/submit-order/ai-scanner" ? returnTo : "/");
    }, 1800);
  };

  const handleWorkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!workerID.trim()) { setError("Please enter your Employee ID."); return; }
    setLoading(true);
    try {
      const deviceToken = getDeviceToken();
      const deviceName = getDeviceName();
      const result = await checkDevice.mutateAsync({ workerID: workerID.trim(), deviceToken, deviceName });
      completeLogin(
        result.worker as { workerID: string; name: string; department: string; userLevel: "1" | "1.1" | "2" },
        deviceToken,
        deviceName,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  const isSuspendedAccountError = error.toLowerCase().includes("suspended");

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 40%, #f0f7ff 70%, #f5f3ff 100%)" }}>

      {successName && <SuccessOverlay name={successName} />}
      <AnimatedBackground />

      {/* Security Banner */}
      {displacedBanner && (
        <div className="fixed top-0 inset-x-0 z-50 anim-fade-in"
          style={{ background: "linear-gradient(90deg, #dc2626, #b91c1c)" }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">Security Alert: Session Terminated</p>
              <p className="text-red-100 text-xs mt-0.5 leading-relaxed">Your session was ended because a new login was detected from another device. If this was not you, contact your administrator immediately.</p>
            </div>
            <button onClick={() => setDisplacedBanner(false)}
              className="shrink-0 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between anim-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.1))", border: "1px solid rgba(99,102,241,0.2)" }}>
            <img src={GSPP_LOGO} alt="GSPP" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <div className="font-bold text-gray-800 text-sm leading-tight">PP4 Manual Slitter</div>
            <div className="text-[10px] text-gray-400 font-medium tracking-wide">Stock Management System</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#059669" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          SYSTEM ONLINE
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 py-6 lg:py-12 gap-8 lg:gap-16 max-w-5xl mx-auto w-full">

        {/* Left: Branding Panel (desktop only) */}
        <div className="hidden lg:flex flex-col items-start justify-center flex-1 max-w-md">
          <div className="anim-slide-up">
            {/* Logo */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl mb-6 pulse-glow"
                style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)", boxShadow: "0 20px 60px rgba(99,102,241,0.35)" }}>
                <img src={GSPP_LOGO} alt="GSPP" className="h-16 w-16 object-contain drop-shadow-lg" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-lg">
                <Zap size={14} className="text-white" />
              </div>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black text-gray-900 leading-tight mb-4" style={{ fontFamily: "Lora, serif" }}>
              Stock<br />
              <span className="shimmer-text">Management</span><br />
              System
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-sm">
              Secure employee authentication portal for PP4 Manual Slitter operations.
            </p>

            {/* Feature badges */}
            <div className="flex flex-col gap-3">
              {[
                { icon: <Lock size={14} />, text: "Single-device secure login", color: "from-blue-50 to-indigo-50", border: "border-blue-100", textColor: "text-blue-700" },
                { icon: <Zap size={14} />, text: "Instant dashboard access", color: "from-emerald-50 to-green-50", border: "border-emerald-100", textColor: "text-emerald-700" },
                { icon: <Sparkles size={14} />, text: "Real-time stock tracking", color: "from-violet-50 to-purple-50", border: "border-violet-100", textColor: "text-violet-700" },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2.5 bg-gradient-to-r ${item.color} border ${item.border} rounded-xl px-4 py-2.5`}
                  style={{ animation: `loginFadeIn 0.5s ease ${0.3 + i * 0.1}s both` }}>
                  <span className={item.textColor}>{item.icon}</span>
                  <span className={`text-sm font-medium ${item.textColor}`}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="w-full max-w-sm lg:max-w-md anim-card">
          {/* Mobile logo (shown only on mobile/tablet) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)", boxShadow: "0 16px 40px rgba(99,102,241,0.3)" }}>
              <img src={GSPP_LOGO} alt="GSPP" className="h-14 w-14 object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "Lora, serif" }}>
              Login Access
            </h1>
            <p className="text-gray-500 text-sm">PP4 Manual Slitter · Stock Management</p>
          </div>

          {/* Card */}
          <div className="relative rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 32px 80px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}>

            {/* Card top accent bar */}
            <div className="h-1 w-full gradient-animate"
              style={{ background: "linear-gradient(90deg, #6366f1, #3b82f6, #06b6d4, #8b5cf6, #6366f1)" }} />

            <div className="p-7 sm:p-8">
              {/* Card header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
                  <User size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight">Employee Login</h3>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">Enter your Employee ID to access</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleWorkerLogin} className="space-y-5">
                {/* Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-widest">
                    Employee ID
                  </label>
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${inputFocused || workerID ? "text-indigo-500" : "text-gray-300"}`}>
                      <User size={17} />
                    </div>
                    <input
                      type="text"
                      value={workerID}
                      onChange={(e) => { setWorkerID(e.target.value); setError(""); }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="Enter Employee ID"
                      className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-300 outline-none transition-all duration-300"
                      style={{
                        background: inputFocused ? "rgba(238,242,255,0.8)" : "rgba(248,250,252,0.8)",
                        border: inputFocused
                          ? "2px solid rgba(99,102,241,0.6)"
                          : error
                          ? "2px solid rgba(239,68,68,0.4)"
                          : "2px solid rgba(226,232,240,0.8)",
                        boxShadow: inputFocused ? "0 0 0 4px rgba(99,102,241,0.08)" : "none",
                      }}
                      autoFocus
                    />
                    {/* Scan line animation when focused */}
                    {inputFocused && (
                      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"
                          style={{ animation: "scanLine 2s ease-in-out infinite" }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 rounded-2xl px-4 py-3.5 anim-fade-in"
                    style={{ background: isSuspendedAccountError ? "rgba(255,251,235,0.96)" : "rgba(254,242,242,0.9)", border: isSuspendedAccountError ? "1px solid rgba(251,191,36,0.45)" : "1px solid rgba(252,165,165,0.5)" }}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isSuspendedAccountError ? "bg-amber-100" : "bg-red-100"}`}>
                      {isSuspendedAccountError ? <ShieldAlert size={12} className="text-amber-600" /> : <span className="text-red-500 text-xs font-bold">!</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-bold leading-snug ${isSuspendedAccountError ? "text-amber-800" : "text-red-600"}`}>{error}</p>
                      {isSuspendedAccountError && <p className="mt-1 text-xs leading-relaxed text-amber-700">Please contact your Administrator to reactivate this Employee ID, then sign in again.</p>}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || workersQuery.isLoading}
                  className="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden group"
                  style={{
                    background: loading
                      ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                      : "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3b82f6 100%)",
                    boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
                    opacity: loading || workersQuery.isLoading ? 0.85 : 1,
                    transform: "translateZ(0)",
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(99,102,241,0.55)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(99,102,241,0.4)"; }}
                >
                  {/* Shimmer on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", transform: "skewX(-20deg)" }} />

                  {loading || workersQuery.isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{loading ? "Verifying Identity..." : "Loading..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Access Dashboard</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <span className="text-xs text-gray-400 font-medium">Need access?</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </div>

              {/* WhatsApp Contact */}
              <a
                href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 group"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.08))",
                  border: "1.5px solid rgba(16,185,129,0.25)",
                  color: "#059669",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(16,185,129,0.5)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.08))";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(16,185,129,0.25)";
                }}
              >
                <MessageCircle size={17} className="transition-transform group-hover:scale-110" />
                <span>Contact Administrator via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Version badge */}
          <div className="flex items-center justify-center mt-6 gap-2">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2"
              style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(226,232,240,0.6)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-gray-500">{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
