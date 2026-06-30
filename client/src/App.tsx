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
import UsageHistory from "./pages/UsageHistory";
import Login from "./pages/Login";
import ApprovalCenter from "./pages/ApprovalCenter";
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
import { trpc } from "./lib/trpc";
import { useAuth } from "./contexts/AuthContext";


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
      <MaintenanceGuard>
      <Switch>
        {/* Public: Login page */}
        <Route path="/login" component={Login} />

        {/* Worker-protected pages (1hr session) */}
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
        <Route path="/usage-history">
          <LoginGate>
            <UsageHistory />
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

        {/* Admin-protected page (one-time per visit) */}
        <Route path="/admin">
          <LoginGate requireAdmin>
            <AdminPanel />
          </LoginGate>
        </Route>

        <Route path="/404" component={NotFound} />
        {/* Catch-all: redirect unknown paths to 404 */}
        <Route component={NotFound} />
      </Switch>
      <PWAInstallPrompt />
      </MaintenanceGuard>
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
