/**
 * UserProfile — /user-profile
 * Self-contained light-mode profile workspace with high-contrast surfaces.
 *
 * Features:
 * - Profile picture upload (click avatar to change)
 * - Display Name edit (7-day cooldown)
 * - Employee ID edit (30-day cooldown)
 * - Read-only: Department, Access Level, Member Since
 */
import { useState, useRef, useCallback, useMemo } from "react";
import {
  Camera, User, IdCard, Building2, Shield, Calendar,
  Edit2, Check, X, Clock, AlertTriangle, Loader2, ChevronLeft,
  PackagePlus, ClipboardCheck, FlaskConical, CalendarDays, ShieldAlert, LogIn, BellRing, ShieldCheck, History,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useLocation } from "wouter";
import { toast } from "sonner";

const DAYS_MS = 24 * 60 * 60 * 1000;

function daysLeft(changedAt: Date | null | undefined, cooldownDays: number): number {
  if (!changedAt) return 0;
  const elapsed = (Date.now() - new Date(changedAt).getTime()) / DAYS_MS;
  return Math.max(0, Math.ceil(cooldownDays - elapsed));
}

function levelInfo(level: string) {
  if (level === "1")
    return {
      text: "Level 1",
      gradient: "from-orange-500 to-amber-500",
      solidGradient: "linear-gradient(135deg,#f59e0b,#d97706)",
      badge: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  if (level === "1.1")
    return {
      text: "Level 1.1",
      gradient: "from-purple-500 to-violet-500",
      solidGradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
      badge: "bg-violet-50 text-violet-700 border border-violet-200",
    };
  return {
    text: "Level 2",
    gradient: "from-emerald-500 to-teal-500",
    solidGradient: "linear-gradient(135deg,#10b981,#059669)",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
}

function PolicyMetric({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "#64748b" }}>{label}</p>
      </div>
      <p className="mt-1 text-xs font-black leading-tight" style={{ color }}>{value}</p>
    </div>
  );
}

function SummaryDetail({ icon, label, value, color, className = "", onEdit, editDisabled = false, editHint }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  className?: string;
  onEdit?: () => void;
  editDisabled?: boolean;
  editHint?: string;
}) {
  return (
    <div className={`min-w-0 rounded-lg px-2.5 py-2 ${className}`} style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(15,23,42,0.035)" }}>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5" style={{ color }}>
          {icon}
          <p className="truncate text-[9px] font-bold uppercase tracking-wide" style={{ color: "#64748b" }}>{label}</p>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={editDisabled ? undefined : onEdit}
            disabled={editDisabled}
            aria-label={`Quick edit ${label}`}
            title={editHint ?? `Quick edit ${label}`}
            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-bold transition-colors"
            style={editDisabled
              ? { background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" }
              : { background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}
          >
            {editDisabled ? <Clock size={10} /> : <Edit2 size={10} />}
            {editDisabled ? "Locked" : "Edit"}
          </button>
        )}
      </div>
      <p className="mt-1 truncate text-xs font-black" style={{ color }} title={value}>{value}</p>
    </div>
  );
}

