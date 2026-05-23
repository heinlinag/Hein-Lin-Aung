import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { LogOut, User, Briefcase, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Profile() {
  const { worker, logoutWorker } = useAuth();
  const [, setLocation] = useLocation();

  if (!worker) {
    setLocation("/");
    return null;
  }

  const handleLogout = () => {
    logoutWorker();
    setLocation("/");
  };

  const levelNumber = worker.userLevel === "2" ? 2 : 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">View and manage your account information</p>
        </div>

        <Card className="p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
              <User size={32} className="text-primary" />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">{worker.name}</h2>
              <p className="text-muted-foreground mb-4">{worker.department}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Hash size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Employee ID</p>
                    <p className="font-semibold text-foreground">{worker.workerID}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Briefcase size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-semibold text-foreground">{worker.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <User size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Access Level</p>
                    <p className="font-semibold text-foreground">Level {levelNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Briefcase size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-semibold text-foreground capitalize">
                      {levelNumber === 2 ? "Approver" : "Employee"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-foreground mb-2">Access Level Information</h3>
          <p className="text-sm text-muted-foreground">
            {levelNumber === 2
              ? "You have Level 2 access, which allows you to approve pending requests from Level 1 users."
              : "You have Level 1 access. Your requests for order modifications require approval from Level 2 users."}
          </p>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="flex-1"
          >
            Back to Home
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
