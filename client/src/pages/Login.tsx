import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2, User, ShieldCheck, Eye, EyeOff, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "Qwer@7090heinann";
const GSPP_LOGO = "/manus-storage/gspp-logo_988a5ce5.png";

type Tab = "worker" | "admin";

export default function Login() {
  const [tab, setTab] = useState<Tab>("worker");
  const [workerID, setWorkerID] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginWorker, loginAdmin } = useAuth();
  const [, navigate] = useLocation();

  const workersQuery = trpc.workers.list.useQuery();
  const notifyLogin = trpc.push.sendToAll.useMutation();

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
      loginWorker(found.workerID, found.name, found.department, (found.userLevel as "1" | "2") ?? "2");
      notifyLogin.mutate({ title: "Employee Login", body: found.name + " (" + found.workerID + ") logged in", tag: "worker-login" });
      toast.success(
        `Welcome, ${found.name}! You are now logged in to access the PP4 Slitter Stock Board.`,
        { duration: 4000, icon: "👋" }
      );
      navigate("/");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
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
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
          <button
            onClick={() => { setTab("worker"); setError(""); }}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              tab === "worker"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <User size={16} />
            Employee Login
          </button>
          <button
            onClick={() => { setTab("admin"); setError(""); }}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              tab === "admin"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <ShieldCheck size={16} />
            Admin Login
          </button>
        </div>

        {/* Employee Login Form */}
        {tab === "worker" && (
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
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || workersQuery.isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">HEiNANN</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone size={11} />
                    01159225408
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/959159225408"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
              >
                <MessageCircle size={16} />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Admin Login Form */}
        {tab === "admin" && (
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
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} />
                Login as Administrator
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
