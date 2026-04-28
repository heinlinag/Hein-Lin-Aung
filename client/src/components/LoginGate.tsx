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
 * - requireAdmin=true: requires admin session (one-time per visit)
 */
export default function LoginGate({ children, requireAdmin = false }: LoginGateProps) {
  const { isWorkerLoggedIn, isAdminAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (requireAdmin) {
      // Admin pages: require admin session (one-time per visit)
      if (!isAdminAuthenticated) {
        navigate("/login?tab=admin");
      }
    } else {
      // All other pages: require worker login (1hr session)
      if (!isWorkerLoggedIn()) {
        navigate("/login");
      }
    }
  }, [requireAdmin, isAdminAuthenticated, isWorkerLoggedIn, navigate]);

  if (requireAdmin && !isAdminAuthenticated) return null;
  if (!requireAdmin && !isWorkerLoggedIn()) return null;

  return <>{children}</>;
}
