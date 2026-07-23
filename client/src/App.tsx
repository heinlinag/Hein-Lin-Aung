import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import LoginGate from "./components/LoginGate";
import GeoGuard from "./components/GeoRestricted";
import Home from "./pages/Home";
import SubmitOrder from "./pages/SubmitOrder";
import StockHistory from "./pages/StockHistory";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import ApprovalCenter from "./pages/ApprovalCenter";
import CustomerSample from "./pages/CustomerSample";
import Documentation from "./pages/Documentation";
import SystemStatus from "./pages/SystemStatus";
import FAQ from "./pages/FAQ";
import HelpCenter from "./pages/HelpCenter";
import QRScanner from "./pages/QRScanner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PublicOrderCard from "./pages/PublicOrderCard";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import MaintenancePage from "./pages/Maintenance";
import AdminLogin from "./pages/AdminLogin";
import { trpc } from "./lib/trpc";
import { useAuth } from "./contexts/AuthContext";
import type { WorkerPermissions } from "./contexts/AuthContext";
import { ShieldOff, MessageCircle } from "lucide-react";

/** Permission gate: shows access-denied screen when worker lacks required permission */
function PermissionGate({ permission, children }: { permission: keyof WorkerPermissions; children: React.ReactNode }) {
  const { hasPermission, worker } = useAuth();
  const ADMIN_WHATSAPP = import.meta.env.VITE_ADMIN_WHATSAPP ?? "";
  if (!worker) return <>{children}</>; // LoginGate handles unauthenticated
  if (hasPermission(permission)) return <>{children}</>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <ShieldOff size={32} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to access this page. Please contact your Administrator to update your account.</p>
        {ADMIN_WHATSAPP && (
          <a
            href={`https://wa.me/${ADMIN_WHATSAPP.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
          >
            <MessageCircle size={16} />
            Contact Administrator
          </a>
        )}
      </div>
    </div>
  );
}


/** Admin route: shows AdminLogin password screen when not authenticated, AdminPanel when authenticated */
function AdminRoute() {
  const { isAdminAuthenticated } = useAuth();
  if (!isAdminAuthenticated) return <AdminLogin />;
  return <AdminPanel />;
}

/** Maintenance guard — shows maintenance page when mode is ON, except for admins */
function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isAdminAuthenticated, worker } = useAuth();
  const { data } = trpc.system.getMaintenanceStatus.useQuery(undefined, {
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  // Only bypass maintenance if:
  // - User is in admin session AND has no worker session (pure admin access)
  // Workers (Employee ID login) must always see the maintenance page when it is ON
  const isAdminOnly = isAdminAuthenticated && !worker;

  if (data?.maintenanceMode && !isAdminOnly) {
    return <MaintenancePage message={data.maintenanceMessage || undefined} />;
  }

  return <>{children}</>;
}

/** Routes that require geo-restriction (MY/MM only) */
function GeoRestrictedRouter() {
  return (
    <GeoGuard>
      <Switch>
        {/* All other routes: wrapped in MaintenanceGuard */}
        <Route>
          <MaintenanceGuard>
            <Switch>
              {/* Public: Login page */}
              <Route path="/login" component={Login} />

              {/* Worker-protected pages */}
              <Route path="/">
                <LoginGate>
                  <Home />
                </LoginGate>
              </Route>
              <Route path="/submit-order">
                <LoginGate>
                  <SubmitOrder />
                </LoginGate>
              </Route>
              <Route path="/stock-history">
                <LoginGate>
                  <StockHistory />
                </LoginGate>
              </Route>
              {/* Customer Sample */}
              <Route path="/customer-sample">
                <LoginGate>
                  <CustomerSample />
                </LoginGate>
              </Route>

              {/* Approval Center: Level 2 workers only */}
              <Route path="/approval-center">
                <LoginGate>
                  <ApprovalCenter />
                </LoginGate>
              </Route>

              {/* QR Scanner */}
              <Route path="/qr-scanner">
                <LoginGate>
                  <QRScanner />
                </LoginGate>
              </Route>

              {/* Direct Messages */}
              <Route path="/notifications" component={Notifications} />
              <Route path="/chat">
                <LoginGate>
                  <Chat />
                </LoginGate>
              </Route>

              {/* Public: Documentation */}
              <Route path="/docs" component={Documentation} />

              {/* Public: FAQ */}
              <Route path="/faq" component={FAQ} />

              {/* Public: Help Center */}
              <Route path="/help" component={HelpCenter} />

              {/* Public: System Status */}
              <Route path="/status" component={SystemStatus} />

              <Route path="/404" component={NotFound} />
              {/* Catch-all: redirect unknown paths to 404 */}
              <Route component={NotFound} />
            </Switch>
            <PWAInstallPrompt />
          </MaintenanceGuard>
        </Route>
      </Switch>
    </GeoGuard>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            {/*
              Top-level Switch: public order card routes bypass GeoGuard entirely
              so anyone worldwide can scan a QR code and view order details.
              All other routes go through GeoGuard (MY/MM only).
            */}
            <Switch>
              {/* Public worldwide: Order Card by Tracking ID — no login, no geo restriction */}
              <Route path="/check.qr/:trackingId" component={PublicOrderCard} />
              {/* Admin Panel: worldwide access, bypasses GeoGuard and MaintenanceGuard */}
              {/* Shows AdminLogin password screen when not authenticated, AdminPanel when authenticated */}
              <Route path="/admin">
                <AdminRoute />
              </Route>
              {/* Everything else: geo-restricted to MY/MM */}
              <Route>
                <GeoRestrictedRouter />
              </Route>
            </Switch>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
