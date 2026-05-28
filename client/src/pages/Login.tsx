import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2, User, ShieldCheck, Eye, EyeOff, MessageCircle, CheckCircle2, Lock, Fingerprint, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "Qwer@7090heinann";
const GSPP_LOGO = "/manus-storage/gspp_logo_icon_486e662b.png";
const APP_VERSION = "v3.0.0";

type Tab = "worker" | "admin";
type SuccessType = "worker" | "admin" | null;

const ANIM_STYLES = `
@keyframes loginFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes loginSlideLeft {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes loginSlideRight {
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes successPop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  80%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}
@keyframes successRing {
  0%   { transform: scale(0.6); opacity: 0; }
  50%  { transform: scale(1.3); opacity: 0.4; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes successFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes successBg {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes floatParticle {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.7; }
}
.anim-fade-in   { animation: loginFadeIn 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
.anim-slide-l   { animation: loginSlideLeft 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
.anim-slide-r   { animation: loginSlideRight 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
.anim-success-bg   { animation: successBg 0.4s ease both; }
.anim-success-pop  { animation: successPop 0.6s cubic-bezier(.36,.07,.19,.97) both; }
.anim-success-ring { animation: successRing 1s ease-out infinite; }
.anim-success-text { animation: successFadeUp 0.5s ease 0.4s both; }
.gradient-animate { background-size: 200% 200%; animation: gradientShift 8s ease infinite; }
`;

