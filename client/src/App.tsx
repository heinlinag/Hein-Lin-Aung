import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
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
import UserProfile from "./pages/UserProfile";
import MaintenancePage from "./pages/Maintenance";
import AdminLogin from "./pages/AdminLogin";
import { trpc } from "./lib/trpc";
import { useAuth } from "./contexts/AuthContext";
import { getStockDashCanonicalUrl, getStockDashPageMetadata } from "@shared/stockDashPageMetadata";

function setMetaAttribute(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonicalUrl(href: string) {
  let element = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

function BrowserRouteExperience() {
  const [location] = useLocation();
  const previousLocation = useRef(location);
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const metadata = getStockDashPageMetadata(location);
    const canonicalUrl = getStockDashCanonicalUrl(location);
    document.title = metadata.title;
    setMetaAttribute("name", "description", metadata.description);
    setMetaAttribute("name", "robots", metadata.indexable ? "index,follow" : "noindex,nofollow");
    setMetaAttribute("property", "og:site_name", "Stock Dash");
    setMetaAttribute("property", "og:type", "website");
    setMetaAttribute("property", "og:title", metadata.title);
    setMetaAttribute("property", "og:description", metadata.description);
    setMetaAttribute("property", "og:url", canonicalUrl);
    setMetaAttribute("property", "og:image", "https://stockdash.click/icon-512.png");
    setMetaAttribute("name", "twitter:card", "summary");
    setMetaAttribute("name", "twitter:title", metadata.title);
    setMetaAttribute("name", "twitter:description", metadata.description);
    setMetaAttribute("name", "twitter:image", "https://stockdash.click/icon-512.png");
    setCanonicalUrl(canonicalUrl);
  }, [location]);

  useEffect(() => {
    if (previousLocation.current === location) return;
    previousLocation.current = location;
    setIsNavigating(true);
    setProgress(18);
    const progressFrame = window.requestAnimationFrame(() => setProgress(78));
    const completeTimer = window.setTimeout(() => setProgress(100), 220);
    const hideTimer = window.setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 500);

    return () => {
      window.cancelAnimationFrame(progressFrame);
      window.clearTimeout(completeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [location]);

  return (
    <div
      aria-live="polite"
      aria-label={isNavigating ? "Loading page" : undefined}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[200] transition-opacity duration-200 ${isNavigating ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className="h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 shadow-[0_2px_12px_rgba(79,70,229,0.45)] transition-transform duration-300 ease-out"
        style={{ transform: `scaleX(${progress / 100})`, transformOrigin: "left" }}
      />
    </div>
  );
}

/** Admin route: shows AdminLogin password screen when not authenticated, AdminPanel when authenticated */
function AdminRoute() {
  const { isAdminAuthenticated } = useAuth();
  if (!isAdminAuthenticated) return <AdminLogin />;
  return <AdminPanel />;
}

/** Admin sub-route: /admin/:tab — also protected by AdminRoute auth */
function AdminTabRoute() {
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
              <Route path="/submit-order/ai-scanner">
                <LoginGate>
                  <SubmitOrder defaultMode="scanner" />
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
              <Route path="/user-profile">
                <LoginGate>
                  <UserProfile />
                </LoginGate>
              </Route>
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
            <BrowserRouteExperience />
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
            {/* Admin sub-routes: /admin/workers, /admin/orders, etc. */}
            <Route path="/admin/:tab">
              <AdminTabRoute />
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
