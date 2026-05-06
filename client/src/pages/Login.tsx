import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2, User, ShieldCheck, Eye, EyeOff, MessageCircle, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "Qwer@7090heinann";
const GSPP_LOGO = "/manus-storage/gspp-logo_988a5ce5.png";

type Tab = "worker" | "admin";
type SuccessType = "worker" | "admin" | null;

/* ── CSS keyframes injected once ─────────────────────────────────── */
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
.anim-fade-in   { animation: loginFadeIn 0.35s ease both; }
.anim-slide-l   { animation: loginSlideLeft 0.35s ease both; }
.anim-slide-r   { animation: loginSlideRight 0.35s ease both; }
.anim-success-bg   { animation: successBg 0.4s ease both; }
.anim-success-pop  { animation: successPop 0.6s cubic-bezier(.36,.07,.19,.97) both; }
.anim-success-ring { animation: successRing 1s ease-out infinite; }
.anim-success-text { animation: successFadeUp 0.5s ease 0.4s both; }
`;

/* ── Success Overlay ──────────────────────────────────────────────── */
function SuccessOverlay({ type, name }: { type: SuccessType; name: string }) {
  const isAdmin = type === "admin";
  const bg = isAdmin
    ? "from-green-600 via-emerald-500 to-teal-600"
    : "from-blue-600 via-indigo-500 to-violet-600";
  const ringColor = isAdmin ? "bg-green-300" : "bg-blue-300";
  const iconBg = isAdmin ? "bg-green-500" : "bg-blue-500";

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br ${bg} anim-success-bg`}>
      {/* Pulsing ring */}
      <div className="relative flex items-center justify-center mb-8">
        <div className={`absolute w-32 h-32 rounded-full ${ringColor} opacity-30 anim-success-ring`} />
        <div className={`absolute w-24 h-24 rounded-full ${ringColor} opacity-20`}
          style={{ animation: "successRing 1s ease-out 0.3s infinite" }} />
        <div className={`w-20 h-20 rounded-full ${iconBg} flex items-center justify-center shadow-2xl anim-success-pop`}>
          {isAdmin
            ? <Lock size={36} className="text-white" />
            : <CheckCircle2 size={36} className="text-white" />
          }
        </div>
      </div>

      {/* Text */}
      <div className="text-center px-8 anim-success-text">
        <p className="text-white/70 text-sm font-medium mb-1 uppercase tracking-widest">
          {isAdmin ? "Administrator Access Granted" : "Login Successful"}
        </p>
        <h2 className="text-white text-2xl font-bold mb-2">
          {isAdmin ? "Welcome, Admin" : `Welcome, ${name}!`}
        </h2>
        <p className="text-white/60 text-sm">
          {isAdmin ? "Redirecting to Admin Panel…" : "Redirecting to Dashboard…"}
        </p>

        {/* Progress bar */}
        <div className="mt-6 w-48 mx-auto h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full"
            style={{ animation: "loginSlideLeft 1.5s ease forwards", width: "100%" }}
          />
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

  // Inject keyframe CSS once
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

  // Determine slide direction: worker→admin = slide left, admin→worker = slide right
  const slideClass = prevTab === "worker" && tab === "admin"
    ? "anim-slide-l"
    : prevTab === "admin" && tab === "worker"
    ? "anim-slide-r"
    : "anim-fade-in";

  const handleWorkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!workerID.trim()) {
      setError("Please enter your Employee ID.");
      return;
    }
    setLoading(true);
    try {
      const workers = workersQuery.data ?? [];
      const found = workers.find(
        (w) => w.workerID.toLowerCase() === workerID.trim().toLowerCase()
      );
      if (!found) {
        setError("Employee ID not found. Please check your ID or contact Admin.");
        setLoading(false);
        return;
      }
      loginWorker(found.workerID, found.name, found.department, (found.userLevel as "1" | "1.1" | "2") ?? "2");
      notifyLogin.mutate({ title: "Employee Login", body: found.name + " (" + found.workerID + ") logged in", tag: "worker-login" });
      // Show success animation then navigate
      setSuccessName(found.name);
      setSuccessType("worker");
      setTimeout(() => {
        const pendingCount = pendingQuery.data?.length ?? 0;
        const greeting = getGreeting();
        const pendingMsg = pendingCount > 0
          ? `You have ${pendingCount} pending ${pendingCount === 1 ? "job" : "jobs"} in the Approval Center.`
          : "No pending jobs in the Approval Center.";
        toast.success(
          `${greeting}, ${found.name}! ${pendingMsg}`,
          { duration: 5000, icon: "👋" }
        );
        navigate("/");
      }, 1600);
    } catch {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (adminPassword !== ADMIN_PASSWORD) {
      setError("Incorrect password. Please try again.");
      return;
    }
    loginAdmin();
    setSuccessName("Administrator");
    setSuccessType("admin");
    setTimeout(() => {
      navigate("/admin");
    }, 1600);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Success overlay */}
      {successType && <SuccessOverlay type={successType} name={successName} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <img src={GSPP_LOGO} alt="GSPP" className="h-10 w-10 object-contain" />
        <div>
          <div className="font-bold text-gray-900 text-base leading-tight">PP4 Manual Slitter</div>
          <div className="text-xs text-gray-500">Stock Management System</div>
        </div>
      </header>

      {/* Hero */}
      <div className="gspp-gradient px-6 py-10 text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <img src={GSPP_LOGO} alt="GSPP" className="h-12 w-12 object-contain" />
        </div>
        <h1 className="text-2xl font-bold mb-1">Login Access</h1>
        <p className="text-white/80 text-sm">PP4 Manual Slitter Stock Management</p>
      </div>

      {/* Login Card */}
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">

        {/* Tab Switcher */}
        <div className="relative flex rounded-xl overflow-hidden border border-gray-200 mb-6 bg-gray-50">
          {/* Sliding indicator */}
          <div
            className="absolute top-0 bottom-0 w-1/2 rounded-xl transition-all duration-300 ease-in-out shadow-md"
            style={{
              left: tab === "worker" ? "0%" : "50%",
              background: tab === "worker"
                ? "linear-gradient(135deg, #2563eb, #4f46e5)"
                : "linear-gradient(135deg, #16a34a, #059669)",
            }}
          />
          <button
            onClick={() => switchTab("worker")}
            className={`relative z-10 flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 ${
              tab === "worker" ? "text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <User size={16} />
            Employee Login
          </button>
          <button
            onClick={() => switchTab("admin")}
            className={`relative z-10 flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 ${
              tab === "admin" ? "text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShieldCheck size={16} />
            Admin Login
          </button>
        </div>

        {/* Form panel with slide animation */}
        <div key={tabKey} className={slideClass}>
          {tab === "worker" ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Employee Login</h2>
                  <p className="text-xs text-gray-500">Session valid for 1 hour</p>
                </div>
              </div>

              <form onSubmit={handleWorkerLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={workerID}
                    onChange={(e) => setWorkerID(e.target.value)}
                    placeholder="Enter your Employee ID"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 anim-fade-in">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || workersQuery.isLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading || workersQuery.isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  Login with Employee ID
                </button>
              </form>

              {/* Admin Contact Card */}
              <div className="mt-5 rounded-xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-semibold text-green-800 mb-3">Don't have an Employee ID? Contact your Administrator.</p>
                <a
                  href="https://wa.me/601159225408"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 active:scale-95 text-white text-sm font-semibold transition-all"
                >
                  <MessageCircle size={16} />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Admin Login</h2>
                  <p className="text-xs text-gray-500">Password required every visit</p>
                </div>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Administrator Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 anim-fade-in">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} />
                  Login as Administrator
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Version Footer */}
      <div className="mt-6 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
          <span className="text-xs font-semibold text-gray-600">Stock Management System</span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs font-mono font-bold text-primary">v2.5.0</span>
        </div>
      </div>
    </div>
  );
}
