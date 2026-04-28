import React, { createContext, useContext, useEffect, useState } from "react";

const WORKER_SESSION_KEY = "gspp_worker_session";
const ADMIN_SESSION_KEY = "gspp_admin_session"; // sessionStorage = one-time per tab/visit
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface WorkerSession {
  workerID: string;
  name: string;
  department: string;
  userLevel: "1" | "2";
  expiresAt: number;
}

interface AuthState {
  worker: WorkerSession | null;
  isAdminAuthenticated: boolean;
  loginWorker: (workerID: string, name: string, department: string, userLevel: "1" | "2") => void;
  loginAdmin: () => void;
  logoutWorker: () => void;
  logoutAdmin: () => void;
  isWorkerLoggedIn: () => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [worker, setWorker] = useState<WorkerSession | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Load worker session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WORKER_SESSION_KEY);
      if (stored) {
        const session: WorkerSession = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          setWorker(session);
        } else {
          localStorage.removeItem(WORKER_SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(WORKER_SESSION_KEY);
    }

    // Admin session: sessionStorage (cleared when tab/browser closes)
    try {
      const adminFlag = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (adminFlag === "true") {
        setIsAdminAuthenticated(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const loginWorker = (workerID: string, name: string, department: string, userLevel: "1" | "2" = "2") => {
    const session: WorkerSession = {
      workerID,
      name,
      department,
      userLevel,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    localStorage.setItem(WORKER_SESSION_KEY, JSON.stringify(session));
    setWorker(session);
  };

  const loginAdmin = () => {
    // One-time per session (sessionStorage cleared on tab close/refresh)
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    setIsAdminAuthenticated(true);
  };

  const logoutWorker = () => {
    localStorage.removeItem(WORKER_SESSION_KEY);
    setWorker(null);
  };

  const logoutAdmin = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuthenticated(false);
  };

  const isWorkerLoggedIn = () => {
    if (!worker) return false;
    if (worker.expiresAt <= Date.now()) {
      logoutWorker();
      return false;
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        worker,
        isAdminAuthenticated,
        loginWorker,
        loginAdmin,
        logoutWorker,
        logoutAdmin,
        isWorkerLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
