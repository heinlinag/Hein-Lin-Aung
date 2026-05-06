import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface LoginGateProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * LoginGate wraps pages to enforce authentication.
 * - requireAdmin=false: requires worker login (1hr session)
 * - requireAdmin=true: requires admin session (one-time per visit), Level 2 only
 */
export default function LoginGate({ children, requireAdmin = false }: LoginGateProps) {
  const { isWorkerLoggedIn, isAdminAuthenticated, worker } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (requireAdmin) {
      // Admin pages: Level 2 only + admin session required
      const level = worker?.userLevel;
      if (level === "1" || level === "1.1") {
        // Non-Level-2 workers cannot access admin panel — redirect to home
        navigate("/");
        return;
      }
      if (!isAdminAuthenticated) {
        navigate("/login?tab=admin");
      }
    } else {
      // All other pages: require worker login (1hr session)
      if (!isWorkerLoggedIn()) {
        navigate("/login");
      }
    }
  }, [requireAdmin, isAdminAuthenticated, isWorkerLoggedIn, worker, navigate]);

  if (requireAdmin) {
    const level = worker?.userLevel;
    if (level === "1" || level === "1.1") return null;
    if (!isAdminAuthenticated) return null;
  }
  if (!requireAdmin && !isWorkerLoggedIn()) return null;

  return <>{children}</>;
}
