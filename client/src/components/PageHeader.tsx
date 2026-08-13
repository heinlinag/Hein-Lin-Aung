import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { LogOut, User, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/manus-storage/gspp_logo_new_2db75f16.png";

interface PageHeaderProps {
  showBack?: boolean;
  backHref?: string;
}

export default function PageHeader({ showBack = true, backHref = "/" }: PageHeaderProps) {
  const { worker, logoutWorker } = useAuth();
  const [, navigate] = useLocation();
  const deactivateDevice = trpc.workers.deactivateDevice.useMutation();

  const handleLogout = () => {
    if (worker?.workerID) {
      deactivateDevice.mutate({ workerID: worker.workerID });
    }
    logoutWorker();
    navigate("/login");
  };

  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
      <div className="px-4 py-3 flex items-center gap-3 max-w-2xl mx-auto">
        {showBack && (
          <button
            onClick={() => navigate(backHref)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <img src={LOGO_URL} alt="GSPP" className="h-8 w-8 object-contain" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-sm leading-tight truncate">Stock Dash</div>
          <div className="text-xs text-gray-400 leading-tight">Stock Management System</div>
        </div>
        {worker && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 text-xs font-medium max-w-[100px] truncate">
              <User size={11} className="flex-shrink-0" />
              <span className="truncate">{worker.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
