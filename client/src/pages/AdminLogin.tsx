import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2, ShieldCheck, Eye, EyeOff, Lock, ShieldAlert, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";

const GSPP_LOGO = "/manus-storage/gspp_logo_new_2db75f16.png";
const APP_VERSION = "Web App Version 6.2.5";

const ANIM_STYLES = `
@keyframes alFadeUp {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes alFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50%       { transform: translateY(-14px) scale(1.04); }
}
@keyframes alScanLine {
  0%   { top: -2px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
@keyframes alPulseRing {
  0%   { transform: scale(0.95); opacity: 0.6; }
  70%  { transform: scale(1.15); opacity: 0; }
  100% { transform: scale(1.15); opacity: 0; }
}
@keyframes alShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes alSuccessBg {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes alSuccessPop {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.18); opacity: 1; }
  80%  { transform: scale(0.94); }
  100% { transform: scale(1); }
}
@keyframes alSuccessRing {
  0%   { transform: scale(0.6); opacity: 0; }
  50%  { transform: scale(1.4); opacity: 0.35; }
  100% { transform: scale(2); opacity: 0; }
}
@keyframes alSuccessText {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes alInputGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  50%       { box-shadow: 0 0 0 3px rgba(99,102,241,0.18); }
}
.al-fade-up       { animation: alFadeUp 0.55s cubic-bezier(0.22,0.61,0.36,1) both; }
.al-success-bg    { animation: alSuccessBg 0.4s ease both; }
.al-success-pop   { animation: alSuccessPop 0.65s cubic-bezier(.36,.07,.19,.97) both; }
.al-success-ring  { animation: alSuccessRing 1.1s ease-out infinite; }
.al-success-text  { animation: alSuccessText 0.5s ease 0.45s both; }
.al-input-focus:focus { animation: alInputGlow 2s ease infinite; }
`;

const ADMIN_LOGIN_LIGHT_STYLES = `
.admin-login-light { color:#0f172a; }
.admin-login-light .text-white { color:#0f172a !important; }
.admin-login-light .bg-gradient-to-br.text-white,.admin-login-light .bg-gradient-to-br .text-white,
.admin-login-light button[style*="gradient"].text-white,.admin-login-light button[style*="gradient"] .text-white { color:#fff !important; }
.admin-login-light [style*="rgba(15,23,42"],.admin-login-light [style*="rgba(255,255,255,0.0"] {
  background:#fff !important; border-color:#e2e8f0 !important; box-shadow:0 18px 42px rgba(15,23,42,.08) !important;
}
.admin-login-light input { background:#fff !important; color:#0f172a !important; border-color:#cbd5e1 !important; }
.admin-login-light input::placeholder { color:#94a3b8 !important; }
.admin-login-light .text-slate-400 { color:#64748b !important; }
.admin-login-light [class*="border-white"] { border-color:#e2e8f0 !important; }
`;

function SuccessOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center al-success-bg"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      {/* Particle field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${4 + (i % 4) * 3}px`,
              height: `${4 + (i % 4) * 3}px`,
              left: `${(i * 41 + 7) % 100}%`,
              top: `${(i * 53 + 11) % 100}%`,
              background: i % 3 === 0 ? "rgba(99,102,241,0.5)" : i % 3 === 1 ? "rgba(139,92,246,0.4)" : "rgba(59,130,246,0.3)",
              animation: `alFloat ${2.5 + (i % 3) * 0.8}s ease-in-out ${(i % 5) * 0.4}s infinite`,
            }}
          />
        ))}
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
      </div>
      {/* Success icon */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-40 h-40 rounded-full al-success-ring"
          style={{ background: "rgba(99,102,241,0.2)" }} />
        <div className="absolute w-32 h-32 rounded-full"
          style={{ background: "rgba(139,92,246,0.15)", animation: "alSuccessRing 1.1s ease-out 0.3s infinite" }} />
        <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl al-success-pop"
          style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 0 60px rgba(99,102,241,0.6)" }}>
          <ShieldCheck size={44} className="text-white drop-shadow-lg" />
        </div>
      </div>
      <div className="text-center px-8 al-success-text">
        <p className="text-indigo-300 text-xs font-bold mb-2 uppercase tracking-[0.25em]">Administrator Access Granted</p>
        <h2 className="text-white text-3xl font-black mb-2" style={{ fontFamily: "Lora, serif" }}>Welcome, Admin</h2>
        <p className="text-slate-400 text-sm">Redirecting to Admin Panel...</p>
        <div className="mt-8 w-56 mx-auto h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #6366f1, #7c3aed, #6366f1)", backgroundSize: "200%", animation: "alShimmer 1.5s ease forwards" }} />
        </div>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(false);
  const { loginAdmin } = useAuth();
  const [, navigate] = useLocation();
  const styleInjected = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const verifyMutation = trpc.system.verifyAdminPassword.useMutation();

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = ANIM_STYLES + ADMIN_LOGIN_LIGHT_STYLES;
    document.head.appendChild(el);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password.trim()) { setError("Please enter the Administrator Password."); return; }
    setLoading(true);
    try {
      const result = await verifyMutation.mutateAsync({ password });
      if (!result.valid) {
        setError("Incorrect password. Please try again.");
        setLoading(false);
        return;
      }
      loginAdmin(password);
      setSuccess(true);
      setTimeout(() => { navigate("/admin"); }, 1800);
    } catch {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-light min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 48%, #ffffff 100%)" }}>
      {success && <SuccessOverlay />}

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-12"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)", animation: "alFloat 12s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)", animation: "alFloat 16s ease-in-out 3s infinite" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        {/* Scan line */}
        <div className="absolute inset-x-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)",
            animation: "alScanLine 7s ease-in-out infinite",
          }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-3 flex items-center gap-3"
        style={{
          background: "rgba(15,23,42,0.7)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <img src={GSPP_LOGO} alt="GSPP" className="h-7 w-7 object-contain" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-white text-sm leading-tight">PP4 Manual Slitter</div>
          <div className="text-[10px] text-slate-400 font-medium">Stock Management System</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-semibold text-emerald-300">Online</span>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Hero icon + title */}
        <div className="text-center mb-8 al-fade-up">
          <div className="relative inline-flex items-center justify-center mb-5">
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl"
              style={{ border: "2px solid rgba(99,102,241,0.4)", animation: "alPulseRing 2.5s ease-out infinite" }} />
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(124,58,237,0.3))",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(99,102,241,0.4)",
                boxShadow: "0 0 40px rgba(99,102,241,0.3)",
              }}>
              <ShieldAlert size={36} className="text-indigo-300 drop-shadow-lg" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <Shield size={11} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Restricted Access</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight" style={{ fontFamily: "Lora, serif" }}>
            Admin Panel
          </h1>
          <p className="text-slate-400 text-sm">Enter your administrator password to continue</p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm al-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
            }}>
            {/* Top accent bar */}
            <div className="h-1 w-full"
              style={{ background: "linear-gradient(90deg, #6366f1, #7c3aed, #3b82f6)" }} />

            <div className="p-6">
              {/* Card header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
                  <ShieldCheck size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Administrator Password</h3>
                  <p className="text-xs text-slate-400">Restricted to authorized personnel only</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="Enter administrator password"
                      className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: focused
                          ? "1px solid rgba(99,102,241,0.7)"
                          : "1px solid rgba(255,255,255,0.1)",
                        boxShadow: focused
                          ? "0 0 0 3px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
                          : "inset 0 1px 0 rgba(255,255,255,0.03)",
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors"
                      style={{ color: "rgba(148,163,184,0.7)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(148,163,184,0.7)")}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm font-medium al-fade-up flex items-start gap-2"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                    <span className="mt-0.5 shrink-0">⚠</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  {loading ? "Verifying..." : "Access Admin Panel"}
                </button>
              </form>

              {/* Security notice */}
              <div className="mt-5 rounded-xl p-3.5"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    Admin access is logged and monitored. Re-authentication is required for each session.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Version footer */}
        <div className="mt-8 al-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold"
              style={{
                background: "linear-gradient(90deg, #6366f1, #7c3aed)",
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
  );
}
