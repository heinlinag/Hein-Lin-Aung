import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ContactMessagesTab } from "@/components/ContactMessagesTab";
import { AnnouncementsTab } from "@/components/AnnouncementsTab";
import { SitemapCiStatusBadge } from "@/components/SitemapCiStatusBadge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Lock, Plus, Trash2, RefreshCw, Loader2, Users, Package, History, ClipboardList, CheckCircle2, XCircle, Clock, FileSpreadsheet, TrendingUp, AlertTriangle, Inbox, Pencil, Zap, LogOut, Megaphone, Wrench, ShieldAlert, Power, Settings2, KeyRound, Eye, EyeOff, CalendarClock, Sparkles, Ban, Calendar, Bell, Send, BellRing, Sun, Moon, Monitor, Shield, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LOGO_URL = "/manus-storage/gspp_logo_new_2db75f16.png";

/** Keeps critical Admin dialogs outside mobile layout/compositing layers. */
function StableAdminModalLayer({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="admin-light fixed inset-0 z-[500] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-slate-950/55 p-4 pb-[max(5rem,calc(4rem+env(safe-area-inset-bottom)))]"
      style={{ isolation: "isolate", WebkitTransform: "translateZ(0)", transform: "translateZ(0)" }}
    >
      {children}
    </div>,
    document.body,
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const changePassword = trpc.system.changeAdminPassword.useMutation({
    onSuccess: (_, variables) => {
      setSuccess("Password changed successfully! Please use the new password next time you log in.");
      // Update stored password in sessionStorage before clearing state
      try { sessionStorage.setItem("gspp_admin_pw", variables.newPassword); } catch { /* ignore */ }
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setError("");
    },
    onError: (err) => {
      setError(err.message || "Failed to change password.");
      setSuccess("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!currentPw.trim()) { setError("Current password is required."); return; }
    if (newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("New passwords do not match."); return; }
    if (newPw === currentPw) { setError("New password must be different from current password."); return; }
    changePassword.mutate({ currentPassword: currentPw, newPassword: newPw });
  };

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
          <KeyRound size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white" style={{ fontFamily: "Lora, serif" }}>Admin Settings</h2>
          <p className="text-sm text-slate-400">Manage administrator credentials</p>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #7c3aed, #3b82f6)" }} />
        <div className="p-6">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Settings2 size={16} className="text-indigo-400" /> Change Administrator Password
          </h3>
          <p className="text-xs text-slate-400 mb-5">Enter your current password and choose a new one. The new password will take effect immediately.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={e => { setCurrentPw(e.target.value); setError(""); setSuccess(""); }}
                  placeholder="Enter current password"
                  className="w-full rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setError(""); setSuccess(""); }}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); setError(""); setSuccess(""); }}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={changePassword.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}
            >
              {changePassword.isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              Change Password
            </button>
          </form>
        </div>
      </div>

      {/* Security Note */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <div className="flex items-start gap-2">
          <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-300 mb-1">Security Note</p>
            <p className="text-xs text-amber-300/70">After changing the password, you will need to use the new password the next time you log in to the Admin Panel. Make sure to remember it — there is no password recovery option.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type Worker = {
  id: number;
  workerID: string;
  name: string;
  displayName: string | null;
  profilePicture: string | null;
  department: string;
  userLevel: "1" | "1.1" | "2";
  activeDeviceToken: string | null;
  activeDeviceName: string | null;
  activeDeviceIP: string | null;
  activeDeviceCountry: string | null;
  activeDeviceRegion: string | null;
  activeDeviceCity: string | null;
  activeLoginAt: Date | null;
  accountStatus: "active" | "suspended";
  lastLoginAt: Date | null;
  suspendedAt: Date | null;
  suspensionReason: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
};
type Order = {
  id: number; orderID: string; trackingId?: string; fluteType: string; sizeW: number; sizeL: number;
  qty: number; bqComment: string; status: "current" | "out_of_stock"; submittedBy: string | null; createdAt: Date;
};

function RefreshButton({ onRefresh, size = 15 }: { onRefresh: () => void | Promise<void>; size?: number }) {
  const [spinning, setSpinning] = useState(false);
  return (
    <button
      onClick={async () => { setSpinning(true); await onRefresh(); setTimeout(() => setSpinning(false), 700); }}
      className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded"
      title="Refresh"
    >
      <RefreshCw size={size} className={spinning ? "animate-spin" : "transition-transform"} />
    </button>
  );
}

// ─── Swipeable Worker Card (mobile) ───────────────────────────────────────────
function SwipeableWorkerCard({
  w,
  onEdit,
  onDelete,
  onRevokeDevice,
  onReactivate,
}: {
  w: Worker;
  onEdit: (w: Worker) => void;
  onDelete: (w: Worker) => void;
  onRevokeDevice: (w: Worker) => void;
  onReactivate: (w: Worker) => void;
}) {
  const REVEAL_WIDTH = 130; // px — total width of both action buttons
  const SWIPE_THRESHOLD = 40; // px — minimum drag to trigger reveal

  const [offsetX, setOffsetX] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const actionTimer = useRef<number | null>(null);

  const completeSwipeAction = useCallback((action: (worker: Worker) => void) => {
    // Let the translated card return to its resting position before mounting a fixed dialog.
    // On mobile Chromium, opening the portal during a swipe transform causes visible flicker.
    isDragging.current = false;
    isHorizontal.current = null;
    setRevealed(false);
    setOffsetX(0);
    if (actionTimer.current !== null) window.clearTimeout(actionTimer.current);
    actionTimer.current = window.setTimeout(() => {
      action(w);
      actionTimer.current = null;
    }, 280);
  }, [w]);

  useEffect(() => () => {
    if (actionTimer.current !== null) window.clearTimeout(actionTimer.current);
  }, []);

  // Close on outside tap
  useEffect(() => {
    if (!revealed) return;
    const handler = (e: TouchEvent | MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setRevealed(false);
        setOffsetX(0);
      }
    };
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [revealed]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontal.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine scroll vs swipe on first significant movement
    if (isHorizontal.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return; // let vertical scroll pass through

    e.preventDefault(); // prevent page scroll during horizontal swipe
    const base = revealed ? -REVEAL_WIDTH : 0;
    const newOffset = Math.max(-REVEAL_WIDTH, Math.min(0, base + dx));
    setOffsetX(newOffset);
  }, [revealed]);

  const handleTouchEnd = useCallback(() => {
    if (!isHorizontal.current) { isDragging.current = false; return; }
    const base = revealed ? -REVEAL_WIDTH : 0;
    const dx = offsetX - base;
    if (!revealed && dx < -SWIPE_THRESHOLD) {
      setOffsetX(-REVEAL_WIDTH);
      setRevealed(true);
    } else if (revealed && dx > SWIPE_THRESHOLD) {
      setOffsetX(0);
      setRevealed(false);
    } else {
      setOffsetX(revealed ? -REVEAL_WIDTH : 0);
    }
    isDragging.current = false;
  }, [revealed, offsetX]);

  return (
    <div ref={cardRef} className="relative overflow-hidden rounded-xl" style={{ touchAction: "pan-y" }}>
      {/* Action buttons (revealed behind the card) */}
      <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: REVEAL_WIDTH }}>
        <button
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); completeSwipeAction(onEdit); }}
          aria-label={`Edit ${w.name}`}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-white font-bold text-xs transition-all active:opacity-80"
          style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
        >
          <Pencil size={18} />
          <span>Edit</span>
        </button>
        <button
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); completeSwipeAction(onDelete); }}
          aria-label={`Delete ${w.name}`}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-white font-bold text-xs transition-all active:opacity-80"
          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
        >
          <Trash2 size={18} />
          <span>Delete</span>
        </button>
      </div>

      {/* Swipeable card face */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging.current ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "0.75rem",
          position: "relative",
          zIndex: 1,
        }}
        className="p-4"
      >
        {/* Swipe hint arrow (only when not revealed) */}
        {!revealed && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-25 pointer-events-none">
            <span className="text-slate-400 text-[10px]">←</span>
          </div>
        )}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-slate-400">Employee ID</p>
            <p className="text-sm font-bold text-indigo-300">{w.workerID}</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Desktop fallback buttons (hidden on touch devices via pointer:coarse) */}
            <button
              onClick={() => onEdit(w)}
              className="hidden md:flex text-slate-400 hover:text-indigo-300 p-1 transition-colors"
              title="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(w)}
              className="hidden md:flex text-slate-400 hover:text-red-400 p-1 transition-colors"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 text-xs">Name</span>
          <span className="text-white font-medium">{w.name}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-slate-400 text-xs">Department</span>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">{w.department}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-slate-400 text-xs">User Level</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${w.userLevel === "1" ? "bg-orange-500/20 text-orange-300 border-orange-500/30" : w.userLevel === "1.1" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}`}>Level {w.userLevel}</span>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Account</span>
          {w.accountStatus === "suspended" ? (
            <button type="button" onClick={() => onReactivate(w)} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800 hover:bg-amber-200">
              <ShieldAlert size={11} /> Suspended · Reactivate
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700"><CheckCircle2 size={11} /> Active</span>
          )}
        </div>
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Active device</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${w.activeDeviceToken ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${w.activeDeviceToken ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              {w.activeDeviceToken ? "Active" : "Offline"}
            </span>
          </div>
          {w.activeDeviceToken ? (
            <>
              <p className="mt-1 truncate text-xs font-semibold text-slate-800">{w.activeDeviceName || "Unknown device"}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-500">{w.activeDeviceIP || "Unknown IP"} · {w.lastSeenAt ? `Last active ${new Date(w.lastSeenAt).toLocaleString()}` : "Session active"}</p>
              {(w.activeDeviceCity || w.activeDeviceRegion || w.activeDeviceCountry) && (
                <p className="mt-0.5 truncate text-[10px] font-medium text-indigo-700">Approx. location: {[w.activeDeviceCity, w.activeDeviceRegion, w.activeDeviceCountry].filter(Boolean).join(", ")}</p>
              )}
              <button type="button" onClick={() => onRevokeDevice(w)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700">
                <Ban size={12} /> Revoke session
              </button>
            </>
          ) : (
            <p className="mt-1 text-[10px] text-slate-500">No active worker device session.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Workers Tab ───────────────────────────────────────────────────────────────
function WorkersTab() {
  const { getAdminPassword } = useAuth();
  const utils = trpc.useUtils();
  const workersQuery = trpc.workers.list.useQuery();
  const workers = (workersQuery.data ?? []) as Worker[];

  const [showAdd, setShowAdd] = useState(false);
  const [newWorkerID, setNewWorkerID] = useState("");
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newUserLevel, setNewUserLevel] = useState<"1" | "1.1" | "2">("2");
  const [addError, setAddError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [deleteVerifyPassword, setDeleteVerifyPassword] = useState("");
  const [profilePreview, setProfilePreview] = useState<Worker | null>(null);
  const [revokeDeviceTarget, setRevokeDeviceTarget] = useState<Worker | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<Worker | null>(null);

  // Edit state
  const [editTarget, setEditTarget] = useState<Worker | null>(null);
  const [editWorkerID, setEditWorkerID] = useState("");
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editUserLevel, setEditUserLevel] = useState<"1" | "1.1" | "2">("2");
  const [editConfirmID, setEditConfirmID] = useState("");
  const [editStep, setEditStep] = useState<"form" | "confirm">("form");
  const [editError, setEditError] = useState("");

  const addWorker = trpc.workers.add.useMutation();
  const deleteWorker = trpc.workers.delete.useMutation();
  const updateWorker = trpc.workers.update.useMutation();
  const revokeDevice = trpc.workers.revokeDevice.useMutation();
  const reactivateAccount = trpc.workers.reactivateAccount.useMutation();

  const openEdit = (w: Worker) => {
    setEditTarget(w);
    setEditWorkerID(w.workerID);
    setEditName(w.name);
    setEditDept(w.department);
    setEditUserLevel(w.userLevel);
    setEditConfirmID("");
    setEditStep("form");
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (editStep === "form") {
      if (!editWorkerID.trim() || !editName.trim() || !editDept.trim()) {
        setEditError("All fields are required.");
        return;
      }
      setEditStep("confirm");
      setEditError("");
      return;
    }
    // Confirm step
    if (editConfirmID.trim() !== editWorkerID.trim()) {
      setEditError("Employee ID does not match. Please re-enter the Employee ID to confirm.");
      return;
    }
    try {
      await updateWorker.mutateAsync({
        id: editTarget.id,
        workerID: editWorkerID.trim(),
        name: editName.trim(),
        department: editDept.trim(),
        userLevel: editUserLevel,
        confirmWorkerID: editConfirmID.trim(),
        adminPassword: getAdminPassword(),
      });
      toast.success("Worker updated successfully.");
      utils.workers.list.invalidate();
      setEditTarget(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setEditError(e?.message ?? "Failed to update worker.");
    }
  };

  const handleAdd = async () => {
    setAddError("");
    if (!newWorkerID.trim() || !newName.trim() || !newDept.trim()) {
      setAddError("All fields are required.");
      return;
    }
    try {
      await addWorker.mutateAsync({ workerID: newWorkerID.trim(), name: newName.trim(), department: newDept.trim(), userLevel: newUserLevel, adminPassword: getAdminPassword() });
      toast.success("Worker added.");
      utils.workers.list.invalidate();
      setShowAdd(false);
      setNewWorkerID(""); setNewName(""); setNewDept(""); setNewUserLevel("2");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setAddError(e?.message ?? "Failed to add worker.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteVerifyPassword !== getAdminPassword()) {
      toast.error("Incorrect admin password. Please try again.");
      return;
    }
    try {
      await deleteWorker.mutateAsync({ id: deleteTarget.id, adminPassword: getAdminPassword() });
      toast.success("Worker deleted successfully.");
      utils.workers.list.invalidate();
      setDeleteTarget(null);
      setDeleteVerifyPassword("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to delete worker.");
    }
  };

  const handleRevokeDevice = async () => {
    if (!revokeDeviceTarget) return;
    try {
      const result = await revokeDevice.mutateAsync({
        workerID: revokeDeviceTarget.workerID,
        adminPassword: getAdminPassword(),
      });
      toast.success(result.hadActiveSession ? `Session revoked for ${revokeDeviceTarget.displayName || revokeDeviceTarget.name}.` : "No active session to revoke.");
      utils.workers.list.invalidate();
      setRevokeDeviceTarget(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to revoke worker session.");
    }
  };

  const handleReactivateAccount = async () => {
    if (!reactivateTarget) return;
    try {
      const result = await reactivateAccount.mutateAsync({ workerID: reactivateTarget.workerID, adminPassword: getAdminPassword() });
      toast.success(result.alreadyActive ? "Worker account is already active." : `Account reactivated for ${reactivateTarget.displayName || reactivateTarget.name}.`);
      utils.workers.list.invalidate();
      setReactivateTarget(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to reactivate worker account.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{workers.length} registered worker{workers.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={13} /> Add Worker
        </button>
      </div>

      {workersQuery.isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No workers registered</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Employee ID</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Name</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Department</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Level</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Account</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Active Device</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Last Activity</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {workers.map(w => (
                  <tr key={w.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 text-sm font-semibold text-primary">{w.workerID}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        {w.profilePicture ? (
                          <button
                            type="button"
                            onClick={() => setProfilePreview(w)}
                            className="flex h-9 w-9 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-white/10 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                            aria-label={`Preview ${w.displayName || w.name} profile image`}
                            title="View full-size profile image"
                          >
                            <img src={w.profilePicture} alt={`${w.displayName || w.name} profile`} className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white shadow-sm ring-1 ring-white/10">
                            {(w.displayName || w.name || "U").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{w.displayName || w.name}</p>
                          {w.displayName && w.displayName !== w.name && (
                            <p className="truncate text-[11px] text-muted-foreground">{w.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{w.department}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${w.userLevel === "1" ? "bg-orange-100 text-orange-700" : w.userLevel === "1.1" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>Lv.{w.userLevel}</span>
                    </td>
                    <td className="py-3 pr-4">
                      {w.accountStatus === "suspended" ? (
                        <button onClick={() => setReactivateTarget(w)} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800 transition-colors hover:bg-amber-200" title="Reactivate suspended account">
                          <ShieldAlert size={12} /> Suspended
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700"><CheckCircle2 size={12} /> Active</span>
                      )}
                      {w.lastLoginAt && <p className="mt-1 text-[10px] text-slate-500">Login {new Date(w.lastLoginAt).toLocaleDateString()}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      {w.activeDeviceToken ? (
                        <div className="min-w-[160px]">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="truncate text-xs font-semibold text-slate-800">{w.activeDeviceName || "Unknown device"}</span>
                          </div>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">{w.activeDeviceIP || "Unknown IP"}</p>
                          {(w.activeDeviceCity || w.activeDeviceRegion || w.activeDeviceCountry) && (
                            <p className="mt-0.5 truncate text-[10px] font-medium text-indigo-700">{[w.activeDeviceCity, w.activeDeviceRegion, w.activeDeviceCountry].filter(Boolean).join(", ")}</p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400"><span className="h-2 w-2 rounded-full bg-slate-300" /> Offline</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-xs font-medium text-slate-700">{w.lastSeenAt ? new Date(w.lastSeenAt).toLocaleString() : "—"}</p>
                      {w.activeLoginAt && <p className="mt-0.5 text-[10px] text-slate-500">Signed in {new Date(w.activeLoginAt).toLocaleString()}</p>}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {w.activeDeviceToken && (
                          <button onClick={() => setRevokeDeviceTarget(w)} className="text-muted-foreground hover:text-red-600 transition-colors" title="Revoke active device session">
                            <Ban size={14} />
                          </button>
                        )}
                        <button onClick={() => openEdit(w)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit worker">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(w)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete worker">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {workers.map(w => (
              <SwipeableWorkerCard
                key={w.id}
                w={w}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onRevokeDevice={setRevokeDeviceTarget}
                onReactivate={setReactivateTarget}
              />
            ))}
          </div>
        </>
      )}

      {/* Full-size worker profile preview */}
      {profilePreview?.profilePicture && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setProfilePreview(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={`${profilePreview.displayName || profilePreview.name} profile image preview`}
            onClick={event => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />
            <div className="mb-3 flex items-center justify-between gap-3 pt-1">
              <div className="min-w-0">
                <p className="truncate text-base font-black text-white">{profilePreview.displayName || profilePreview.name}</p>
                <p className="truncate text-xs text-slate-400">{profilePreview.workerID} · {profilePreview.department}</p>
              </div>
              <button
                type="button"
                onClick={() => setProfilePreview(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Close profile image preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
              <img
                src={profilePreview.profilePicture}
                alt={`${profilePreview.displayName || profilePreview.name} profile picture full size`}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active device session revocation confirmation */}
      {revokeDeviceTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Ban size={21} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">Revoke active session?</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">This will immediately sign out the worker's active device. They must sign in again to continue.</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-800">{revokeDeviceTarget.displayName || revokeDeviceTarget.name} · {revokeDeviceTarget.workerID}</p>
              <p className="mt-1 text-xs text-slate-500">{revokeDeviceTarget.activeDeviceName || "Unknown device"} · {revokeDeviceTarget.activeDeviceIP || "Unknown IP"}</p>
              {(revokeDeviceTarget.activeDeviceCity || revokeDeviceTarget.activeDeviceRegion || revokeDeviceTarget.activeDeviceCountry) && (
                <p className="mt-1 text-xs font-medium text-indigo-700">Approx. location: {[revokeDeviceTarget.activeDeviceCity, revokeDeviceTarget.activeDeviceRegion, revokeDeviceTarget.activeDeviceCountry].filter(Boolean).join(", ")}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">Last activity: {revokeDeviceTarget.lastSeenAt ? new Date(revokeDeviceTarget.lastSeenAt).toLocaleString() : "Unavailable"}</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setRevokeDeviceTarget(null)} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={revokeDevice.isPending} onClick={handleRevokeDevice} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60">
                {revokeDevice.isPending ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />} Revoke session
              </button>
            </div>
          </div>
        </div>
      )}

      {reactivateTarget && (
        <StableAdminModalLayer>
          <div role="dialog" aria-modal="true" aria-label="Reactivate worker account" className="relative my-auto w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><ShieldAlert size={21} /></div>
              <div>
                <h3 className="text-base font-black text-slate-950">Reactivate Employee ID?</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">This restores login access and starts a new 30-day inactivity period. The worker should sign in again after reactivation.</p>
              </div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-sm font-bold text-amber-950">{reactivateTarget.displayName || reactivateTarget.name} · {reactivateTarget.workerID}</p>
              <p className="mt-1 text-xs text-amber-800">{reactivateTarget.suspensionReason || "Suspended due to prolonged inactivity."}</p>
              {reactivateTarget.suspendedAt && <p className="mt-1 text-xs text-amber-700">Suspended {new Date(reactivateTarget.suspendedAt).toLocaleString()}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setReactivateTarget(null)} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={reactivateAccount.isPending} onClick={handleReactivateAccount} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60">
                {reactivateAccount.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Reactivate
              </button>
            </div>
          </div>
        </StableAdminModalLayer>
      )}

      {/* Add Worker Dialog */}
      {showAdd && (
        <StableAdminModalLayer>
          <div role="dialog" aria-modal="true" aria-label="Add Worker" className="relative my-auto max-h-[calc(100dvh-8rem)] w-full max-w-sm overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:max-w-md" style={{ background: "#fff", borderColor: "#e2e8f0" }}>
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-xl -mx-6 -mt-6 mb-5 rounded-tl-2xl rounded-tr-2xl" />
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus size={16} className="text-indigo-400" /> Add Worker</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Employee ID</label>
                <input type="text" value={newWorkerID} onChange={e => { setNewWorkerID(e.target.value); setAddError(""); }} placeholder="e.g. DN156" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Name</label>
                <input type="text" value={newName} onChange={e => { setNewName(e.target.value); setAddError(""); }} placeholder="Full name" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Department</label>
                <input type="text" value={newDept} onChange={e => { setNewDept(e.target.value); setAddError(""); }} placeholder="e.g. Production" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">User Level</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserLevel("1")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${newUserLevel === "1" ? "bg-orange-500/25 border-orange-500/50 text-orange-300" : "border-white/10 text-slate-400 hover:bg-white/8"}`}
                  >
                    Level 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserLevel("1.1")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${newUserLevel === "1.1" ? "bg-purple-500/25 border-purple-500/50 text-purple-300" : "border-white/10 text-slate-400 hover:bg-white/8"}`}
                  >
                    Level 1.1
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserLevel("2")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${newUserLevel === "2" ? "bg-green-500/25 border-green-500/50 text-green-300" : "border-white/10 text-slate-400 hover:bg-white/8"}`}
                  >
                    Level 2
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">{newUserLevel === "1" ? "Level 1: Actions require Level 2 approval" : newUserLevel === "1.1" ? "Level 1.1: Can process-approve Level 1 requests (Level 2 gives final approval)" : "Level 2: Can approve/cancel Level 1 requests"}</p>
              </div>
              {addError && <p className="text-xs text-red-400">{addError}</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowAdd(false); setAddError(""); }} className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={handleAdd} disabled={addWorker.isPending} className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {addWorker.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Add
              </button>
            </div>
          </div>
        </StableAdminModalLayer>
      )}

      {/* Edit Worker Dialog */}
      {editTarget && (
        <StableAdminModalLayer>
          <div role="dialog" aria-modal="true" aria-label="Edit Worker" className="relative my-auto max-h-[calc(100dvh-8rem)] w-full max-w-sm overflow-y-auto rounded-2xl border p-6 shadow-2xl" style={{ background: "#fff", borderColor: "#e2e8f0" }}>
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-xl -mx-6 -mt-6 mb-5 rounded-tl-2xl rounded-tr-2xl" />
            {editStep === "form" ? (
              <>
                <h3 className="font-bold text-white mb-1 flex items-center gap-2"><Pencil size={15} className="text-indigo-400" /> Edit Worker</h3>
                <p className="text-xs text-slate-400 mb-4">Update details for <strong className="text-indigo-300">{editTarget.workerID}</strong></p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Employee ID</label>
                    <input type="text" value={editWorkerID} onChange={e => { setEditWorkerID(e.target.value.toUpperCase()); setEditError(""); }} placeholder="e.g. DN156" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Name</label>
                    <input type="text" value={editName} onChange={e => { setEditName(e.target.value); setEditError(""); }} placeholder="Full name" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Department</label>
                    <input type="text" value={editDept} onChange={e => { setEditDept(e.target.value); setEditError(""); }} placeholder="e.g. Production" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">User Level</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditUserLevel("1")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${editUserLevel === "1" ? "bg-orange-500/25 border-orange-500/50 text-orange-300" : "border-white/10 text-slate-400 hover:bg-white/8"}`}>Level 1</button>
                      <button type="button" onClick={() => setEditUserLevel("1.1")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${editUserLevel === "1.1" ? "bg-purple-500/25 border-purple-500/50 text-purple-300" : "border-white/10 text-slate-400 hover:bg-white/8"}`}>Level 1.1</button>
                      <button type="button" onClick={() => setEditUserLevel("2")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${editUserLevel === "2" ? "bg-green-500/25 border-green-500/50 text-green-300" : "border-white/10 text-slate-400 hover:bg-white/8"}`}>Level 2</button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{editUserLevel === "1" ? "Level 1: Actions require Level 2 approval" : editUserLevel === "1.1" ? "Level 1.1: Can process-approve Level 1 requests (Level 2 gives final approval)" : "Level 2: Can approve/cancel Level 1 requests"}</p>
                  </div>
                  {editError && <p className="text-xs text-red-400">{editError}</p>}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setEditTarget(null)} className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Cancel</button>
                  <button onClick={handleEditSave} className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90">Next →</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold text-white mb-1">Confirm Update</h3>
                <p className="text-sm text-slate-400 mb-4">To confirm, please re-enter the Employee ID <strong className="text-indigo-300">{editWorkerID}</strong> below.</p>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Re-enter Employee ID</label>
                  <input
                    type="text"
                    value={editConfirmID}
                    onChange={e => { setEditConfirmID(e.target.value.toUpperCase()); setEditError(""); }}
                    placeholder={`Type ${editWorkerID} to confirm`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                    autoFocus
                  />
                  {editError && <p className="text-xs text-red-400 mt-2">{editError}</p>}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setEditStep("form"); setEditError(""); }} className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">← Back</button>
                  <button
                    onClick={handleEditSave}
                    disabled={updateWorker.isPending || editConfirmID.trim() !== editWorkerID.trim()}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updateWorker.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </StableAdminModalLayer>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <StableAdminModalLayer>
          <div role="dialog" aria-modal="true" aria-label="Delete Worker" className="relative my-auto max-h-[calc(100dvh-8rem)] w-full max-w-sm overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:max-w-md" style={{ background: "#fff", borderColor: "#e2e8f0" }}>
            {/* Red accent bar */}
            <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-t-xl -mx-6 -mt-6 mb-5 rounded-tl-2xl rounded-tr-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <h3 className="font-bold text-white">Delete Worker</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              This action cannot be undone. You are about to permanently delete <strong className="text-white">{deleteTarget.name}</strong> <span className="text-red-400">({deleteTarget.workerID})</span> from the system.
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-400 font-semibold mb-2">⚠️ Enter admin password to confirm:</p>
              <input
                type="password"
                value={deleteVerifyPassword}
                onChange={e => setDeleteVerifyPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleDelete()}
                placeholder="Admin password"
                className="w-full bg-white/5 border border-red-500/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteVerifyPassword(""); }} className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleteWorker.isPending || !deleteVerifyPassword} className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteWorker.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete Worker
              </button>
            </div>
          </div>
        </StableAdminModalLayer>
      )}
    </div>
  );
}

// ─── Export Helpers ───────────────────────────────────────────────────────────
function exportToExcel(orders: Order[]) {
  import("xlsx").then(XLSX => {
    const wb = XLSX.utils.book_new();
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    function buildSheet(subset: Order[], sheetLabel: string) {
      const HEADERS = ["No.", "Production Order", "Flute Type", "Width (mm)", "Length (mm)", "Size (W×L)", "Qty (pcs)", "BQ Comment", "Submitted By", "Date Submitted"];
      const rows: (string | number)[][] = [
        [`Stock Dash — Stock History Report`],
        [`Sheet: ${sheetLabel}`],
        [`Generated: ${dateStr} ${timeStr}`],
        [`Total Records: ${subset.length}`],
        [],
        HEADERS,
        ...subset.map((o, i) => [
          i + 1,
          o.orderID,
          o.fluteType,
          o.sizeW,
          o.sizeL,
          `${o.sizeW}×${o.sizeL}`,
          o.qty,
          o.bqComment,
          o.submittedBy ?? "-",
          new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        ]),
        [],
        ["", "", "", "", "", "TOTAL QTY", subset.reduce((s, o) => s + o.qty, 0), "", "", ""],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [
        { wch: 5 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 13 },
        { wch: 13 }, { wch: 10 }, { wch: 24 }, { wch: 16 }, { wch: 16 },
      ];
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } },
      ];
      return ws;
    }

    const current = orders.filter(o => o.status === "current");
    const outOfStock = orders.filter(o => o.status === "out_of_stock");
    XLSX.utils.book_append_sheet(wb, buildSheet(current, "Current Stock"), "Current Stock");
    XLSX.utils.book_append_sheet(wb, buildSheet(outOfStock, "Out of Stock"), "Out of Stock");
    XLSX.writeFile(wb, `PP4_StockHistory_${now.toISOString().slice(0, 10)}.xlsx`);
  });
}
// ─── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab() {
  const { getAdminPassword } = useAuth();
  const utils = trpc.useUtils();
  const ordersQuery = trpc.orders.list.useQuery({});
  const orders = (ordersQuery.data ?? []) as Order[];

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [confirmWorkerID, setConfirmWorkerID] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [usedUpdateTarget, setUsedUpdateTarget] = useState<Order | null>(null);
  const [usedQty, setUsedQty] = useState("");
  const [jobNo, setJobNo] = useState("");
  const [masterCard, setMasterCard] = useState("");
  const [boardSizeW, setBoardSizeW] = useState("");
  const [boardSizeL, setBoardSizeL] = useState("");
  const [scores, setScores] = useState("");
  const [usedUpdateError, setUsedUpdateError] = useState("");
  const [usedUpdateStep, setUsedUpdateStep] = useState<"type" | "confirm">("type");
  const [usedUpdateType, setUsedUpdateType] = useState<"old_stock" | "job_no">("job_no");

  const deleteOrder = trpc.orders.delete.useMutation();
  const updateStatus = trpc.orders.updateStatus.useMutation();
  const logUsage = trpc.orders.logUsage.useMutation();

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    if (!confirmWorkerID.trim()) { setDeleteError("Employee ID required."); return; }
    try {
      await deleteOrder.mutateAsync({ id: deleteTarget.id, orderID: deleteTarget.orderID, fluteType: deleteTarget.fluteType, sizeW: deleteTarget.sizeW, sizeL: deleteTarget.sizeL, qty: deleteTarget.qty, bqComment: deleteTarget.bqComment, workerID: confirmWorkerID.trim(), adminPassword: getAdminPassword() });
      toast.success("Order deleted.");
      utils.orders.list.invalidate();
      setDeleteTarget(null);
      setConfirmWorkerID("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDeleteError(e?.message ?? "Failed to delete order.");
    }
  };

  const handleStatusChange = async (order: Order, newStatus: "current" | "out_of_stock") => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status: newStatus, adminPassword: getAdminPassword() });
      toast.success("Status updated.");
      utils.orders.list.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to update status.");
    }
  };

  const handleUsedUpdate = async () => {
    if (!usedUpdateTarget) return;
    setUsedUpdateError("");
    if (usedUpdateStep === "type") {
      if (usedUpdateType === "job_no") {
        if (!jobNo.trim()) { setUsedUpdateError("Job No is required."); return; }
        if (!masterCard.trim()) { setUsedUpdateError("Master Card is required."); return; }
        if (!boardSizeW.trim() || !boardSizeL.trim()) { setUsedUpdateError("Board Size is required."); return; }
      } else {
        if (!usedQty.trim() || isNaN(Number(usedQty))) { setUsedUpdateError("Valid Used Qty is required."); return; }
      }
      setUsedUpdateStep("confirm");
      return;
    }
    try {
      if (usedUpdateType === "job_no") {
        await logUsage.mutateAsync({
          jobNo: jobNo.trim(),
          usedQty: 0,
          orderID: usedUpdateTarget.orderID,
          fluteType: usedUpdateTarget.fluteType,
          bqComment: usedUpdateTarget.bqComment,
          purpose: "job",
          orderId: usedUpdateTarget.id,
          newQty: usedUpdateTarget.qty,
          performedBy: "ADMIN",
          masterCard: masterCard.trim(),
          boardSizeW: Number(boardSizeW),
          boardSizeL: Number(boardSizeL),
          scores: scores.trim() || null,
        });
      } else {
        await logUsage.mutateAsync({
          jobNo: null,
          usedQty: Number(usedQty),
          orderID: usedUpdateTarget.orderID,
          fluteType: usedUpdateTarget.fluteType,
          bqComment: usedUpdateTarget.bqComment,
          purpose: "old_stock",
          orderId: usedUpdateTarget.id,
          newQty: 0,
          performedBy: "ADMIN",
        });
      }
      toast.success(usedUpdateType === "job_no" ? "Job No usage logged." : "Old Stock cleared.");
      utils.orders.list.invalidate();
      setUsedUpdateTarget(null);
      setUsedUpdateStep("type");
      setJobNo("");
      setUsedQty("");
      setMasterCard("");
      setBoardSizeW("");
      setBoardSizeL("");
      setScores("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setUsedUpdateError(e?.message ?? "Failed to update usage.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{orders.length} total order{orders.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(orders)}
            disabled={orders.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-40"
            title="Download Excel (Current Stock + Out of Stock sheets)"
          >
            <FileSpreadsheet size={13} /> Download Excel
          </button>
          <RefreshButton onRefresh={() => utils.orders.list.invalidate()} />
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Tracking ID","Production Order","Flute","Size","Qty","BQ","Submitted By","Date","Status",""].map(h => (
                    <th key={h} className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-3">
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded font-mono font-bold">{order.trackingId || "—"}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm font-semibold text-primary">{order.orderID}</td>
                    <td className="py-3 pr-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Flute : {order.fluteType}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm text-foreground font-mono">{order.sizeW}×{order.sizeL}</td>
                    <td className="py-3 pr-3 text-sm text-foreground">{order.qty}</td>
                    <td className="py-3 pr-3 max-w-[160px]">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono truncate block">{order.bqComment}</span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">{order.submittedBy ?? "-"}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="py-3 pr-3">
                      <button
                        onClick={() => handleStatusChange(order, order.status === "current" ? "out_of_stock" : "current")}
                        disabled={updateStatus.isPending}
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-opacity hover:opacity-70 ${order.status === "current" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {order.status === "current" ? "Current" : "Out"}
                      </button>
                    </td>
                    <td className="py-3 flex gap-1">
                      <button onClick={() => { setUsedUpdateTarget(order); setUsedUpdateStep("type"); setUsedUpdateType("job_no"); setJobNo(""); setUsedQty(""); setMasterCard(""); setBoardSizeW(""); setBoardSizeL(""); setScores(""); setUsedUpdateError(""); }} className="text-muted-foreground hover:text-blue-600 transition-colors" title="Used Update">
                        <Zap size={14} />
                      </button>
                      <button onClick={() => { setDeleteTarget(order); setConfirmWorkerID(""); setDeleteError(""); }} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {orders.map(order => (
              <div key={order.id} className="p-4 rounded-xl border space-y-2" style={{ background: "rgba(30,41,59,0.75)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.10)" }}>
                {order.trackingId && <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-1 rounded font-mono font-bold inline-block">Ref: {order.trackingId}</span>}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Production Order</p>
                    <p className="text-sm font-bold text-indigo-300">{order.orderID}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Flute</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">Flute : {order.fluteType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Size</span>
                  <span className="text-sm font-mono text-white">{order.sizeW}×{order.sizeL}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Qty</span>
                  <span className="text-sm text-white">{order.qty}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">BQ</p>
                  <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded font-mono break-all">{order.bqComment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Submitted By</span>
                  <span className="text-xs text-white">{order.submittedBy ?? "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Date</span>
                  <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-xs text-slate-400">Status</span>
                  <button
                    onClick={() => handleStatusChange(order, order.status === "current" ? "out_of_stock" : "current")}
                    disabled={updateStatus.isPending}
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold border transition-opacity hover:opacity-70 ${order.status === "current" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-slate-600/40 text-slate-400 border-slate-500/30"}`}
                  >
                    {order.status === "current" ? "Current" : "Out"}
                  </button>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setUsedUpdateTarget(order); setUsedUpdateStep("type"); setUsedUpdateType("job_no"); setJobNo(""); setUsedQty(""); setMasterCard(""); setBoardSizeW(""); setBoardSizeL(""); setScores(""); setUsedUpdateError(""); }} className="flex-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 text-xs font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                    <Zap size={13} /> Used Update
                  </button>
                  <button onClick={() => { setDeleteTarget(order); setConfirmWorkerID(""); setDeleteError(""); }} className="flex-1 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 text-xs font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Order Dialog */}
      {deleteTarget && (
        <StableAdminModalLayer>
          <div role="dialog" aria-modal="true" aria-label="Delete Order" className="relative my-auto max-h-[calc(100dvh-8rem)] w-full max-w-sm overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:max-w-md" style={{ background: "#fff", borderColor: "#e2e8f0" }}>
            <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-t-xl -mx-6 -mt-6 mb-5 rounded-tl-2xl rounded-tr-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-red-400" />
              </div>
              <h3 className="font-bold text-white">Delete Order</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Enter an Employee ID to confirm deletion of order <strong className="text-red-300">{deleteTarget.orderID}</strong>.
            </p>
            <input
              type="text"
              value={confirmWorkerID}
              onChange={e => { setConfirmWorkerID(e.target.value); setDeleteError(""); }}
              onKeyDown={e => e.key === "Enter" && handleDeleteOrder()}
              placeholder="Employee ID"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 mb-1"
              autoFocus
            />
            {deleteError && <p className="text-xs text-red-400 mb-2">{deleteError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setDeleteTarget(null); setConfirmWorkerID(""); setDeleteError(""); }} className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={handleDeleteOrder} disabled={deleteOrder.isPending} className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </StableAdminModalLayer>
      )}

      {/* Used Update Dialog */}
      {usedUpdateTarget && (
        <StableAdminModalLayer>
          <div role="dialog" aria-modal="true" aria-label="Used Update" className="relative my-auto max-h-[calc(100dvh-8rem)] w-full max-w-md overflow-y-auto rounded-2xl border p-6 shadow-2xl" style={{ background: "#fff", borderColor: "#e2e8f0" }}>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-xl -mx-6 -mt-6 mb-5 rounded-tl-2xl rounded-tr-2xl" />
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Zap size={15} className="text-blue-400" /> Used Update — <span className="text-blue-300">{usedUpdateTarget.orderID}</span></h3>

            {usedUpdateStep === "type" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">Update Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUsedUpdateType("job_no")}
                      className={`flex-1 py-2.5 rounded-xl font-semibold border transition-colors ${
                        usedUpdateType === "job_no"
                          ? "bg-blue-500/25 border-blue-500/50 text-blue-300"
                          : "border-white/10 text-slate-400 hover:bg-white/8"
                      }`}
                    >
                      Job No
                    </button>
                    <button
                      onClick={() => setUsedUpdateType("old_stock")}
                      className={`flex-1 py-2.5 rounded-xl font-semibold border transition-colors ${
                        usedUpdateType === "old_stock"
                          ? "bg-red-500/25 border-red-500/50 text-red-300"
                          : "border-white/10 text-slate-400 hover:bg-white/8"
                      }`}
                    >
                      Old Stock
                    </button>
                  </div>
                </div>

                {usedUpdateType === "job_no" ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Job No <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={jobNo}
                        onChange={e => { setJobNo(e.target.value.toUpperCase()); setUsedUpdateError(""); }}
                        placeholder="Enter Job No"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Master Card <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={masterCard}
                        onChange={e => { setMasterCard(e.target.value.toUpperCase()); setUsedUpdateError(""); }}
                        placeholder="Enter Master Card"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Width <span className="text-red-400">*</span></label>
                        <input
                          type="number"
                          value={boardSizeW}
                          onChange={e => { setBoardSizeW(e.target.value); setUsedUpdateError(""); }}
                          placeholder="W"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Length <span className="text-red-400">*</span></label>
                        <input
                          type="number"
                          value={boardSizeL}
                          onChange={e => { setBoardSizeL(e.target.value); setUsedUpdateError(""); }}
                          placeholder="L"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Scores (optional)</label>
                      <input
                        type="text"
                        value={scores}
                        onChange={e => { setScores(e.target.value); setUsedUpdateError(""); }}
                        placeholder="Enter Scores"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Used Qty <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      value={usedQty}
                      onChange={e => { setUsedQty(e.target.value); setUsedUpdateError(""); }}
                      placeholder="Enter quantity used"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                    />
                  </div>
                )}

                {usedUpdateError && <p className="text-xs text-red-400">{usedUpdateError}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setUsedUpdateTarget(null);
                      setUsedUpdateStep("type");
                      setJobNo("");
                      setUsedQty("");
                      setMasterCard("");
                      setBoardSizeW("");
                      setBoardSizeL("");
                      setScores("");
                      setUsedUpdateError("");
                    }}
                    className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUsedUpdate}
                    disabled={logUsage.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {logUsage.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                  <p className="text-sm text-blue-300 font-semibold mb-2">Confirm {usedUpdateType === "job_no" ? "Job No" : "Old Stock"} Update</p>
                  {usedUpdateType === "job_no" ? (
                    <div className="space-y-1 text-xs text-slate-300">
                      <p><strong className="text-white">Job No:</strong> {jobNo}</p>
                      <p><strong className="text-white">Master Card:</strong> {masterCard}</p>
                      <p><strong className="text-white">Board Size:</strong> {boardSizeW}×{boardSizeL} mm</p>
                      {scores && <p><strong className="text-white">Scores:</strong> {scores}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300"><strong className="text-white">Used Qty:</strong> {usedQty} pcs</p>
                  )}
                </div>

                {usedUpdateError && <p className="text-xs text-red-400">{usedUpdateError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={() => setUsedUpdateStep("type")}
                    className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUsedUpdate}
                    disabled={logUsage.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {logUsage.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </StableAdminModalLayer>
      )}
    </div>
  );
}

// ─── Deleted Logs Tab ─────────────────────────────────────────────────────────
type DeletedLog = {
  id: number; orderID: string; fluteType: string; sizeW: number; sizeL: number;
  qty: number; bqComment: string; deletedBy: string; deletedAt: Date;
};

function DeletedLogsTab() {
  const utils = trpc.useUtils();
  const logsQuery = trpc.orders.getDeletedLogs.useQuery();
  const logs = (logsQuery.data ?? []) as DeletedLog[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{logs.length} deleted record{logs.length !== 1 ? "s" : ""}</p>
        <RefreshButton onRefresh={() => utils.orders.getDeletedLogs.invalidate()} />
      </div>

      {logsQuery.isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No deleted records yet</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Production Order","Flute","Size","Qty","BQ","Deleted By","Deleted At"].map(h => (
                    <th key={h} className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-3 text-sm font-semibold text-red-600">{log.orderID}</td>
                    <td className="py-3 pr-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Flute : {log.fluteType}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm font-mono">{log.sizeW}×{log.sizeL}</td>
                    <td className="py-3 pr-3 text-sm">{log.qty} pcs</td>
                    <td className="py-3 pr-3 max-w-[160px]">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono truncate block">{log.bqComment}</span>
                    </td>
                    <td className="py-3 pr-3 text-xs font-semibold text-foreground">{log.deletedBy}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(log.deletedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {logs.map(log => (
              <div key={log.id} className="p-4 rounded-xl border space-y-2" style={{ background: "rgba(30,41,59,0.75)", backdropFilter: "blur(12px)", borderColor: "rgba(239,68,68,0.20)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Production Order</p>
                    <p className="text-sm font-bold text-red-400">{log.orderID}</p>
                  </div>
                  <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold">Deleted</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">Flute : {log.fluteType}</span>
                  <span className="text-xs bg-white/10 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full font-mono">{log.sizeW}×{log.sizeL} mm</span>
                  <span className="text-xs bg-white/10 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full">{log.qty} pcs</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">BQ</p>
                  <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded font-mono break-all">{log.bqComment}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-500/20">
                  <div>
                    <p className="text-xs text-slate-400">Deleted By</p>
                    <p className="text-xs font-semibold text-white">{log.deletedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Deleted At</p>
                    <p className="text-xs text-slate-400">{new Date(log.deletedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Pending Requests Tab ─────────────────────────────────────────────────────
type PendingReq = {
  id: number; type: "delete" | "used_update"; orderId: number; orderSnapshot: string;
  requestedBy: string; workerName: string; actionData: string | null;
  status: "pending" | "approved" | "cancelled"; reviewedBy: string | null;
  reviewedAt: Date | null; createdAt: Date;
};
function PendingRequestsTab() {
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "cancelled">("pending");
  const [processingId, setProcessingId] = useState<number | null>(null);
  // Cancel reason dialog
  const [cancelDialog, setCancelDialog] = useState<{ id: number } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  // Approve with qty dialog
  const [approveDialog, setApproveDialog] = useState<{ id: number; requestedQty: number | null; isDelete: boolean } | null>(null);
  const [approvedQtyInput, setApprovedQtyInput] = useState("");

  // Process Approve dialog
  const [processDialog, setProcessDialog] = useState<{ id: number; requestedQty: number | null } | null>(null);
  const [processQtyInput, setProcessQtyInput] = useState("");
  const listQuery = trpc.pendingRequests.list.useQuery({ status: statusFilter });
  const requests = (listQuery.data ?? []) as PendingReq[];
  const approveMut = trpc.pendingRequests.approve.useMutation({
    onSuccess: () => { utils.pendingRequests.list.invalidate(); toast.success("Request approved!"); },
    onError: (e) => toast.error(e.message),
  });
  const cancelMut = trpc.pendingRequests.cancel.useMutation({
    onSuccess: () => { utils.pendingRequests.list.invalidate(); toast.success("Request cancelled."); },
    onError: (e) => toast.error(e.message),
  });
  const processApproveMut = trpc.pendingRequests.processApprove.useMutation({
    onSuccess: () => { utils.pendingRequests.list.invalidate(); toast.success("Request marked as In Process!"); },
    onError: (e) => toast.error(e.message),
  });
  const handleApprove = async (id: number, approvedQty?: number) => {
    setProcessingId(id);
    try { await approveMut.mutateAsync({ id, reviewerWorkerID: "ADMIN", approvedQty }); } finally { setProcessingId(null); }
  };
  const handleCancel = async (id: number, reason: string) => {
    setProcessingId(id);
    try { await cancelMut.mutateAsync({ id, reviewerWorkerID: "ADMIN", cancelReason: reason }); } finally { setProcessingId(null); }
  };
  const handleProcessApprove = async (id: number, processedQty?: number) => {
    setProcessingId(id);
    try { await processApproveMut.mutateAsync({ id, reviewerWorkerID: "ADMIN", processApprovedQty: processedQty }); } finally { setProcessingId(null); }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">Pending Requests</h2>
        <RefreshButton onRefresh={() => utils.pendingRequests.list.invalidate()} />
      </div>
      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {(["pending", "approved", "cancelled"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors border ${statusFilter === s ? (s === "pending" ? "bg-orange-500/25 border-orange-500/50 text-orange-300" : s === "approved" ? "bg-green-500/25 border-green-500/50 text-green-300" : "bg-slate-500/25 border-slate-500/50 text-slate-300") : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}
          >{s}</button>
        ))}
      </div>
      {listQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">No {statusFilter} requests</div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const snapshot = (() => { try { return JSON.parse(req.orderSnapshot); } catch { return {}; } })();
            const action = (() => { try { return req.actionData ? JSON.parse(req.actionData) : {}; } catch { return {}; } })();
            const isPending = req.status === "pending";
            return (
              <div key={req.id} className="rounded-xl p-4 border" style={{ background: "rgba(15,23,42,0.92)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.12)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${req.type === "delete" ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"}`}>
                      {req.type === "delete" ? <Trash2 size={10} /> : <RefreshCw size={10} />}
                      {req.type === "delete" ? "Delete" : "Used Update"}
                    </span>
                    <span className={`ml-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${req.status === "pending" ? "bg-orange-500/20 text-orange-300 border-orange-500/30" : req.status === "approved" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                      {req.status === "pending" ? <Clock size={10} /> : req.status === "approved" ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {req.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                  <div><span className="text-slate-400">Production Order: </span><span className="font-semibold text-white">{snapshot.orderID ?? "—"}</span></div>
                  <div><span className="text-slate-400">Requested by: </span><span className="font-semibold text-white">{req.workerName} ({req.requestedBy})</span></div>
                  {req.type === "used_update" && action.usedQty && (
                    <div><span className="text-slate-400">Use Qty: </span><span className="font-semibold text-blue-300">{action.usedQty} pcs</span></div>
                  )}
                  {req.type === "used_update" && action.jobNo && (
                    <div><span className="text-slate-400">Job No: </span><span className="font-semibold font-mono text-white">{action.jobNo}</span></div>
                  )}
                  {req.type === "used_update" && action.masterCard && (
                    <div><span className="text-slate-400">Master Card: </span><span className="font-semibold font-mono text-white">{action.masterCard}</span></div>
                  )}
                  {req.type === "used_update" && (action.boardSizeW || action.boardSizeL) && (
                    <div><span className="text-slate-400">Board Size: </span><span className="font-semibold text-white">{action.boardSizeW ?? "—"}×{action.boardSizeL ?? "—"} mm</span></div>
                  )}
                  {req.type === "used_update" && action.scores && (
                    <div className="col-span-2"><span className="text-slate-400">Scores: </span><span className="font-semibold font-mono text-white">{action.scores}</span></div>
                  )}
                  {(req as any).processApprovedBy && (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">⚙ In Process</span>
                      <span className="text-xs text-slate-400">by {(req as any).processApprovedBy}</span>
                    </div>
                  )}
                  {req.reviewedBy && (
                    <div className="col-span-2"><span className="text-slate-400">Reviewed by: </span><span className="font-semibold text-white">{req.reviewedBy}</span></div>
                  )}
                </div>
                {isPending && (
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <button onClick={() => { setCancelDialog({ id: req.id }); setCancelReason(""); }} disabled={processingId === req.id}
                      className="flex-1 min-w-[80px] border border-red-500/30 bg-red-500/10 rounded-xl py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <XCircle size={12} /> Cancel
                    </button>
                    {req.type === "used_update" && !(req as any).processApprovedBy && (
                      <button onClick={() => { const aq = action.usedQty ?? null; setProcessDialog({ id: req.id, requestedQty: aq }); setProcessQtyInput(aq ? String(aq) : ""); }} disabled={processingId === req.id}
                        className="flex-1 min-w-[80px] bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl py-2 text-xs font-semibold hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                        {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <span>⚙</span>}
                        Process
                      </button>
                    )}
                    <button onClick={() => { const aq = req.type === "used_update" ? (action.usedQty ?? null) : null; setApproveDialog({ id: req.id, requestedQty: aq, isDelete: req.type === "delete" }); setApprovedQtyInput(aq ? String(aq) : ""); }} disabled={processingId === req.id}
                      className="flex-1 min-w-[80px] bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl py-2 text-xs font-semibold hover:bg-green-500/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                      {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Reason Dialog */}
      {cancelDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border shadow-2xl w-full max-w-sm" style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.10)" }}>
            <div className="p-5">
              <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-t-xl -mx-5 -mt-5 mb-5 rounded-tl-2xl rounded-tr-2xl" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <XCircle size={18} className="text-red-400" />
                </div>
                <h3 className="font-bold text-white text-base">Cancel Request</h3>
              </div>
              <p className="text-sm text-slate-400 mb-3">Please provide a reason for cancelling this request.</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Enter cancel reason..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setCancelDialog(null)} className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors">Back</button>
                <button
                  onClick={async () => { if (!cancelReason.trim()) { toast.error("Cancel reason is required."); return; } const id = cancelDialog.id; setCancelDialog(null); await handleCancel(id, cancelReason.trim()); }}
                  disabled={!cancelReason.trim()}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >Confirm Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve with Qty Dialog */}
      {approveDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border shadow-2xl w-full max-w-sm" style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.10)" }}>
            <div className="p-5">
              <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-xl -mx-5 -mt-5 mb-5 rounded-tl-2xl rounded-tr-2xl" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={18} className="text-green-400" />
                </div>
                <h3 className="font-bold text-white text-base">Approve Request</h3>
              </div>
              {!approveDialog.isDelete && approveDialog.requestedQty !== null && (
                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-2">Requested Qty: <strong className="text-white">{approveDialog.requestedQty} pcs</strong></p>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Approved Qty (optional — leave blank to use requested)</label>
                  <input
                    type="number"
                    min={1}
                    value={approvedQtyInput}
                    onChange={e => setApprovedQtyInput(e.target.value)}
                    placeholder={String(approveDialog.requestedQty)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  />
                </div>
              )}
              {approveDialog.isDelete && <p className="text-sm text-slate-400 mb-4">Are you sure you want to approve this delete request? This action cannot be undone.</p>}
              <div className="flex gap-3">
                <button onClick={() => setApproveDialog(null)} className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors">Back</button>
                <button
                  onClick={async () => { const id = approveDialog.id; const aq = approvedQtyInput ? parseInt(approvedQtyInput) : undefined; setApproveDialog(null); await handleApprove(id, aq); }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90"
                >Confirm Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Process Approve Dialog */}
      {processDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border shadow-2xl w-full max-w-sm" style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.10)" }}>
            <div className="p-5">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-600 rounded-t-xl -mx-5 -mt-5 mb-5 rounded-tl-2xl rounded-tr-2xl" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-300 text-lg">⚙</span>
                </div>
                <h3 className="font-bold text-white text-base">Process Approve Request</h3>
              </div>
              {processDialog.requestedQty !== null && (
                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-2">Requested Qty: <strong className="text-white">{processDialog.requestedQty} pcs</strong></p>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Approved Qty (optional — leave blank to use requested)</label>
                  <input
                    type="number"
                    min={1}
                    value={processQtyInput}
                    onChange={e => setProcessQtyInput(e.target.value)}
                    placeholder={String(processDialog.requestedQty)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                </div>
              )}
              <p className="text-xs text-slate-500 mb-4">This marks the request as "In Process". Level 2 final approval is still required.</p>
              <div className="flex gap-3">
                <button onClick={() => setProcessDialog(null)} className="flex-1 border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors">Back</button>
                <button
                  onClick={async () => { const id = processDialog.id; const pq = processQtyInput ? parseInt(processQtyInput) : undefined; setProcessDialog(null); await handleProcessApprove(id, pq); }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90"
                >Confirm Process</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Admin Notifications Tab ─────────────────────────────────────────────────
function AdminNotificationsTab() {
  const { getAdminPassword } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendBroadcast = trpc.notifications.sendBroadcast.useMutation({
    onSuccess: () => {
      toast.success("Notification broadcast to all workers!");
      setTitle("");
      setMessage("");
      setSending(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send notification.");
      setSending(false);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!message.trim()) { toast.error("Message is required."); return; }
    const pw = getAdminPassword();
    if (!pw) { toast.error("Admin session expired. Please log in again."); return; }
    setSending(true);
    sendBroadcast.mutate({ adminPassword: pw, title: title.trim(), message: message.trim() });
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <BellRing size={22} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Broadcast Notification</h2>
          <p className="text-sm text-slate-400">Send a custom notification to all workers</p>
        </div>
      </div>

      {/* Compose Form */}
      <form onSubmit={handleSend} className="rounded-2xl border p-6 space-y-4" style={{ background: "rgba(30,41,59,0.75)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.10)" }}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Notification Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. System Update, Important Notice"
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
          <p className="text-xs text-slate-500 text-right">{title.length}/100</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your notification message here..."
            maxLength={500}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
          />
          <p className="text-xs text-slate-500 text-right">{message.length}/500</p>
        </div>
        <button
          type="submit"
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? "Sending..." : "Send to All Workers"}
        </button>
      </form>

      {/* Info */}
      <div className="rounded-xl border p-4 flex gap-3" style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.25)" }}>
        <Bell size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-300">
          <p className="font-semibold mb-1">Broadcast Notification</p>
          <p className="text-amber-400/80">This notification will appear in the <strong className="text-amber-300">Alerts</strong> tab of all workers immediately. Workers can also send custom alerts to each other from the Chat page.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Security Audit Log Tab ─────────────────────────────────────────────────
const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  employee_id_changed:     { label: "Employee ID Changed",     color: "#f59e0b", icon: "🪪" },
  display_name_changed:    { label: "Display Name Changed",    color: "#6366f1", icon: "✏️" },
  profile_picture_changed: { label: "Profile Picture Changed", color: "#22d3ee", icon: "🖼️" },
};

function SecurityAuditLogTab({ isDark }: { isDark: boolean }) {
  const [filterAction, setFilterAction] = useState("");
  const [filterWorker, setFilterWorker] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const logsQuery = trpc.profile.listAuditLogs.useQuery(
    { limit: 200 },
    { refetchInterval: 15000 }
  );

  const logs = (logsQuery.data ?? []).filter((log) => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterWorker && !log.workerID.toLowerCase().includes(filterWorker.toLowerCase()) &&
        !log.workerName.toLowerCase().includes(filterWorker.toLowerCase())) return false;
    if (searchInput) {
      const q = searchInput.toLowerCase();
      if (!log.workerID.toLowerCase().includes(q) &&
          !log.workerName.toLowerCase().includes(q) &&
          !log.department.toLowerCase().includes(q) &&
          !(log.oldValue ?? "").toLowerCase().includes(q) &&
          !(log.newValue ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.92)";
  const borderCol = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/25">
          <ShieldAlert size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Security Audit Log</h2>
          <p className="text-sm" style={{ color: "rgba(148,163,184,1)" }}>Profile &amp; identity change history</p>
        </div>
        <button
          onClick={() => logsQuery.refetch()}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <RefreshCw size={13} className={logsQuery.isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <input
          type="text"
          placeholder="Search worker / ID / value…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
        />
        {/* Action filter pills */}
        <div className="flex gap-1 flex-wrap">
          {["", "employee_id_changed", "display_name_changed", "profile_picture_changed"].map((a) => {
            const meta = a ? ACTION_LABELS[a] : null;
            const active = filterAction === a;
            return (
              <button
                key={a}
                onClick={() => setFilterAction(a)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? (meta?.color ?? "#6366f1") + "33" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${active ? (meta?.color ?? "#6366f1") + "66" : "rgba(255,255,255,0.10)"}`,
                  color: active ? (meta?.color ?? "#a5b4fc") : "rgba(148,163,184,1)",
                }}
              >
                {a ? `${meta?.icon} ${meta?.label}` : "All Actions"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(ACTION_LABELS).map(([key, meta]) => {
          const count = (logsQuery.data ?? []).filter(l => l.action === key).length;
          return (
            <div key={key} className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: cardBg, border: `1px solid ${borderCol}`, backdropFilter: "blur(12px)" }}>
              <span className="text-2xl">{meta.icon}</span>
              <div>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-xs" style={{ color: meta.color }}>{meta.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading / empty */}
      {logsQuery.isLoading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 size={24} className="animate-spin text-teal-400" />
          <span className="text-slate-400">Loading audit logs…</span>
        </div>
      )}
      {!logsQuery.isLoading && logs.length === 0 && (
        <div className="text-center py-16">
          <ShieldAlert size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-medium">No audit entries found</p>
          <p className="text-slate-600 text-sm mt-1">Profile changes will appear here automatically</p>
        </div>
      )}

      {/* Desktop table */}
      {!logsQuery.isLoading && logs.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-xl" style={{ border: `1px solid ${borderCol}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${borderCol}` }}>
                {["#", "Action", "Worker", "Department", "Old Value", "New Value", "Date & Time"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "rgba(148,163,184,1)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "#94a3b8", icon: "🔒" };
                return (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${borderCol}` }}
                    className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: meta.color + "22", color: meta.color, border: `1px solid ${meta.color}44` }}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{log.workerName}</p>
                      <p className="text-xs" style={{ color: "rgba(148,163,184,1)" }}>{log.workerID}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{log.department}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>
                        {log.oldValue ? (log.oldValue.startsWith("/manus-storage") ? "[image]"
                          : log.oldValue.length > 30 ? log.oldValue.slice(0, 30) + "…" : log.oldValue) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac" }}>
                        {log.newValue ? (log.newValue.startsWith("/manus-storage") ? "[image]"
                          : log.newValue.length > 30 ? log.newValue.slice(0, 30) + "…" : log.newValue) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(148,163,184,1)" }}>
                      {new Date(log.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!logsQuery.isLoading && logs.length > 0 && (
        <div className="md:hidden space-y-3">
          {logs.map((log, idx) => {
            const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "#94a3b8", icon: "🔒" };
            return (
              <div key={log.id} className="rounded-2xl p-4 space-y-3"
                style={{ background: "rgba(15,23,42,0.85)", border: `1px solid ${meta.color}33`, backdropFilter: "blur(16px)" }}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: meta.color + "22", color: meta.color, border: `1px solid ${meta.color}44` }}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(100,116,139,1)" }}>#{idx + 1}</span>
                </div>
                {/* Worker info */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${meta.color}66, ${meta.color}33)` }}>
                    {log.workerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{log.workerName}</p>
                    <p className="text-xs" style={{ color: "rgba(148,163,184,1)" }}>{log.workerID} · {log.department}</p>
                  </div>
                </div>
                {/* Change */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-2" style={{ background: "rgba(239,68,68,0.10)" }}>
                    <p className="text-xs mb-0.5" style={{ color: "rgba(252,165,165,0.7)" }}>Old</p>
                    <p className="text-xs font-medium" style={{ color: "#fca5a5" }}>
                      {log.oldValue ? (log.oldValue.startsWith("/manus-storage") ? "[image]" : log.oldValue) : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: "rgba(34,197,94,0.10)" }}>
                    <p className="text-xs mb-0.5" style={{ color: "rgba(134,239,172,0.7)" }}>New</p>
                    <p className="text-xs font-medium" style={{ color: "#86efac" }}>
                      {log.newValue ? (log.newValue.startsWith("/manus-storage") ? "[image]" : log.newValue) : "—"}
                    </p>
                  </div>
                </div>
                {/* Timestamp */}
                <p className="text-xs" style={{ color: "rgba(100,116,139,1)" }}>
                  🕐 {new Date(log.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      {!logsQuery.isLoading && logs.length > 0 && (
        <p className="text-center text-xs" style={{ color: "rgba(100,116,139,1)" }}>
          Showing {logs.length} of {logsQuery.data?.length ?? 0} entries
        </p>
      )}
    </div>
  );
}

// ─── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { logoutAdmin, getAdminPassword } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ tab?: string }>();

  type TabId = "dashboard" | "workers" | "orders" | "deleted_logs" | "pending_requests" | "contact_messages" | "announcements" | "maintenance" | "settings" | "notifications" | "audit_log";

  // Map URL slug → tab id
  const SLUG_TO_TAB: Record<string, TabId> = {
    dashboard: "dashboard",
    home: "dashboard",
    worker: "workers",
    workers: "workers",
    order: "orders",
    orders: "orders",
    "deleted-log": "deleted_logs",
    "deleted-logs": "deleted_logs",
    request: "pending_requests",
    requests: "pending_requests",
    message: "contact_messages",
    messages: "contact_messages",
    announcement: "announcements",
    announcements: "announcements",
    notification: "notifications",
    notifications: "notifications",
    audit: "audit_log",
    "audit-log": "audit_log",
    maintenance: "maintenance",
    settings: "settings",
  };
  // Map tab id → URL slug
  const TAB_TO_SLUG: Record<TabId, string> = {
    dashboard: "",
    workers: "worker",
    orders: "order",
    deleted_logs: "deleted-log",
    pending_requests: "request",
    contact_messages: "message",
    announcements: "announcement",
    notifications: "notification",
    audit_log: "audit-log",
    maintenance: "maintenance",
    settings: "setting",
  };

  const activeTab: TabId = (params.tab && SLUG_TO_TAB[params.tab]) ? SLUG_TO_TAB[params.tab] : "dashboard";

  const setActiveTab = (tab: TabId) => {
    navigate(tab === "dashboard" ? "/admin" : `/admin/${TAB_TO_SLUG[tab]}`);
  };
  const maintenanceQuery = trpc.system.getMaintenanceStatus.useQuery(undefined, { refetchInterval: 10000 });
  const scheduleQuery = trpc.system.getScheduledMaintenance.useQuery(undefined, { refetchInterval: 15000 });
  const setMaintenanceMutation = trpc.system.setMaintenanceMode.useMutation({
    onSuccess: (data) => {
      maintenanceQuery.refetch();
      toast.success(data.maintenanceMode ? "Maintenance Mode ON — Users will see maintenance page" : "Maintenance Mode OFF — App is live");
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });
  const scheduleMaintenanceMutation = trpc.system.scheduleMaintenanceWindow.useMutation({
    onSuccess: () => {
      scheduleQuery.refetch();
      toast.success("Maintenance window scheduled! System will auto-enable/disable maintenance at the set times.");
    },
    onError: (err) => toast.error("Schedule failed: " + err.message),
  });
  const cancelScheduleMutation = trpc.system.cancelScheduledMaintenance.useMutation({
    onSuccess: () => {
      scheduleQuery.refetch();
      toast.success("Scheduled maintenance cancelled.");
    },
    onError: (err) => toast.error("Cancel failed: " + err.message),
  });
  const generateMsgMutation = trpc.system.generateMaintenanceMessage.useMutation({
    onSuccess: (data) => {
      if (data.message) {
        setMaintenanceMsg(data.message);
        toast.success("Message generated!");
      }
    },
    onError: (err) => toast.error("Generate failed: " + err.message),
  });
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  // Schedule datetime state (local datetime-local input format: "YYYY-MM-DDTHH:mm")
  const toLocalInput = (ms: number | null) => {
    if (!ms) return "";
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  // Populate from existing schedule
  useEffect(() => {
    if (scheduleQuery.data?.startTime && !scheduleStart) setScheduleStart(toLocalInput(scheduleQuery.data.startTime));
    if (scheduleQuery.data?.endTime && !scheduleEnd) setScheduleEnd(toLocalInput(scheduleQuery.data.endTime));
    if (scheduleQuery.data?.message && !maintenanceMsg) setMaintenanceMsg(scheduleQuery.data.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleQuery.data]);
  const styleInjected = useRef(false);
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = ADMIN_ANIM_STYLES + ADMIN_LIGHT_STYLES;
    document.head.appendChild(el);
  }, []);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // "system" = follow OS, "dark" = forced dark, "light" = forced light
  // Theme locked to dark glassmorphism permanently
  const statsQuery = trpc.orders.adminStats.useQuery(undefined, { refetchInterval: 30000 });
  const stats = statsQuery.data;
  const [sitemapCiRefresh, setSitemapCiRefresh] = useState(0);
  const sitemapCiQuery = trpc.system.getSitemapCiStatus.useQuery(
    { force: sitemapCiRefresh > 0 },
    { refetchInterval: 5 * 60 * 1000 },
  );

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: <Monitor size={16} />, color: "indigo" },
    { id: "workers" as const, label: "Workers", icon: <Users size={16} />, color: "blue" },
    { id: "orders" as const, label: "Orders", icon: <Package size={16} />, color: "green" },
    { id: "deleted_logs" as const, label: "Deleted Logs", icon: <History size={16} />, color: "red" },
    { id: "pending_requests" as const, label: "Requests", icon: <ClipboardList size={16} />, color: "orange" },
    { id: "contact_messages" as const, label: "Messages", icon: <Inbox size={16} />, color: "purple" },
    { id: "announcements" as const, label: "Announcements", icon: <Megaphone size={16} />, color: "indigo" },
    { id: "notifications" as const, label: "Notifications", icon: <Bell size={16} />, color: "amber" },
    { id: "audit_log" as const, label: "Audit Log", icon: <ShieldAlert size={16} />, color: "teal" },
    { id: "maintenance" as const, label: "Maintenance", icon: <Wrench size={16} />, color: "red" },
    { id: "settings" as const, label: "Settings", icon: <Settings2 size={16} />, color: "slate" },
  ];
  const tabDescriptions: Record<TabId, string> = {
    dashboard: "A role-based overview of people, stock, approvals and platform operations.",
    workers: "Manage team members, access levels, and active device sessions.",
    orders: "Review live stock records, quantities, and submitted production orders.",
    deleted_logs: "Inspect archived records and approved deletions for accountability.",
    pending_requests: "Approve, reject, and monitor stock workflow requests.",
    contact_messages: "Handle incoming support conversations and follow-up messages.",
    announcements: "Publish operational updates and system-wide communications.",
    notifications: "Review delivery history and manage administrator notifications.",
    audit_log: "Track protected profile and account changes across the system.",
    maintenance: "Control maintenance mode and schedule service windows.",
    settings: "Manage administrator credentials and platform preferences.",
  };
  const activeTabInfo = tabs.find(tab => tab.id === activeTab) ?? tabs[0];
  const roleQuickActions: Array<{
    role: string;
    action: string;
    description: string;
    tab: TabId;
    icon: React.ReactNode;
    tone: "indigo" | "blue" | "orange" | "violet" | "rose";
    badge?: number;
  }> = [
    {
      role: "Workforce Admin",
      action: "Manage workers",
      description: "Add, edit and secure worker access.",
      tab: "workers",
      icon: <Users size={19} />,
      tone: "indigo",
    },
    {
      role: "Stock Controller",
      action: "Review stock",
      description: "Check live stock and low-quantity records.",
      tab: "orders",
      icon: <Package size={19} />,
      tone: "blue",
      badge: stats?.lowStockCount ?? 0,
    },
    {
      role: "Approval Lead",
      action: "Process requests",
      description: "Resolve pending workflow approvals.",
      tab: "pending_requests",
      icon: <ClipboardList size={19} />,
      tone: "orange",
      badge: stats?.pendingRequests ?? 0,
    },
    {
      role: "Communications Lead",
      action: "Publish update",
      description: "Create operational announcements.",
      tab: "announcements",
      icon: <Megaphone size={19} />,
      tone: "violet",
    },
    {
      role: "System Administrator",
      action: "System control",
      description: "Review maintenance and platform settings.",
      tab: "maintenance",
      icon: <Wrench size={19} />,
      tone: "rose",
      badge: maintenanceQuery.data?.maintenanceMode ? 1 : 0,
    },
  ];

  // ── Dedicated Admin light-mode design tokens ───────────────────────────────
  const bg = { background: "linear-gradient(145deg, #f8fbff 0%, #eef4ff 48%, #fdfdff 100%)" };
  const headerBg = "rgba(255,255,255,0.92)";
  const headerBorder = "border-slate-200/90";
  const cardBg = "rgba(255,255,255,0.88)";
  const cardBorder = "rgba(203,213,225,0.78)";
  const tabBarBg = "rgba(255,255,255,0.92)";
  const tabBarBorder = "rgba(203,213,225,0.82)";
  const contentBg = "rgba(255,255,255,0.94)";
  const contentBorder = "rgba(203,213,225,0.78)";
  const titleColor = "text-slate-950";
  const subtitleColor = "text-slate-500";
  const statLabelColor = "text-slate-500";
  const statValueColor = "text-slate-950";
  const tabInactive = "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50";
  const backBtnClass = "text-slate-500 hover:text-indigo-700 hover:bg-indigo-50";
  const activeBadgeBg = "bg-emerald-50 border-emerald-200";
  const activeBadgeText = "text-emerald-700";
  const activeBadgeDot = "bg-emerald-500";
  const logoutBtnClass = "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700";
  const isDark = false;

  return (
    <div className="admin-light min-h-screen" style={bg}>
      <div className="fixed inset-0 opacity-[0.055] pointer-events-none" style={{ backgroundImage: "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      {/* Fixed light ambient accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #c7d2fe, transparent 68%)", animation: "adminPanelFloat 14s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-25" style={{ background: "radial-gradient(circle, #bfdbfe, transparent 68%)", animation: "adminPanelFloat 18s ease-in-out 4s infinite" }} />
      </div>
      {/* Header */}
      <header className={`sticky top-0 z-20 border-b ${headerBorder}`} style={{ background: headerBg, backdropFilter: "blur(20px)" }}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <img src={LOGO_URL} alt="GSPP" className="h-7 w-7 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`text-base lg:text-lg font-bold tracking-tight ${titleColor}`}>{activeTab === "dashboard" ? "Admin Control Center" : activeTabInfo.label}</h1>
            <p className={`text-[10px] lg:text-xs font-medium ${subtitleColor}`}>{activeTab === "dashboard" ? "Role-based management home" : "Dedicated management page"}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 rounded-xl px-2.5 py-1.5" style={{ background: "#eef2ff", border: "1px solid #c7d2fe" }}>
              <Sun size={13} className="text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700">Light Mode</span>
            </div>
            <div className={`hidden md:flex items-center gap-2 border rounded-xl px-3 py-1.5 ${activeBadgeBg}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${activeBadgeDot}`}></span>
              <span className={`text-xs font-semibold ${activeBadgeText}`}>Admin Active</span>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`flex items-center gap-1.5 text-xs lg:text-sm px-3 py-2 rounded-xl font-bold transition-all ${logoutBtnClass}`}
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Maintenance Mode Warning Banner */}
      {maintenanceQuery.data?.maintenanceMode && (
        <div className="bg-red-500/15 border-b border-red-500/30">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <ShieldAlert size={14} className="text-red-400" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">MAINTENANCE ON</span>
                <span className="text-xs font-medium text-red-300/80">All workers are currently seeing the maintenance page. Turn OFF when done.</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("maintenance")}
              className="flex-shrink-0 text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              Manage
            </button>
          </div>
        </div>
      )}

      {activeTab === "dashboard" && <>
      {/* Stats Grid */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10 py-5 md:py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Current Stock */}
          <div className="admin-light-surface rounded-2xl border p-4 lg:p-5 transition-all group" style={{ background: cardBg, backdropFilter: "blur(12px)", borderColor: cardBorder }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <Package size={18} className="text-white" />
              </div>
              <div>
                <p className={`text-[10px] lg:text-xs font-semibold uppercase tracking-wide ${statLabelColor}`}>Current</p>
                <p className={`text-xl lg:text-2xl font-bold leading-none mt-0.5 ${statValueColor}`}>
                  {statsQuery.isLoading ? "..." : (stats?.totalCurrent ?? 0)}
                </p>
              </div>
            </div>
          </div>
          {/* Out of Stock */}
          <div className="admin-light-surface rounded-2xl border p-4 lg:p-5 transition-all group" style={{ background: cardBg, backdropFilter: "blur(12px)", borderColor: cardBorder }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-md shadow-slate-500/20 group-hover:scale-105 transition-transform">
                <Inbox size={18} className="text-white" />
              </div>
              <div>
                <p className={`text-[10px] lg:text-xs font-semibold uppercase tracking-wide ${statLabelColor}`}>Out of Stock</p>
                <p className={`text-xl lg:text-2xl font-bold leading-none mt-0.5 ${statValueColor}`}>
                  {statsQuery.isLoading ? "..." : (stats?.totalOutOfStock ?? 0)}
                </p>
              </div>
            </div>
          </div>
          {/* Pending */}
          <div onClick={() => setActiveTab("pending_requests")} className="admin-light-surface rounded-2xl border p-4 lg:p-5 transition-all group cursor-pointer" style={{ background: (stats?.pendingRequests ?? 0) > 0 ? "#fff7ed" : cardBg, backdropFilter: "blur(12px)", borderColor: (stats?.pendingRequests ?? 0) > 0 ? "#fdba74" : cardBorder }}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ${(stats?.pendingRequests ?? 0) > 0 ? "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30" : "bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/10"}`}>
                <ClipboardList size={18} className="text-white" />
              </div>
              <div>
                <p className={`text-[10px] lg:text-xs font-semibold uppercase tracking-wide ${statLabelColor}`}>Pending</p>
                <p className={`text-xl lg:text-2xl font-bold leading-none mt-0.5 ${(stats?.pendingRequests ?? 0) > 0 ? "text-orange-500" : statValueColor}`}>
                  {statsQuery.isLoading ? "..." : (stats?.pendingRequests ?? 0)}
                </p>
              </div>
            </div>
          </div>
          {/* Low Stock */}
          <div onClick={() => setActiveTab("orders")} className="admin-light-surface rounded-2xl border p-4 lg:p-5 transition-all group cursor-pointer" style={{ background: (stats?.lowStockCount ?? 0) > 0 ? "#fffbeb" : cardBg, backdropFilter: "blur(12px)", borderColor: (stats?.lowStockCount ?? 0) > 0 ? "#fcd34d" : cardBorder }}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ${(stats?.lowStockCount ?? 0) > 0 ? "bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/30" : "bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/10"}`}>
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <p className={`text-[10px] lg:text-xs font-semibold uppercase tracking-wide ${statLabelColor}`}>Low Stock</p>
                <p className={`text-xl lg:text-2xl font-bold leading-none mt-0.5 ${(stats?.lowStockCount ?? 0) > 0 ? "text-amber-500" : statValueColor}`}>
                  {statsQuery.isLoading ? "..." : (stats?.lowStockCount ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10 pb-5 md:pb-6">
        <SitemapCiStatusBadge
          status={sitemapCiQuery.data?.status}
          message={sitemapCiQuery.data?.message}
          updatedAt={sitemapCiQuery.data?.updatedAt}
          branch={sitemapCiQuery.data?.branch}
          commit={sitemapCiQuery.data?.commit}
          workflowUrl={sitemapCiQuery.data?.workflowUrl}
          runUrl={sitemapCiQuery.data?.runUrl}
          isLoading={sitemapCiQuery.isLoading || sitemapCiQuery.isFetching}
          onRefresh={() => setSitemapCiRefresh(value => value + 1)}
        />
      </div>

      {/* Role-Based Quick Actions */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10 pb-5 md:pb-6">
        <div className="admin-light-surface rounded-2xl border p-4 lg:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Zap size={15} />
                </div>
                <p className="text-sm font-extrabold text-slate-950">Role-based quick actions</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">Jump directly to the management workflow assigned to each administrator role.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
              <Shield size={12} /> Full admin access
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {roleQuickActions.map((item) => {
              const toneClasses = {
                indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/70",
                blue: "bg-blue-50 text-blue-600 ring-blue-100 hover:border-blue-200 hover:bg-blue-50/70",
                orange: "bg-orange-50 text-orange-600 ring-orange-100 hover:border-orange-200 hover:bg-orange-50/70",
                violet: "bg-violet-50 text-violet-600 ring-violet-100 hover:border-violet-200 hover:bg-violet-50/70",
                rose: "bg-rose-50 text-rose-600 ring-rose-100 hover:border-rose-200 hover:bg-rose-50/70",
              }[item.tone];
              const isCurrent = activeTab === item.tab;
              return (
                <button
                  type="button"
                  key={item.role}
                  onClick={() => setActiveTab(item.tab)}
                  className={`group relative flex min-h-[116px] flex-col items-start rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${isCurrent ? "border-indigo-300 shadow-md shadow-indigo-100" : ""}`}
                  aria-label={`${item.action}: ${item.description}`}
                >
                  <div className="mb-3 flex w-full items-center justify-between">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${toneClasses}`}>
                      {item.icon}
                    </span>
                    {item.badge && item.badge > 0 ? (
                      <span className="min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white shadow-sm">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : isCurrent ? (
                      <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">OPEN</span>
                    ) : null}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{item.role}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900">{item.action}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      </>}

      {/* Tab Navigation */}
      <div className="hidden sm:block max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10">
        <div className="admin-light-surface flex gap-1 rounded-2xl border p-1.5 overflow-x-auto" style={{ background: tabBarBg, backdropFilter: "blur(12px)", borderColor: tabBarBorder }}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            const colorMap: Record<string, string> = {
              blue: isActive ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25" : tabInactive,
              green: isActive ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25" : tabInactive,
              red: isActive ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25" : tabInactive,
              orange: isActive ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25" : tabInactive,
              purple: isActive ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25" : tabInactive,
              indigo: isActive ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25" : tabInactive,
              slate: isActive ? "bg-gradient-to-r from-slate-500 to-slate-700 text-white shadow-lg shadow-slate-500/25" : tabInactive,
              amber: isActive ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/25" : tabInactive,
              teal: isActive ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25" : tabInactive,
            };
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 lg:px-4 py-2.5 text-xs lg:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${colorMap[t.color]}`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dedicated management page content */}
      {activeTab !== "dashboard" && <main className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10 py-5 md:py-6 pb-[80px] sm:pb-6">
        <div className="admin-light-surface rounded-2xl border p-4 lg:p-6" style={{ background: contentBg, backdropFilter: "blur(12px)", borderColor: contentBorder }}>
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                {activeTabInfo.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Admin workspace</p>
                <h2 className="text-lg font-extrabold text-slate-950">{activeTabInfo.label}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{tabDescriptions[activeTab]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <ArrowLeft size={13} /> Control Center
              </button>
              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live management
              </div>
            </div>
          </div>
          {activeTab === "workers" && <WorkersTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "deleted_logs" && <DeletedLogsTab />}
          {activeTab === "pending_requests" && <PendingRequestsTab />}
          {activeTab === "contact_messages" && <ContactMessagesTab />}
          {activeTab === "announcements" && <AnnouncementsTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "notifications" && <AdminNotificationsTab />}
          {activeTab === "audit_log" && <SecurityAuditLogTab isDark={isDark} />}
          {activeTab === "maintenance" && (
            <div className="max-w-xl mx-auto py-8 space-y-6">
              {/* Status card */}
              <div className={`rounded-2xl border-2 p-6 transition-all ${
                maintenanceQuery.data?.maintenanceMode
                  ? "border-red-500/40 bg-red-500/10"
                  : "border-emerald-500/40 bg-emerald-500/10"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-md ${
                    maintenanceQuery.data?.maintenanceMode
                      ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20"
                      : "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20"
                  }`}>
                    {maintenanceQuery.data?.maintenanceMode
                      ? <ShieldAlert size={26} className="text-white" />
                      : <Power size={26} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-lg font-bold ${titleColor}`}>Maintenance Mode</h2>
                    <p className={`text-sm font-semibold mt-0.5 ${
                      maintenanceQuery.data?.maintenanceMode
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}>
                      {maintenanceQuery.data?.maintenanceMode ? "🔴 Currently ON — App is under maintenance" : "🟢 Currently OFF — App is live"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom message */}
              <div className="rounded-2xl border p-5 space-y-3" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}>
                <label className={`text-sm font-semibold block ${"text-slate-200"}`}>Custom Maintenance Message (optional)</label>
                <textarea
                  className={`w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${"border-white/10 bg-white/5 text-white placeholder-slate-500"}`}
                  rows={3}
                  placeholder="e.g. Estimated downtime: 01/07/2026 08:15 AM — system will be back to normal."
                  value={maintenanceMsg}
                  onChange={e => setMaintenanceMsg(e.target.value)}
                />
                <p className={`text-xs ${"text-slate-500"}`}>Leave empty to show the default message. End Time is auto-filled when you set the schedule.</p>
              </div>

              {/* Manual toggle buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setMaintenanceMutation.mutate({ enabled: true, message: maintenanceMsg, adminPassword: getAdminPassword() })}
                  disabled={setMaintenanceMutation.isPending || maintenanceQuery.data?.maintenanceMode === true}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {setMaintenanceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                  Turn ON Now
                </button>
                <button
                  onClick={() => setMaintenanceMutation.mutate({ enabled: false, message: "", adminPassword: getAdminPassword() })}
                  disabled={setMaintenanceMutation.isPending || maintenanceQuery.data?.maintenanceMode === false}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {setMaintenanceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                  Turn OFF Now
                </button>
              </div>

              {/* Scheduled Maintenance Window */}
              <div className="rounded-2xl border p-5 space-y-4" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <CalendarClock size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${titleColor}`}>Schedule Maintenance Window</h3>
                    <p className={`text-xs ${"text-slate-400"}`}>System will auto-enable and auto-disable maintenance at the set times</p>
                  </div>
                </div>

                {/* Show existing schedule if any */}
                {scheduleQuery.data?.startTaskUid && (
                  <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-300">Scheduled Window Active</p>
                        <p className="text-xs text-blue-400/80">
                          ON: {scheduleQuery.data.startTime ? new Date(scheduleQuery.data.startTime).toLocaleString() : "—"}
                          {" → "}
                          OFF: {scheduleQuery.data.endTime ? new Date(scheduleQuery.data.endTime).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelScheduleMutation.mutate({ adminPassword: getAdminPassword() })}
                      disabled={cancelScheduleMutation.isPending}
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      {cancelScheduleMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                      Cancel
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold ${"text-slate-300"}`}>Start Time (Maintenance ON)</label>
                    <input
                      type="datetime-local"
                      className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${"border-white/10 bg-white/5 text-white"}`}
                      value={scheduleStart}
                      onChange={e => setScheduleStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold ${"text-slate-300"}`}>End Time (Maintenance OFF)</label>
                    <input
                      type="datetime-local"
                      className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${"border-white/10 bg-white/5 text-white"}`}
                      value={scheduleEnd}
                      onChange={e => {
                        setScheduleEnd(e.target.value);
                        if (e.target.value) {
                          const d = new Date(e.target.value);
                          const pad = (n: number) => String(n).padStart(2, "0");
                          const day = pad(d.getDate());
                          const month = pad(d.getMonth() + 1);
                          const year = d.getFullYear();
                          const hours = d.getHours();
                          const minutes = pad(d.getMinutes());
                          const ampm = hours >= 12 ? "PM" : "AM";
                          const h12 = hours % 12 === 0 ? 12 : hours % 12;
                          setMaintenanceMsg(`Estimated downtime: ${day}/${month}/${year} ${pad(h12)}:${minutes} ${ampm} — system will be back to normal.`);
                        }
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!scheduleStart || !scheduleEnd) {
                      toast.error("Please set both start and end times.");
                      return;
                    }
                    const startMs = new Date(scheduleStart).getTime();
                    const endMs = new Date(scheduleEnd).getTime();
                    if (startMs >= endMs) {
                      toast.error("Start time must be before end time.");
                      return;
                    }
                    if (startMs <= Date.now()) {
                      toast.error("Start time must be in the future.");
                      return;
                    }
                    scheduleMaintenanceMutation.mutate({
                      startTime: startMs,
                      endTime: endMs,
                      message: maintenanceMsg || undefined,
                      adminPassword: getAdminPassword(),
                    });
                  }}
                  disabled={scheduleMaintenanceMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
                >
                  {scheduleMaintenanceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CalendarClock size={16} />}
                  Schedule Maintenance Window
                </button>
                <p className={`text-xs text-center ${"text-slate-500"}`}>Times are in your local timezone. System will auto-trigger at the scheduled times after deployment.</p>
              </div>

              <p className={`text-xs text-center ${"text-slate-500"}`}>
                Admin users can still access the app while maintenance mode is ON.
              </p>
            </div>
          )}
        </div>
      </main>}

      {/* ── Mobile Bottom Navigation (sm and below only) ─────────────────── */}
      <div className="admin-light-mobile-nav sm:hidden fixed bottom-0 left-0 right-0 z-40" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid #e2e8f0" }}>
        {/* More Drawer — slides up from bottom */}
        {showMoreDrawer && (
          <div className="admin-light-drawer absolute bottom-full left-0 right-0 rounded-t-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(24px)", border: "1px solid #e2e8f0", borderBottom: "none" }}>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: "#cbd5e1" }} />
            </div>
            <div className="flex items-start justify-between gap-3 px-4 pb-3">
              <div>
                <p className="text-sm font-extrabold text-slate-900">More admin tools</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">System controls and management settings</p>
              </div>
              <button
                onClick={() => setShowMoreDrawer(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close more admin tools"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 pb-4 grid grid-cols-3 gap-2">
              {[
                { id: "contact_messages" as const, label: "Messages", icon: <Inbox size={20} />, grad: "from-violet-500 to-purple-600" },
                { id: "deleted_logs" as const, label: "Deleted Logs", icon: <History size={20} />, grad: "from-red-500 to-rose-600" },
                { id: "announcements" as const, label: "Announcements", icon: <Megaphone size={20} />, grad: "from-indigo-500 to-violet-600" },
                { id: "notifications" as const, label: "Notifications", icon: <Bell size={20} />, grad: "from-amber-500 to-yellow-600" },
                { id: "audit_log" as const, label: "Audit Log", icon: <ShieldAlert size={20} />, grad: "from-teal-500 to-cyan-600" },
                { id: "maintenance" as const, label: "Maintenance", icon: <Wrench size={20} />, grad: "from-red-600 to-rose-700" },
                { id: "settings" as const, label: "Settings", icon: <Settings2 size={20} />, grad: "from-slate-500 to-slate-700" },
              ].map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTab(t.id); setShowMoreDrawer(false); }}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all"
                    style={isActive ? { background: "#eef2ff", border: "1px solid #c7d2fe" } : { background: "#ffffff", border: "1px solid #e2e8f0" }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${t.grad}`}>
                      <span className="text-white">{t.icon}</span>
                    </div>
                    <span className="text-[10px] font-semibold leading-tight text-center" style={{ color: isActive ? "#4338ca" : "#64748b" }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Backdrop tap to close */}
            <button className="absolute inset-0 -z-10" onClick={() => setShowMoreDrawer(false)} />
          </div>
        )}
        {/* Backdrop for drawer */}
        {showMoreDrawer && (
          <div className="fixed inset-0 -z-10 bg-slate-950/20" onClick={() => setShowMoreDrawer(false)} />
        )}
        {/* Primary 5-tab bar */}
        <div className="flex items-stretch h-[68px] pb-[env(safe-area-inset-bottom)]">
          {([
            { id: "dashboard" as const, label: "Home", icon: <Monitor size={22} /> },
            { id: "workers" as const, label: "Workers", icon: <Users size={22} /> },
            { id: "orders" as const, label: "Orders", icon: <Package size={22} /> },
            { id: "pending_requests" as const, label: "Requests", icon: <ClipboardList size={22} />, badge: (stats?.pendingRequests ?? 0) > 0 ? stats?.pendingRequests : undefined },
          ] as const).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setShowMoreDrawer(false); }}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all"
              >
                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-600" />}
                <div className="relative">
                  <span style={{ color: isActive ? "#4f46e5" : "#64748b" }}>{t.icon}</span>
                  {"badge" in t && t.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1" style={{ background: "#f97316", color: "white" }}>
                      {t.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold" style={{ color: isActive ? "#4f46e5" : "#64748b" }}>{t.label}</span>
              </button>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setShowMoreDrawer(v => !v)}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all"
          >
            {showMoreDrawer && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-600" />}
            <span style={{ color: showMoreDrawer ? "#4f46e5" : "#64748b" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </span>
            <span className="text-[10px] font-semibold" style={{ color: showMoreDrawer ? "#818cf8" : "rgba(148,163,184,0.7)" }}>More</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-4" style={{ background: "rgba(13,17,23,0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.10)" }}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <LogOut size={24} className="text-white" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${titleColor}`}>Confirm Logout</h3>
                <p className={`text-xs ${"text-slate-400"}`}>Admin Session</p>
              </div>
            </div>
            <p className={`text-sm ${"text-slate-300"}`}>Are you sure you want to logout from the Admin Panel? Your admin session will be terminated.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 border rounded-xl py-2.5 text-sm font-semibold transition-colors ${"border-white/10 text-slate-300 hover:bg-white/8"}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logoutAdmin();
                  navigate("/admin");
                  setShowLogoutConfirm(false);
                  toast.success("Logged out successfully");
                }}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl py-2.5 text-sm font-bold hover:from-red-600 hover:to-rose-700 transition-all shadow-md shadow-red-500/30"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const ADMIN_ANIM_STYLES = `
@keyframes adminPanelFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50%       { transform: translateY(-14px) scale(1.04); }
}
@keyframes adminPanelScan {
  0%   { top: -2px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
@keyframes adminPanelPulse {
  0%   { transform: scale(0.95); opacity: 0.6; }
  70%  { transform: scale(1.15); opacity: 0; }
  100% { transform: scale(1.15); opacity: 0; }
}
@keyframes adminCardIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.admin-card-in { animation: adminCardIn 0.45s cubic-bezier(0.22,0.61,0.36,1) both; }
`;

const ADMIN_LIGHT_STYLES = `
/* White-theme Admin Control Center */
.admin-light { color:#0f172a; }
.admin-light ::selection { background:#c7d2fe; color:#312e81; }
.admin-light .text-slate-100,.admin-light .text-slate-200,.admin-light .text-slate-300 { color:#334155 !important; }
.admin-light .text-slate-400,.admin-light .text-slate-500 { color:#64748b !important; }
.admin-light .text-indigo-300,.admin-light .text-indigo-400 { color:#4f46e5 !important; }
.admin-light .text-purple-300,.admin-light .text-purple-400 { color:#7e22ce !important; }
.admin-light .text-blue-300,.admin-light .text-blue-400 { color:#2563eb !important; }
.admin-light .text-emerald-300,.admin-light .text-emerald-400 { color:#047857 !important; }
.admin-light .text-green-300,.admin-light .text-green-400 { color:#15803d !important; }
.admin-light .text-amber-300,.admin-light .text-amber-400 { color:#b45309 !important; }
.admin-light .text-orange-300,.admin-light .text-orange-400 { color:#c2410c !important; }
.admin-light .text-red-300,.admin-light .text-red-400 { color:#dc2626 !important; }
.admin-light .text-white { color:#0f172a !important; }
.admin-light .bg-gradient-to-br.text-white,.admin-light .bg-gradient-to-r.text-white,
.admin-light .bg-gradient-to-br .text-white,.admin-light .bg-gradient-to-r .text-white,
.admin-light button[style*="gradient"] .text-white,.admin-light button[style*="gradient"].text-white { color:#fff !important; }
.admin-light input,.admin-light textarea,.admin-light select {
  background:#fff !important; color:#0f172a !important; border-color:#cbd5e1 !important;
  box-shadow:0 1px 2px rgba(15,23,42,.04) !important;
}
.admin-light input::placeholder,.admin-light textarea::placeholder { color:#94a3b8 !important; }
.admin-light input:focus,.admin-light textarea:focus,.admin-light select:focus {
  border-color:#818cf8 !important; box-shadow:0 0 0 3px rgba(99,102,241,.13) !important;
}
.admin-light [class*="bg-slate-9"],.admin-light [class*="bg-slate-8"],.admin-light [class*="bg-slate-7"],
.admin-light [class*="bg-white/"] { background-color:#fff !important; }
.admin-light [class*="border-white"] { border-color:#e2e8f0 !important; }
.admin-light [class*="hover:text-white"]:hover { color:#4338ca !important; }
.admin-light [class*="hover:bg-white"]:hover { background-color:#f8fafc !important; }
.admin-light [style*="rgba(255,255,255,0.0"],.admin-light [style*="rgba(15,23,42"],
.admin-light [style*="rgba(13,17,23"],.admin-light [style*="rgba(10,14,26"],.admin-light [style*="rgba(15,20,40"] {
  background:#fff !important; border-color:#e2e8f0 !important; box-shadow:0 10px 28px rgba(15,23,42,.06) !important;
}
.admin-light [style*="255, 255, 255, 0.0"],.admin-light [style*="15, 23, 42"],
.admin-light [style*="13, 17, 23"],.admin-light [style*="10, 14, 26"],.admin-light [style*="15, 20, 40"] {
  background:#fff !important; border-color:#e2e8f0 !important; box-shadow:0 10px 28px rgba(15,23,42,.06) !important;
}
.admin-light [style*="rgba(30,41,59"],.admin-light [style*="rgba(51,65,85"],.admin-light [style*="rgba(2,6,23"] {
  background:#fff !important; border-color:#e2e8f0 !important; box-shadow:0 10px 28px rgba(15,23,42,.06) !important;
}
.admin-light [style*="30, 41, 59"],.admin-light [style*="51, 65, 85"],.admin-light [style*="2, 6, 23"] {
  background:#fff !important; border-color:#e2e8f0 !important; box-shadow:0 10px 28px rgba(15,23,42,.06) !important;
}
.admin-light [style*="rgba(255,255,255,0.0"] .text-white,
.admin-light [style*="rgba(15,23,42"] .text-white,
.admin-light [style*="rgba(13,17,23"] .text-white,
.admin-light [style*="rgba(10,14,26"] .text-white,
.admin-light [style*="rgba(15,20,40"] .text-white { color:#0f172a !important; }
.admin-light table { background:#fff; color:#334155; border-collapse:separate; border-spacing:0; }
.admin-light thead { background:#f8fafc !important; }
.admin-light th { color:#475569 !important; font-size:11px; letter-spacing:.06em; text-transform:uppercase; }
.admin-light tr { border-color:#e2e8f0 !important; }
.admin-light tbody tr:hover { background:#f8fafc !important; }
.admin-light [role="dialog"] { color:#0f172a; }
.admin-light [role="dialog"] input,.admin-light [role="dialog"] textarea,.admin-light [role="dialog"] select { background:#fff !important; }
.admin-light [role="dialog"] [class*="bg-slate"],.admin-light [role="dialog"] [class*="bg-white/"] { background:#fff !important; }
.admin-light .admin-light-surface { background:#fff; border:1px solid #e2e8f0; box-shadow:0 12px 32px rgba(15,23,42,.07); }
.admin-light .admin-light-surface:hover { border-color:#c7d2fe; box-shadow:0 18px 36px rgba(79,70,229,.10); transform:translateY(-1px); }
.admin-light .admin-light-tab-active { background:linear-gradient(135deg,#4f46e5,#6366f1); color:#fff !important; box-shadow:0 8px 18px rgba(79,70,229,.22); }
.admin-light .admin-light-mobile-nav { background:rgba(255,255,255,.96) !important; border-top:1px solid #e2e8f0 !important; box-shadow:0 -8px 26px rgba(15,23,42,.08); }
.admin-light .admin-light-drawer { background:#fff !important; border-color:#e2e8f0 !important; box-shadow:0 -18px 44px rgba(15,23,42,.14) !important; }
.admin-light .fixed.inset-0.backdrop-blur-sm {
  backdrop-filter:none !important; -webkit-backdrop-filter:none !important;
  background-color:rgba(15,23,42,.55) !important;
  isolation:isolate; -webkit-backface-visibility:hidden; backface-visibility:hidden;
}
.admin-light [style*="backdrop-filter"],.admin-light [style*="backdropFilter"] {
  backdrop-filter:none !important; -webkit-backdrop-filter:none !important;
}
@media (prefers-reduced-motion: reduce) { .admin-light * { animation-duration:.01ms !important; transition-duration:.01ms !important; } }
`;
