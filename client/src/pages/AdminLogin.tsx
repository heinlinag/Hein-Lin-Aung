import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2, ShieldCheck, Eye, EyeOff, Lock, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";

const GSPP_LOGO = "/manus-storage/gspp_logo_new_2db75f16.png";
const APP_VERSION = "Web App Version 3.2.0";

const ANIM_STYLES = `
@keyframes adminFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes adminSuccessPop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  80%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}
@keyframes adminSuccessRing {
  0%   { transform: scale(0.6); opacity: 0; }
  50%  { transform: scale(1.3); opacity: 0.4; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes adminSuccessFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes adminSuccessBg {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes adminGradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes adminFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.7; }
}
.admin-fade-in   { animation: adminFadeIn 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
.admin-success-bg   { animation: adminSuccessBg 0.4s ease both; }
.admin-success-pop  { animation: adminSuccessPop 0.6s cubic-bezier(.36,.07,.19,.97) both; }
.admin-success-ring { animation: adminSuccessRing 1s ease-out infinite; }
.admin-success-text { animation: adminSuccessFadeUp 0.5s ease 0.4s both; }
.admin-gradient { background: linear-gradient(135deg, #1a7fd4 0%, #1db87e 100%); background-size: 200% 200%; animation: adminGradientShift 8s ease infinite; }
`;

function SuccessOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-green-500 to-teal-600 admin-success-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              left: `${(i * 37 + 5) % 100}%`,
              top: `${(i * 53 + 10) % 100}%`,
              animation: `adminFloat ${2 + (i % 3)}s ease-in-out ${(i % 4) * 0.5}s infinite`,
            }}
          />
        ))}
      </div>
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-36 h-36 rounded-full bg-green-300 opacity-20 admin-success-ring" />
        <div className="absolute w-28 h-28 rounded-full bg-green-300 opacity-15"
          style={{ animation: "adminSuccessRing 1s ease-out 0.3s infinite" }} />
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl admin-success-pop">
          <Lock size={40} className="text-white drop-shadow-lg" />
        </div>
      </div>
      <div className="text-center px-8 admin-success-text">
        <p className="text-white/70 text-xs font-semibold mb-2 uppercase tracking-[0.2em]">Administrator Access Granted</p>
        <h2 className="text-white text-3xl font-bold mb-2" style={{ fontFamily: "Lora, serif" }}>Welcome, Admin</h2>
        <p className="text-white/60 text-sm">Redirecting to Admin Panel...</p>
        <div className="mt-8 w-56 mx-auto h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/90 rounded-full" style={{ animation: "adminFadeIn 1.5s ease forwards", width: "100%" }} />
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
  const { loginAdmin } = useAuth();
  const [, navigate] = useLocation();
  const styleInjected = useRef(false);
  const verifyMutation = trpc.system.verifyAdminPassword.useMutation();

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = ANIM_STYLES;
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
      setTimeout(() => { navigate("/admin"); }, 1600);
    } catch {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col relative overflow-hidden">
      {success && <SuccessOverlay />}

      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-green-200/20 to-teal-200/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-white/50 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-100/50">
          <img src={GSPP_LOGO} alt="GSPP" className="h-7 w-7 object-contain" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-gray-900 text-sm leading-tight">PP4 Manual Slitter</div>
          <div className="text-[10px] text-gray-500 font-medium">Stock Management System</div>
        </div>
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] font-semibold text-green-700">Online</span>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 admin-gradient px-6 py-12 text-center text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-8 w-16 h-16 border border-white/10 rounded-full" style={{ animation: "adminFloat 4s ease-in-out infinite" }} />
          <div className="absolute bottom-4 right-12 w-10 h-10 border border-white/10 rounded-lg rotate-45" style={{ animation: "adminFloat 5s ease-in-out 1s infinite" }} />
        </div>
        <div className="relative">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-xl">
            <ShieldAlert size={36} className="text-white drop-shadow-lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5" style={{ fontFamily: "Lora, serif" }}>Login Access</h1>
          <p className="text-white/75 text-sm font-semibold tracking-wide">Admin Panel</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 flex-1 px-4 py-8 max-w-md mx-auto w-full admin-fade-in">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-green-500/5 p-6">
          {/* Card header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Administrator Password</h3>
              <p className="text-xs text-gray-500">Restricted to authorized personnel only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-100 text-sm font-medium focus:outline-none focus:ring-0 focus:border-green-400 bg-gray-50/50 hover:bg-white transition-all placeholder:text-gray-300"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium admin-fade-in flex items-start gap-2">
                <span className="text-red-400 mt-0.5">!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 border border-green-500/20 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {loading ? "Verifying..." : "Access Admin Panel"}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-5 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-yellow-50/80 p-3.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Admin access is logged and monitored. Re-authentication is required for each session.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Version Footer */}
      <div className="relative z-10 pb-6 pt-2 text-center">
        <div className="inline-flex items-center gap-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-full px-4 py-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}
