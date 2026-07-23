import React, { createContext, useContext, useEffect, useState } from "react";
const WORKER_SESSION_KEY = "gspp_worker_session";
const ADMIN_SESSION_KEY = "gspp_admin_session";
const ADMIN_PW_KEY = "gspp_admin_pw";
const SESSION_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

export type WorkerPermissions = {
  submitOrder: boolean;
  viewStock: boolean;
  nprmModifyOrder: boolean;
  customerSample: boolean;
  qrScanner: boolean;
  viewChat: boolean;
  viewNotifications: boolean;
};

interface WorkerSession {
  workerID: string;
  name: string;
  department: string;
  userLevel: "1" | "1.1" | "2";
  expiresAt: number;
  deviceToken?: string;
  permissions?: WorkerPermissions | null;
}

interface AuthState {
  worker: WorkerSession | null;
  isAdminAuthenticated: boolean;
  loginWorker: (
    workerID: string,
    name: string,
    department: string,
    userLevel: "1" | "1.1" | "2",
    deviceToken?: string,
    permissions?: WorkerPermissions | null
  ) => void;
  loginAdmin: (password?: string) => void;
  logoutWorker: () => void;
  logoutAdmin: () => void;
  isWorkerLoggedIn: () => boolean;
  getAdminPassword: () => string;
  hasPermission: (key: keyof WorkerPermissions) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [worker, setWorker] = useState<WorkerSession | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

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
    try {
      const adminFlag = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (adminFlag === "true") {
        setIsAdminAuthenticated(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const loginWorker = (
    workerID: string,
    name: string,
    department: string,
    userLevel: "1" | "1.1" | "2",
    deviceToken?: string,
    permissions?: WorkerPermissions | null
  ) => {
    const session: WorkerSession = {
      workerID,
      name,
      department,
      userLevel,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      deviceToken,
      permissions: permissions ?? null,
    };
    localStorage.setItem(WORKER_SESSION_KEY, JSON.stringify(session));
    setWorker(session);
  };

  const loginAdmin = (password?: string) => {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    if (password) sessionStorage.setItem(ADMIN_PW_KEY, password);
    setIsAdminAuthenticated(true);
  };

  const logoutWorker = () => {
    localStorage.removeItem(WORKER_SESSION_KEY);
    setWorker(null);
  };

  const logoutAdmin = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_PW_KEY);
    setIsAdminAuthenticated(false);
  };

  const isWorkerLoggedIn = () => worker !== null && worker.expiresAt > Date.now();

  const getAdminPassword = () => sessionStorage.getItem(ADMIN_PW_KEY) ?? "";

  const hasPermission = (key: keyof WorkerPermissions): boolean => {
    if (!worker) return false;
    if (worker.permissions === null || worker.permissions === undefined) return false;
    return worker.permissions[key] === true;
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
        getAdminPassword,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
