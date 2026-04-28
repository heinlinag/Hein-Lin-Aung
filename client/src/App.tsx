import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import LoginGate from "./components/LoginGate";
import Home from "./pages/Home";
import SubmitOrder from "./pages/SubmitOrder";
import StockHistory from "./pages/StockHistory";
import AdminPanel from "./pages/AdminPanel";
import UsageHistory from "./pages/UsageHistory";
import Login from "./pages/Login";

function Router() {
  return (
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

      {/* Admin-protected page (one-time per visit) */}
      <Route path="/admin">
        <LoginGate requireAdmin>
          <AdminPanel />
        </LoginGate>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
