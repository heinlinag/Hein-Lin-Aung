import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { ArrowLeft, LogOut, User, IdCard, Building2, Shield, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Profile() {
  const { worker, logoutWorker } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutWorker();
    navigate("/login");
  };

  if (!worker) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const userLevel = worker.userLevel;
  const levelInfo = {
    "1": { text: "Level 1", bg: "bg-blue-100", fg: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
    "2": { text: "Level 2", bg: "bg-purple-100", fg: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
  };
  const lv = levelInfo[userLevel as keyof typeof levelInfo];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">User Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
        {/* Profile Header Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{worker.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{worker.workerID}</p>
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${lv.badge}`}>
              {lv.text}
            </span>
          </div>
        </Card>

        {/* Information Cards */}
        <div className="space-y-3">
          {/* Employee ID */}
          <Card className="p-4 border-blue-200/50 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <IdCard size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Employee ID</p>
                <p className="text-base font-bold text-foreground mt-1 break-all">{worker.workerID}</p>
              </div>
            </div>
          </Card>

          {/* Department */}
          <Card className="p-4 border-blue-200/50 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Department</p>
                <p className="text-base font-bold text-foreground mt-1">{worker.department || "—"}</p>
              </div>
            </div>
          </Card>

          {/* Access Level */}
          <Card className="p-4 border-blue-200/50 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Shield size={18} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Access Level</p>
                <p className="text-base font-bold text-foreground mt-1">{lv.text}</p>
              </div>
            </div>
          </Card>

          {/* Email */}

        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-3 fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full h-12 rounded-lg font-semibold"
          >
            Back to Home
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