export default function UserProfile() {
  const { worker, loginWorker } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery(
    { workerID: worker?.workerID ?? "" },
    { enabled: !!worker?.workerID }
  );

  const uploadPicMut  = trpc.profile.uploadPicture.useMutation();
  const updateNameMut = trpc.profile.updateDisplayName.useMutation();
  const updateIdMut   = trpc.profile.updateEmployeeId.useMutation();
  const listInput = useMemo(() => ({}), []);
  const submittedOrdersQuery = trpc.orders.list.useQuery(listInput, {
    enabled: !!worker?.workerID,
    staleTime: 60_000,
  });
  const requestsQuery = trpc.pendingRequests.list.useQuery(listInput, {
    enabled: !!worker?.workerID,
    staleTime: 60_000,
  });
  const samplesQuery = trpc.customerSamples.list.useQuery(listInput, {
    enabled: !!worker?.workerID,
    staleTime: 60_000,
  });
  const accountStatusQuery = trpc.workers.getAccountStatus.useQuery(
    { workerID: worker?.workerID ?? "", deviceToken: worker?.deviceToken ?? "" },
    { enabled: !!worker?.workerID && !!worker?.deviceToken, staleTime: 60_000, refetchInterval: 300_000 }
  );
  const inactivityHistoryQuery = trpc.profile.getInactivityHistory.useQuery(
    { workerID: worker?.workerID ?? "", deviceToken: worker?.deviceToken ?? "" },
    { enabled: !!worker?.workerID && !!worker?.deviceToken, staleTime: 60_000 }
  );

  const [editingName, setEditingName] = useState(false);
  const [editingId,   setEditingId]   = useState(false);
  const [nameVal,     setNameVal]     = useState("");
  const [idVal,       setIdVal]       = useState("");
  const [picPreview,  setPicPreview]  = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "name" | "id";
  }>({ open: false, type: "name" });

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !worker) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPicPreview(dataUrl);
      setUploading(true);
      try {
        await uploadPicMut.mutateAsync({ workerID: worker.workerID, dataUrl });
        await refetch();
        toast.success("Profile picture updated!");
      } catch (err: any) {
        toast.error(err?.message ?? "Upload failed");
        setPicPreview(null);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [worker, uploadPicMut, refetch]);

  const startEditName = () => { setNameVal(profile?.displayName ?? profile?.name ?? ""); setEditingName(true); };
  const cancelEditName = () => setEditingName(false);
  const saveName = async () => {
    if (!worker || !nameVal.trim()) return;
    try {
      await updateNameMut.mutateAsync({ workerID: worker.workerID, displayName: nameVal.trim() });
      await refetch();
      toast.success("Display name updated!");
      setEditingName(false);
    } catch (err: any) { toast.error(err?.message ?? "Failed to update display name"); }
  };

  const startEditId = () => { setIdVal(profile?.workerID ?? ""); setEditingId(true); };
  const cancelEditId = () => setEditingId(false);
  const saveId = async () => {
    if (!worker || !idVal.trim()) return;
    try {
      const result = await updateIdMut.mutateAsync({ workerID: worker.workerID, newEmployeeId: idVal.trim() });
      loginWorker(result.newWorkerID, worker.name, worker.department, worker.userLevel, worker.deviceToken);
      await refetch();
      toast.success("Employee ID updated! Please note your new ID.");
      setEditingId(false);
    } catch (err: any) { toast.error(err?.message ?? "Failed to update Employee ID"); }
  };

  // Intercept Save → show confirmation dialog first
  const requestSaveName = () => {
    if (!nameVal.trim()) return;
    setConfirmDialog({ open: true, type: "name" });
  };
  const requestSaveId = () => {
    if (!idVal.trim()) return;
    setConfirmDialog({ open: true, type: "id" });
  };
  const handleConfirm = async () => {
    setConfirmDialog(d => ({ ...d, open: false }));
    if (confirmDialog.type === "name") await saveName();
    else await saveId();
  };
  const handleCancelConfirm = () => setConfirmDialog(d => ({ ...d, open: false }));

  if (!worker) { navigate("/login"); return null; }

  const lv = levelInfo(worker.userLevel);
  const avatarUrl = picPreview ?? profile?.profilePicture ?? null;
  const displayedName = profile?.displayName ?? profile?.name ?? worker.name;
  const nameRemaining = daysLeft(profile?.displayNameChangedAt, 7);
  const idRemaining   = daysLeft(profile?.employeeIdChangedAt, 30);
  const daysUntilSuspension = accountStatusQuery.data?.daysUntilSuspension;
  const lastDeviceActivity = accountStatusQuery.data?.lastActiveAt;
  const isUrgentInactivityWindow = daysUntilSuspension !== undefined && daysUntilSuspension <= 3;
  const isWarningInactivityWindow = daysUntilSuspension !== undefined && daysUntilSuspension <= 7;
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const accountSummaryLoading = submittedOrdersQuery.isLoading || requestsQuery.isLoading || samplesQuery.isLoading;
  const accountStats = useMemo(() => {
    const workerID = profile?.workerID ?? worker.workerID;
    const ordersAdded = (submittedOrdersQuery.data ?? []).filter(order => order.submittedBy === workerID).length;
    const openRequests = (requestsQuery.data ?? []).filter(request => request.requestedBy === workerID && request.status === "pending").length;
    const sampleRequests = (samplesQuery.data ?? []).filter(sample => sample.requestedBy === workerID).length;
    const memberDays = profile?.createdAt
      ? Math.max(0, Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / DAYS_MS))
      : null;

    return [
      { label: "Stock Added", value: ordersAdded, icon: <PackagePlus size={16} />, color: "#818cf8", glow: "rgba(99,102,241,0.18)" },
      { label: "Open NPRM", value: openRequests, icon: <ClipboardCheck size={16} />, color: "#fbbf24", glow: "rgba(245,158,11,0.16)" },
      { label: "Samples", value: sampleRequests, icon: <FlaskConical size={16} />, color: "#2dd4bf", glow: "rgba(20,184,166,0.16)" },
      { label: "Member Days", value: memberDays, icon: <CalendarDays size={16} />, color: "#fb7185", glow: "rgba(244,63,94,0.15)" },
    ];
  }, [profile?.createdAt, profile?.workerID, requestsQuery.data, samplesQuery.data, submittedOrdersQuery.data, worker.workerID]);
  const completionItems = [
    { label: "Profile photo", complete: Boolean(avatarUrl), action: "photo" as const },
    { label: "Display name", complete: Boolean(displayedName.trim()), action: "name" as const },
    { label: "Employee ID", complete: Boolean((profile?.workerID ?? worker.workerID).trim()), action: "id" as const },
    { label: "Department", complete: Boolean((profile?.department ?? worker.department).trim()), action: "department" as const },
  ];
  const missingCompletionItems = completionItems.filter(item => !item.complete);
  const profileCompletion = Math.round(((completionItems.length - missingCompletionItems.length) / completionItems.length) * 100);
  const handleCompletionAction = () => {
    const action = missingCompletionItems[0]?.action;
    if (action === "photo") handleAvatarClick();
    if (action === "name") startEditName();
    if (action === "id") startEditId();
  };

  return (
    <AppLayout pageTitle="My Profile">
      {/* ── Full-page light workspace ── */}
      <div
        className="min-h-full"
        style={{ background: "linear-gradient(155deg, #f8fafc 0%, #eef2ff 48%, #f8fafc 100%)" }}
      >
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-5 sm:px-6 lg:px-8">

          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "#64748b" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
            onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
          >
            <ChevronLeft size={16} /> Back to Home
          </button>

          {/* ── Hero card ─────────────────────────────────────────── */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
              border: "1px solid #dbe4f0",
              boxShadow: "0 18px 48px rgba(71,85,105,0.12), 0 2px 8px rgba(15,23,42,0.04)",
            }}
          >
            {/* accent bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${lv.gradient}`} />

            <div className="flex flex-col items-center gap-4 px-6 py-7 sm:flex-row sm:text-left">
              {/* Avatar */}
              <div className="relative">
                <button
                  onClick={handleAvatarClick}
                  className="relative w-24 h-24 rounded-full overflow-hidden transition-all group"
                  style={{ boxShadow: "0 0 0 4px #eef2ff, 0 0 0 6px rgba(99,102,241,0.34), 0 10px 24px rgba(99,102,241,0.18)" }}
                  title="Change profile picture"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${lv.gradient} flex items-center justify-center`}
                    >
                      <span className="text-3xl font-bold text-white">
                        {displayedName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {uploading
                      ? <Loader2 size={20} className="text-white animate-spin" />
                      : <Camera size={20} className="text-white" />
                    }
                  </div>
                </button>
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 shadow-md transition-colors hover:bg-indigo-500"
                >
                  <Camera size={12} className="text-white" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Name + ID */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#64748b" }}>My Profile</p>
                <h2 className="mt-1 text-2xl font-black" style={{ color: "#0f172a" }}>{displayedName}</h2>
                <p className="mt-0.5 text-sm" style={{ color: "#64748b" }}>
                  {profile?.workerID ?? worker.workerID}
                </p>
              </div>

              {/* Level badge */}
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${lv.badge}`}>
                {lv.text} Access
              </span>
            </div>
          </div>

          {/* ── Account summary ─────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 14px 36px rgba(71,85,105,0.10)" }}>
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.10), transparent 43%)" }} />
            <div className="relative mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold" style={{ color: "#0f172a" }}>Account Summary</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "#64748b" }}>Your stock-management activity at a glance</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857" }}>Active Account</span>
            </div>
            <div className="relative mb-4 rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black" style={{ color: "#0f172a" }}>Account Details</p>
                  <p className="mt-0.5 text-[10px]" style={{ color: "#64748b" }}>Your profile and membership information</p>
                </div>
                <span className="rounded-full px-2 py-1 text-[9px] font-bold" style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}>PROFILE</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <SummaryDetail icon={<User size={14} />} label="Display Name" value={displayedName} color="#4338ca" onEdit={startEditName} editDisabled={nameRemaining > 0} editHint={nameRemaining > 0 ? `Display Name available in ${nameRemaining} day(s)` : "Quick edit Display Name"} />
                <SummaryDetail icon={<IdCard size={14} />} label="Employee ID" value={profile?.workerID ?? worker.workerID} color="#a16207" onEdit={startEditId} editDisabled={idRemaining > 0} editHint={idRemaining > 0 ? `Employee ID available in ${idRemaining} day(s)` : "Quick edit Employee ID"} />
                <SummaryDetail icon={<Building2 size={14} />} label="Department" value={profile?.department ?? worker.department} color="#0369a1" />
                <SummaryDetail icon={<Shield size={14} />} label="Access Level" value={lv.text} color="#047857" />
                <SummaryDetail icon={<Calendar size={14} />} label="Member Since" value={memberSince} color="#be123c" className="sm:col-span-2" />
              </div>
            </div>
            <div className="relative mb-4 rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold" style={{ color: "#0f172a" }}>Profile Completion</p>
                  <p className="mt-0.5 text-[10px]" style={{ color: "#64748b" }}>{profileCompletion === 100 ? "Your core account details are complete." : `Add ${missingCompletionItems.map(item => item.label).join(", ")} to complete your profile.`}</p>
                </div>
                <span className="shrink-0 text-lg font-black" style={{ color: profileCompletion === 100 ? "#059669" : "#4f46e5" }}>{profileCompletion}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profileCompletion} style={{ background: "#e2e8f0" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%`, background: profileCompletion === 100 ? "linear-gradient(90deg, #059669, #14b8a6)" : "linear-gradient(90deg, #4f46e5, #7c3aed)", boxShadow: profileCompletion === 100 ? "0 0 12px rgba(20,184,166,0.28)" : "0 0 12px rgba(99,102,241,0.24)" }} />
              </div>
              {missingCompletionItems.length > 0 && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold" style={{ color: "#4f46e5" }}>Next: {missingCompletionItems[0].label}</span>
                  {missingCompletionItems[0].action === "department" ? <span className="text-[10px] font-semibold" style={{ color: "#64748b" }}>Contact Admin to update</span> : (
                    <button type="button" onClick={handleCompletionAction} className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white transition-transform hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 4px 12px rgba(99,102,241,0.22)" }}>Complete now</button>
                  )}
                </div>
              )}
            </div>
            <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {accountStats.map(stat => (
                <div key={stat.label} className="rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: stat.glow, color: stat.color }}>{stat.icon}</div>
                  <p className="text-lg font-black leading-none" style={{ color: "#0f172a" }}>{accountSummaryLoading || stat.value === null ? "—" : stat.value}</p>
                  <p className="mt-1 text-[10px] font-semibold" style={{ color: "#64748b" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Automatic suspension policy ─────────────────────────── */}
          <section aria-label="Automatic suspension policy" className="relative overflow-hidden rounded-2xl p-4" style={{ background: isUrgentInactivityWindow ? "#fff1f2" : isWarningInactivityWindow ? "#fffbeb" : "#eef2ff", border: isUrgentInactivityWindow ? "1px solid #fecdd3" : isWarningInactivityWindow ? "1px solid #fde68a" : "1px solid #c7d2fe", boxShadow: "0 12px 30px rgba(71,85,105,0.08)" }}>
            <div className="absolute bottom-0 left-0 top-0 w-1" style={{ background: isUrgentInactivityWindow ? "#e11d48" : isWarningInactivityWindow ? "#d97706" : "#4f46e5" }} />
            <div className="relative flex items-start gap-3 pl-1">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: isUrgentInactivityWindow ? "linear-gradient(135deg, #ef4444, #be123c)" : isWarningInactivityWindow ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 6px 16px rgba(79,70,229,0.20)" }}>
                <ShieldAlert size={19} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black" style={{ color: "#0f172a" }}>Automatic Suspension Policy</p>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide" style={{ background: "#ffffff", border: "1px solid #fde68a", color: "#a16207" }}>30 DAYS</span>
                </div>
                <p className="mt-1 text-xs font-semibold leading-relaxed" style={{ color: isUrgentInactivityWindow ? "#be123c" : "#a16207" }}>Your account will be automatically suspended if no verified device activity is recorded for 30 days.</p>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "#475569" }}>Keeping the app active on your signed-in device refreshes account activity. If no activity is recorded for 30 days, your Employee ID is automatically suspended.</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <PolicyMetric label="Suspension threshold" value="30 days" icon={<Clock size={13} />} color="#a16207" />
                  <PolicyMetric label="Last device activity" value={lastDeviceActivity ? new Date(lastDeviceActivity).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : accountStatusQuery.isLoading ? "Checking…" : "Not available"} icon={<LogIn size={13} />} color="#4f46e5" />
                  <PolicyMetric label="Account activity status" value={daysUntilSuspension === undefined ? (accountStatusQuery.isLoading ? "Checking…" : "Active") : daysUntilSuspension === 0 ? "Suspension scheduled today" : `${daysUntilSuspension} days remaining`} icon={<Shield size={13} />} color={isUrgentInactivityWindow ? "#be123c" : isWarningInactivityWindow ? "#a16207" : "#047857"} />
                </div>
              </div>
            </div>
          </section>

          {/* ── Account activity history ────────────────────────────── */}
          <section aria-label="Account activity history" className="relative overflow-hidden rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 14px 36px rgba(71,85,105,0.10)" }}>
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 0% 100%, rgba(20,184,166,0.08), transparent 45%)" }} />
            <div className="relative mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", boxShadow: "0 6px 16px rgba(13,148,136,0.18)" }}><History size={17} className="text-white" /></div>
                <div><p className="text-sm font-black" style={{ color: "#0f172a" }}>Account Activity History</p><p className="mt-0.5 text-[10px]" style={{ color: "#64748b" }}>Past inactivity warnings and account status changes</p></div>
              </div>
              <span className="rounded-full px-2 py-1 text-[9px] font-bold" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857" }}>PRIVATE</span>
            </div>
            <div className="relative space-y-2.5">
              {inactivityHistoryQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-xl px-3 py-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}><Loader2 size={15} className="animate-spin" /><span className="text-xs font-medium">Loading account activity…</span></div>
              ) : (inactivityHistoryQuery.data ?? []).length === 0 ? (
                <div className="rounded-xl px-3 py-4 text-center" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}><p className="text-xs font-bold" style={{ color: "#0f172a" }}>No inactivity events recorded</p><p className="mt-1 text-[10px] leading-relaxed" style={{ color: "#64748b" }}>Your future browser reminders, account suspensions, and Administrator reactivations will appear here.</p></div>
              ) : (
                (inactivityHistoryQuery.data ?? []).map(event => {
                  const eventStyle = event.type === "suspended" ? { icon: <ShieldAlert size={15} />, color: "#be123c", bg: "#fff1f2", border: "#fecdd3" } : event.type === "reactivated" ? { icon: <ShieldCheck size={15} />, color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" } : { icon: <BellRing size={15} />, color: "#a16207", bg: "#fffbeb", border: "#fde68a" };
                  return <div key={event.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: eventStyle.bg, border: `1px solid ${eventStyle.border}`, color: eventStyle.color }}>{eventStyle.icon}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-1.5"><p className="text-xs font-black" style={{ color: "#0f172a" }}>{event.title}</p><span className="text-[9px] font-semibold" style={{ color: "#64748b" }}>{new Date(event.occurredAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div><p className="mt-1 text-[10px] leading-relaxed" style={{ color: "#475569" }}>{event.description}</p></div></div>;
                })
              )}
            </div>
          </section>

          {/* ── Profile fields ──────────────────────────────────────── */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={26} className="animate-spin" style={{ color: "rgba(99,102,241,0.8)" }} />
            </div>
          ) : (
            <div className="space-y-3">

              <FieldCard
                icon={<User size={16} style={{ color: "#818cf8" }} />}
                label="Display Name"
                sublabel="Shown across the app"
                cooldownDays={7}
                daysRemaining={nameRemaining}
                editing={editingName}
                onEdit={startEditName}
                onCancel={cancelEditName}
                onSave={requestSaveName}
                saving={updateNameMut.isPending}
                editValue={nameVal}
                onEditChange={setNameVal}
                displayValue={profile?.displayName ?? profile?.name ?? worker.name}
                placeholder="Enter display name"
              />

              <FieldCard
                icon={<IdCard size={16} style={{ color: "#fbbf24" }} />}
                label="Employee ID"
                sublabel="Your login identifier"
                cooldownDays={30}
                daysRemaining={idRemaining}
                editing={editingId}
                onEdit={startEditId}
                onCancel={cancelEditId}
                onSave={requestSaveId}
                saving={updateIdMut.isPending}
                editValue={idVal}
                onEditChange={setIdVal}
                displayValue={profile?.workerID ?? worker.workerID}
                placeholder="Enter new Employee ID"
                warning="Changing your Employee ID will update your login credentials. Remember your new ID."
              />

              <ReadOnlyField
                icon={<Building2 size={16} style={{ color: "#38bdf8" }} />}
                label="Department"
                value={profile?.department ?? worker.department}
              />

              <ReadOnlyField
                icon={<Shield size={16} style={{ color: "#34d399" }} />}
                label="Access Level"
                value={lv.text}
                badge={
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lv.badge}`}>
                    {lv.text}
                  </span>
                }
              />

              <ReadOnlyField
                icon={<Calendar size={16} style={{ color: "#f87171" }} />}
                label="Member Since"
                value={memberSince}
              />
            </div>
          )}

        </div>
      </div>

      {/* ── Confirmation Dialog ──────────────────────────────────── */}
      {confirmDialog.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(15,23,42,0.46)", backdropFilter: "blur(6px)" }}
          onClick={handleCancelConfirm}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              background: "#ffffff",
              border: confirmDialog.type === "name"
                ? "1px solid #c7d2fe"
                : "1px solid #fde68a",
              boxShadow: confirmDialog.type === "name"
                ? "0 24px 64px rgba(79,70,229,0.22), 0 4px 16px rgba(15,23,42,0.10)"
                : "0 24px 64px rgba(217,119,6,0.18), 0 4px 16px rgba(15,23,42,0.10)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Accent top bar */}
            <div
              className="h-1 rounded-full -mt-6 -mx-6 mb-4"
              style={{
                background: confirmDialog.type === "name"
                  ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                  : "linear-gradient(90deg, #f59e0b, #d97706)",
                borderRadius: "16px 16px 0 0",
              }}
            />

            {/* Icon + Title */}
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: confirmDialog.type === "name"
                    ? "#eef2ff"
                    : "#fffbeb",
                  border: confirmDialog.type === "name"
                    ? "1px solid #c7d2fe"
                    : "1px solid #fde68a",
                }}
              >
                <AlertTriangle size={20} style={{ color: confirmDialog.type === "name" ? "#818cf8" : "#fbbf24" }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "#0f172a" }}>
                  {confirmDialog.type === "name" ? "Change Display Name?" : "Change Employee ID?"}
                </h3>
                <p className="mt-0.5 text-xs" style={{ color: "#64748b" }}>
                  {confirmDialog.type === "name" ? "Please read the notice below" : "Important — read carefully"}
                </p>
              </div>
            </div>

            {/* Warning box */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{
                background: confirmDialog.type === "name"
                  ? "#eef2ff"
                  : "#fffbeb",
                border: confirmDialog.type === "name"
                  ? "1px solid #c7d2fe"
                  : "1px solid #fde68a",
              }}
            >
              {confirmDialog.type === "name" ? (
                <>
                  <p className="text-sm font-semibold" style={{ color: "#4338ca" }}>
                    ⏳ 7-Day Cooldown
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>
                    After saving, you will <strong style={{ color: "#0f172a" }}>not be able to change your Display Name again for 7 days</strong>. Make sure the new name is correct before confirming.
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "#64748b" }}>
                    New name: <strong style={{ color: "#4338ca" }}>{nameVal}</strong>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold" style={{ color: "#a16207" }}>
                    ⏳ 30-Day Cooldown + Login Change
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>
                    After saving, you will <strong style={{ color: "#0f172a" }}>not be able to change your Employee ID again for 30 days</strong>. Your new ID will also become your <strong style={{ color: "#0f172a" }}>login credential</strong> — remember it!
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "#64748b" }}>
                    New ID: <strong style={{ color: "#a16207" }}>{idVal}</strong>
                  </p>
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#ffffff"; }}
              >
                ✕ Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{
                  background: confirmDialog.type === "name"
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "linear-gradient(135deg, #f59e0b, #d97706)",
                  boxShadow: confirmDialog.type === "name"
                    ? "0 4px 14px rgba(99,102,241,0.4)"
                    : "0 4px 14px rgba(245,158,11,0.4)",
                }}
              >
                ✓ Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface FieldCardProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  cooldownDays: number;
  daysRemaining: number;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  displayValue: string;
  placeholder?: string;
  warning?: string;
}

function FieldCard({
  icon, label, sublabel, cooldownDays, daysRemaining,
  editing, onEdit, onCancel, onSave, saving,
  editValue, onEditChange, displayValue, placeholder, warning,
}: FieldCardProps) {
  const locked = daysRemaining > 0;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 8px 22px rgba(71,85,105,0.07)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#eef2ff" }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: "#475569" }}>{label}</p>
            {sublabel && (
              <p className="text-[10px]" style={{ color: "#94a3b8" }}>{sublabel}</p>
            )}
          </div>
        </div>

        {!editing && (
          <button
            onClick={locked ? undefined : onEdit}
            disabled={locked}
            title={locked ? `Available in ${daysRemaining} day(s)` : `Edit ${label}`}
            className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
            style={locked
              ? { color: "#94a3b8", background: "#f1f5f9", cursor: "not-allowed" }
              : { color: "#4f46e5", background: "#eef2ff", cursor: "pointer" }
            }
          >
            {locked ? <Clock size={12} /> : <Edit2 size={12} />}
            {locked ? `${daysRemaining}d` : "Edit"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          {warning && (
            <div
              className="flex items-start gap-2 p-2.5 rounded-lg"
              style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
            >
              <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
              <p className="text-[11px]" style={{ color: "#92400e" }}>{warning}</p>
            </div>
          )}
          <input
            type="text"
            value={editValue}
            onChange={e => onEditChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#0f172a",
            }}
            onKeyDown={e => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving || !editValue.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: "#4f46e5", color: "#ffffff" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm transition-colors"
              style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 pl-10">
          <p className="truncate text-sm font-bold" style={{ color: "#0f172a" }}>{displayValue}</p>
          {locked && (
            <p className="mt-0.5 text-[10px]" style={{ color: "#64748b" }}>
              <Clock size={9} className="inline mr-1" />
              Next change in {daysRemaining} day(s) · every {cooldownDays} days
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface ReadOnlyFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
}

function ReadOnlyField({ icon, label, value, badge }: ReadOnlyFieldProps) {
  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 8px 22px rgba(71,85,105,0.07)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "#f1f5f9" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: "#475569" }}>{label}</p>
        {badge ?? (
          <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{value}</p>
        )}
      </div>
      <span
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "#94a3b8" }}
      >
        Read-only
      </span>
    </div>
  );
}