function SuccessOverlay({ type, name }: { type: SuccessType; name: string }) {
  const isAdmin = type === "admin";
  const bg = isAdmin
    ? "from-emerald-600 via-green-500 to-teal-600"
    : "from-blue-600 via-indigo-500 to-violet-600";
  const ringColor = isAdmin ? "bg-green-300" : "bg-blue-300";
  const iconBg = isAdmin ? "bg-gradient-to-br from-green-400 to-emerald-600" : "bg-gradient-to-br from-blue-400 to-indigo-600";

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br ${bg} anim-success-bg`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatParticle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>
      <div className="relative flex items-center justify-center mb-8">
        <div className={`absolute w-36 h-36 rounded-full ${ringColor} opacity-20 anim-success-ring`} />
        <div className={`absolute w-28 h-28 rounded-full ${ringColor} opacity-15`}
          style={{ animation: "successRing 1s ease-out 0.3s infinite" }} />
        <div className={`w-24 h-24 rounded-full ${iconBg} flex items-center justify-center shadow-2xl anim-success-pop`}>
          {isAdmin
            ? <Lock size={40} className="text-white drop-shadow-lg" />
            : <CheckCircle2 size={40} className="text-white drop-shadow-lg" />
          }
        </div>
      </div>
      <div className="text-center px-8 anim-success-text">
        <p className="text-white/70 text-xs font-semibold mb-2 uppercase tracking-[0.2em]">
          {isAdmin ? "Administrator Access Granted" : "Login Successful"}
        </p>
        <h2 className="text-white text-3xl font-bold mb-2" style={{ fontFamily: "Lora, serif" }}>
          {isAdmin ? "Welcome, Admin" : `Welcome, ${name}!`}
        </h2>
        <p className="text-white/60 text-sm">
          {isAdmin ? "Redirecting to Admin Panel..." : "Redirecting to Dashboard..."}
        </p>
        <div className="mt-8 w-56 mx-auto h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/90 rounded-full" style={{ animation: "loginSlideLeft 1.5s ease forwards", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [tab, setTab] = useState<Tab>("worker");
  const [prevTab, setPrevTab] = useState<Tab>("worker");
  const [tabKey, setTabKey] = useState(0);
  const [workerID, setWorkerID] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>(null);
  const [successName, setSuccessName] = useState("");
  const { loginWorker, loginAdmin } = useAuth();
  const [, navigate] = useLocation();
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = ANIM_STYLES;
    document.head.appendChild(el);
  }, []);

  const workersQuery = trpc.workers.list.useQuery();
  const pendingQuery = trpc.pendingRequests.list.useQuery({ status: "pending" });
  const notifyLogin = trpc.push.sendToAll.useMutation();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const switchTab = (t: Tab) => {
    if (t === tab) return;
    setPrevTab(tab);
    setTab(t);
    setTabKey(k => k + 1);
    setError("");
  };

  const slideClass = prevTab === "worker" && tab === "admin"
    ? "anim-slide-l"
    : prevTab === "admin" && tab === "worker"
    ? "anim-slide-r"
    : "anim-fade-in";

  const handleWorkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!workerID.trim()) { setError("Please enter your Employee ID."); return; }
    setLoading(true);
    try {
      const workers = workersQuery.data ?? [];
      const found = workers.find((w) => w.workerID.toLowerCase() === workerID.trim().toLowerCase());
      if (!found) { setError("Employee ID not found. Please check your ID or contact Admin."); setLoading(false); return; }
      loginWorker(found.workerID, found.name, found.department, (found.userLevel as "1" | "1.1" | "2") ?? "2");
      notifyLogin.mutate({ title: "Employee Login", body: found.name + " (" + found.workerID + ") logged in", tag: "worker-login" });
      setSuccessName(found.name);
      setSuccessType("worker");
      setTimeout(() => {
        const pendingCount = pendingQuery.data?.length ?? 0;
        const greeting = getGreeting();
        const pendingMsg = pendingCount > 0 ? `You have ${pendingCount} pending ${pendingCount === 1 ? "job" : "jobs"} in the Approval Center.` : "No pending jobs in the Approval Center.";
        toast.success(`${greeting}, ${found.name}! ${pendingMsg}`, { duration: 5000, icon: "\ud83d\udc4b" });
        navigate("/");
      }, 1600);
    } catch { setError("Login failed. Please try again."); setLoading(false); }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (adminPassword !== ADMIN_PASSWORD) { setError("Incorrect password. Please try again."); return; }
    loginAdmin();
    setSuccessName("Administrator");
    setSuccessType("admin");
    setTimeout(() => { navigate("/admin"); }, 1600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col relative overflow-hidden">
      {successType && <SuccessOverlay type={successType} name={successName} />}

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
      <div className="relative z-10 gspp-gradient gradient-animate px-6 py-12 text-center text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-8 w-16 h-16 border border-white/10 rounded-full" style={{ animation: "floatParticle 4s ease-in-out infinite" }} />
          <div className="absolute bottom-4 right-12 w-10 h-10 border border-white/10 rounded-lg rotate-45" style={{ animation: "floatParticle 5s ease-in-out 1s infinite" }} />
        </div>
        <div className="relative">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-xl">
            <img src={GSPP_LOGO} alt="GSPP" className="h-14 w-14 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5" style={{ fontFamily: "Lora, serif" }}>Login Access</h1>
          <p className="text-white/75 text-sm font-medium">Secure authentication portal</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 flex-1 px-4 py-6 max-w-md mx-auto w-full">
        {/* Tab Switcher */}
        <div className="relative flex rounded-2xl overflow-hidden border border-gray-200/80 mb-6 bg-white/60 backdrop-blur-sm shadow-sm p-1">
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-400 shadow-lg"
            style={{
              left: tab === "worker" ? "4px" : "calc(50%)",
              transitionTimingFunction: "cubic-bezier(0.22, 0.61, 0.36, 1)",
              background: tab === "worker" ? "linear-gradient(135deg, #2563eb, #4f46e5)" : "linear-gradient(135deg, #059669, #047857)",
            }}
          />
          <button onClick={() => switchTab("worker")} className={`relative z-10 flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-300 rounded-xl ${tab === "worker" ? "text-white" : "text-gray-500 hover:text-gray-700"}`}>
            <User size={16} /> Employee
          </button>
          <button onClick={() => switchTab("admin")} className={`relative z-10 flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-300 rounded-xl ${tab === "admin" ? "text-white" : "text-gray-500 hover:text-gray-700"}`}>
            <ShieldCheck size={16} /> Administrator
          </button>
        </div>

        {/* Form panel */}
        <div key={tabKey} className={slideClass}>
          {tab === "worker" ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-blue-500/5 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Fingerprint size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Employee Login</h3>
                  <p className="text-xs text-gray-500">Enter your Employee ID to continue</p>
                </div>
              </div>
              <form onSubmit={handleWorkerLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Employee ID</label>
                  <div className="relative">
                    <input type="text" value={workerID} onChange={(e) => setWorkerID(e.target.value)} placeholder="Enter your Employee ID" className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 text-sm font-medium focus:outline-none focus:ring-0 focus:border-blue-400 bg-gray-50/50 hover:bg-white transition-all placeholder:text-gray-300" autoFocus />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2"><User size={16} className="text-gray-300" /></div>
                  </div>
                </div>
                {error && (<div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium anim-fade-in flex items-start gap-2"><span className="text-red-400 mt-0.5">!</span>{error}</div>)}
                <button type="submit" disabled={loading || workersQuery.isLoading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 border border-blue-500/20">
                  {loading || workersQuery.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {loading ? "Verifying..." : "Login"}
                </button>
              </form>
              <div className="mt-5 rounded-xl border border-green-100 bg-gradient-to-br from-green-50/80 to-emerald-50/80 p-4">
                <p className="text-xs font-semibold text-green-800 mb-3">Need an Employee ID? Contact Administrator.</p>
                <a href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-md shadow-green-500/20">
                  <MessageCircle size={16} /> Chat on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-green-500/5 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                  <ShieldCheck size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Admin Access</h3>
                  <p className="text-xs text-gray-500">Restricted to authorized personnel</p>
                </div>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Enter admin password" className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-100 text-sm font-medium focus:outline-none focus:ring-0 focus:border-green-400 bg-gray-50/50 hover:bg-white transition-all placeholder:text-gray-300" autoFocus />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (<div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium anim-fade-in flex items-start gap-2"><span className="text-red-400 mt-0.5">!</span>{error}</div>)}
                <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 border border-green-500/20">
                  <Lock size={16} /> Access Admin Panel
                </button>
              </form>
              <div className="mt-5 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-yellow-50/80 p-3.5">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">Admin access is logged and monitored. Re-authentication required for each session.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Version Footer */}
      <div className="relative z-10 pb-6 pt-2 text-center">
        <div className="inline-flex items-center gap-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-full px-4 py-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-gray-600">Stock Management</span>
          <span className="text-[10px] text-gray-300">|</span>
          <span className="text-xs font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}
