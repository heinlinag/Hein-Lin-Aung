/**
 * UserProfile — /user-profile
 * Self-contained dark page (own dark background) so text is always readable
 * regardless of the AppLayout light canvas.
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
      badge: "bg-orange-500/30 text-orange-200 border border-orange-400/40",
    };
  if (level === "1.1")
    return {
      text: "Level 1.1",
      gradient: "from-purple-500 to-violet-500",
      solidGradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
      badge: "bg-purple-500/30 text-purple-200 border border-purple-400/40",
    };
  return {
    text: "Level 2",
    gradient: "from-emerald-500 to-teal-500",
    solidGradient: "linear-gradient(135deg,#10b981,#059669)",
    badge: "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40",
  };
}

function PolicyMetric({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)" }}>
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "rgba(203,213,225,0.78)" }}>{label}</p>
      </div>
      <p className="mt-1 text-xs font-black leading-tight" style={{ color }}>{value}</p>
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
  const lastSuccessfulLogin = accountStatusQuery.data?.lastLoginAt;
  const isUrgentInactivityWindow = daysUntilSuspension !== undefined && daysUntilSuspension <= 3;
  const isWarningInactivityWindow = daysUntilSuspension !== undefined && daysUntilSuspension <= 7;
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
      {/* ── Full-page dark wrapper so all text is always readable ── */}
      <div
        className="min-h-full"
        style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
      >
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "rgba(148,163,184,0.8)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "white")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(148,163,184,0.8)")}
          >
            <ChevronLeft size={16} /> Back to Home
          </button>

          {/* ── Hero card ─────────────────────────────────────────── */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.16) 100%)",
              border: "1px solid rgba(99,102,241,0.30)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* accent bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${lv.gradient}`} />

            <div className="px-6 py-6 flex flex-col items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <button
                  onClick={handleAvatarClick}
                  className="relative w-24 h-24 rounded-full overflow-hidden transition-all group"
                  style={{ boxShadow: "0 0 0 3px rgba(99,102,241,0.5)" }}
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
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading
                      ? <Loader2 size={20} className="text-white animate-spin" />
                      : <Camera size={20} className="text-white" />
                    }
                  </div>
                </button>
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center hover:bg-indigo-500 transition-colors"
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
              <div className="text-center">
                <h2 className="text-xl font-bold" style={{ color: "#ffffff" }}>{displayedName}</h2>
                <p className="text-sm mt-0.5" style={{ color: "rgba(148,163,184,0.9)" }}>
                  {profile?.workerID ?? worker.workerID}
                </p>
              </div>

              {/* Level badge */}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${lv.badge}`}>
                {lv.text} Access
              </span>
            </div>
          </div>

          {/* ── Account summary ─────────────────────────────────────── */}
          <section
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: "rgba(15,23,42,0.72)",
              border: "1px solid rgba(129,140,248,0.22)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 16px 40px rgba(15,23,42,0.22)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.15), transparent 43%)" }} />
            <div className="relative flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: "#ffffff" }}>Account Summary</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.9)" }}>Your stock-management activity at a glance</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(52,211,153,0.22)", color: "#6ee7b7" }}>
                Active Account
              </span>
            </div>
            <div
              className="relative mb-4 rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold" style={{ color: "#e2e8f0" }}>Profile Completion</p>
                  <p className="mt-0.5 text-[10px]" style={{ color: "rgba(148,163,184,0.9)" }}>
                    {profileCompletion === 100 ? "Your core account details are complete." : `Add ${missingCompletionItems.map(item => item.label).join(", ")} to complete your profile.`}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-black" style={{ color: profileCompletion === 100 ? "#6ee7b7" : "#a5b4fc" }}>
                  {profileCompletion}%
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full"
                role="progressbar"
                aria-label="Profile completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={profileCompletion}
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${profileCompletion}%`,
                    background: profileCompletion === 100 ? "linear-gradient(90deg, #10b981, #2dd4bf)" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    boxShadow: profileCompletion === 100 ? "0 0 12px rgba(45,212,191,0.5)" : "0 0 12px rgba(129,140,248,0.5)",
                  }}
                />
              </div>
              {missingCompletionItems.length > 0 && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold" style={{ color: "#c4b5fd" }}>Next: {missingCompletionItems[0].label}</span>
                  {missingCompletionItems[0].action === "department" ? (
                    <span className="text-[10px] font-semibold" style={{ color: "rgba(148,163,184,0.85)" }}>Contact Admin to update</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCompletionAction}
                      className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white transition-transform hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,0.28)" }}
                    >
                      Complete now
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {accountStats.map(stat => (
                <div
                  key={stat.label}
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: stat.glow, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <p className="text-lg font-black leading-none" style={{ color: "#ffffff" }}>
                    {accountSummaryLoading || stat.value === null ? "—" : stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold" style={{ color: "rgba(148,163,184,0.92)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Automatic suspension policy ─────────────────────────── */}
          <section
            aria-label="Automatic suspension policy"
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: isUrgentInactivityWindow
                ? "linear-gradient(135deg, rgba(127,29,29,0.5), rgba(69,10,10,0.42))"
                : isWarningInactivityWindow
                  ? "linear-gradient(135deg, rgba(120,53,15,0.45), rgba(69,26,3,0.36))"
                  : "linear-gradient(135deg, rgba(30,41,59,0.78), rgba(49,46,129,0.3))",
              border: isUrgentInactivityWindow
                ? "1px solid rgba(248,113,113,0.36)"
                : isWarningInactivityWindow
                  ? "1px solid rgba(251,191,36,0.34)"
                  : "1px solid rgba(129,140,248,0.24)",
              backdropFilter: "blur(16px)",
              boxShadow: isUrgentInactivityWindow
                ? "0 16px 40px rgba(127,29,29,0.18)"
                : "0 16px 40px rgba(15,23,42,0.22)",
            }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: isUrgentInactivityWindow ? "linear-gradient(180deg, #fb7185, #dc2626)" : "linear-gradient(180deg, #fbbf24, #f97316)" }} />
            <div className="relative flex items-start gap-3 pl-1">
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: isUrgentInactivityWindow ? "linear-gradient(135deg, #ef4444, #b91c1c)" : "linear-gradient(135deg, #f59e0b, #ea580c)",
                  boxShadow: isUrgentInactivityWindow ? "0 6px 16px rgba(239,68,68,0.25)" : "0 6px 16px rgba(245,158,11,0.25)",
                }}
              >
                <ShieldAlert size={19} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black" style={{ color: "#ffffff" }}>Automatic Suspension Policy</p>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide" style={{ background: "rgba(251,191,36,0.16)", border: "1px solid rgba(251,191,36,0.28)", color: "#fde68a" }}>30 DAYS</span>
                </div>
                <p className="mt-1 text-xs font-medium leading-relaxed" style={{ color: "#fde68a" }}>
                  သင်သည် ရက် 30 အတွင်း Login မဝင်ရောက်ခဲ့ပါက သင့်အကောင့်သည် Suspended ဖြစ်မည်။
                </p>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "rgba(226,232,240,0.92)" }}>
                  If no successful sign-in is recorded for 30 days, your Employee ID is automatically suspended. Sign out and sign in again to refresh your account activity.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <PolicyMetric label="Suspension threshold" value="30 days" icon={<Clock size={13} />} color="#fde68a" />
                  <PolicyMetric
                    label="Last successful sign-in"
                    value={lastSuccessfulLogin ? new Date(lastSuccessfulLogin).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : accountStatusQuery.isLoading ? "Checking…" : "Not available"}
                    icon={<LogIn size={13} />}
                    color="#c4b5fd"
                  />
                  <PolicyMetric
                    label="Account activity status"
                    value={daysUntilSuspension === undefined ? (accountStatusQuery.isLoading ? "Checking…" : "Active") : daysUntilSuspension === 0 ? "Suspension scheduled today" : `${daysUntilSuspension} days remaining`}
                    icon={<Shield size={13} />}
                    color={isUrgentInactivityWindow ? "#fda4af" : isWarningInactivityWindow ? "#fde68a" : "#86efac"}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Account activity history ────────────────────────────── */}
          <section
            aria-label="Account activity history"
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: "rgba(15,23,42,0.72)",
              border: "1px solid rgba(148,163,184,0.18)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 16px 40px rgba(15,23,42,0.22)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 0% 100%, rgba(45,212,191,0.12), transparent 45%)" }} />
            <div className="relative mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", boxShadow: "0 6px 16px rgba(13,148,136,0.22)" }}>
                  <History size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: "#ffffff" }}>Account Activity History</p>
                  <p className="mt-0.5 text-[10px]" style={{ color: "rgba(148,163,184,0.9)" }}>Past inactivity warnings and account status changes</p>
                </div>
              </div>
              <span className="rounded-full px-2 py-1 text-[9px] font-bold" style={{ background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.22)", color: "#99f6e4" }}>PRIVATE</span>
            </div>

            <div className="relative space-y-2.5">
              {inactivityHistoryQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-xl px-3 py-4" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(203,213,225,0.85)" }}>
                  <Loader2 size={15} className="animate-spin" />
                  <span className="text-xs font-medium">Loading account activity…</span>
                </div>
              ) : (inactivityHistoryQuery.data ?? []).length === 0 ? (
                <div className="rounded-xl px-3 py-4 text-center" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xs font-bold" style={{ color: "#e2e8f0" }}>No inactivity events recorded</p>
                  <p className="mt-1 text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.9)" }}>Your future browser reminders, account suspensions, and Administrator reactivations will appear here.</p>
                </div>
              ) : (
                (inactivityHistoryQuery.data ?? []).map(event => {
                  const eventStyle = event.type === "suspended"
                    ? { icon: <ShieldAlert size={15} />, color: "#fda4af", bg: "rgba(239,68,68,0.12)", border: "rgba(248,113,113,0.24)" }
                    : event.type === "reactivated"
                      ? { icon: <ShieldCheck size={15} />, color: "#6ee7b7", bg: "rgba(16,185,129,0.12)", border: "rgba(52,211,153,0.24)" }
                      : { icon: <BellRing size={15} />, color: "#fde68a", bg: "rgba(245,158,11,0.12)", border: "rgba(251,191,36,0.24)" };
                  return (
                    <div key={event.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: eventStyle.bg, border: `1px solid ${eventStyle.border}`, color: eventStyle.color }}>
                        {eventStyle.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <p className="text-xs font-black" style={{ color: "#f8fafc" }}>{event.title}</p>
                          <span className="text-[9px] font-semibold" style={{ color: "rgba(148,163,184,0.92)" }}>
                            {new Date(event.occurredAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed" style={{ color: "rgba(203,213,225,0.84)" }}>{event.description}</p>
                      </div>
                    </div>
                  );
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
                value={
                  profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "long", year: "numeric",
                      })
                    : "—"
                }
              />
            </div>
          )}

        </div>
      </div>

      {/* ── Confirmation Dialog ──────────────────────────────────── */}
      {confirmDialog.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={handleCancelConfirm}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              background: "linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.97) 100%)",
              border: confirmDialog.type === "name"
                ? "1px solid rgba(99,102,241,0.40)"
                : "1px solid rgba(245,158,11,0.40)",
              backdropFilter: "blur(20px)",
              boxShadow: confirmDialog.type === "name"
                ? "0 24px 64px rgba(99,102,241,0.25), 0 4px 16px rgba(0,0,0,0.4)"
                : "0 24px 64px rgba(245,158,11,0.20), 0 4px 16px rgba(0,0,0,0.4)",
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
                    ? "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))"
                    : "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.2))",
                  border: confirmDialog.type === "name"
                    ? "1px solid rgba(99,102,241,0.4)"
                    : "1px solid rgba(245,158,11,0.4)",
                }}
              >
                <AlertTriangle size={20} style={{ color: confirmDialog.type === "name" ? "#818cf8" : "#fbbf24" }} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {confirmDialog.type === "name" ? "Change Display Name?" : "Change Employee ID?"}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.8)" }}>
                  {confirmDialog.type === "name" ? "Please read the notice below" : "Important — read carefully"}
                </p>
              </div>
            </div>

            {/* Warning box */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{
                background: confirmDialog.type === "name"
                  ? "rgba(99,102,241,0.10)"
                  : "rgba(245,158,11,0.10)",
                border: confirmDialog.type === "name"
                  ? "1px solid rgba(99,102,241,0.25)"
                  : "1px solid rgba(245,158,11,0.25)",
              }}
            >
              {confirmDialog.type === "name" ? (
                <>
                  <p className="text-sm font-semibold" style={{ color: "#a5b4fc" }}>
                    ⏳ 7-Day Cooldown
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(203,213,225,0.9)" }}>
                    After saving, you will <strong style={{ color: "white" }}>not be able to change your Display Name again for 7 days</strong>. Make sure the new name is correct before confirming.
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.7)" }}>
                    New name: <strong style={{ color: "#c7d2fe" }}>{nameVal}</strong>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold" style={{ color: "#fcd34d" }}>
                    ⏳ 30-Day Cooldown + Login Change
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(203,213,225,0.9)" }}>
                    After saving, you will <strong style={{ color: "white" }}>not be able to change your Employee ID again for 30 days</strong>. Your new ID will also become your <strong style={{ color: "white" }}>login credential</strong> — remember it!
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.7)" }}>
                    New ID: <strong style={{ color: "#fde68a" }}>{idVal}</strong>
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
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(148,163,184,1)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
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
        background: "rgba(15,23,42,0.75)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: "rgba(148,163,184,1)" }}>{label}</p>
            {sublabel && (
              <p className="text-[10px]" style={{ color: "rgba(100,116,139,1)" }}>{sublabel}</p>
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
              ? { color: "rgba(71,85,105,1)", background: "rgba(30,41,59,0.6)", cursor: "not-allowed" }
              : { color: "#818cf8", background: "rgba(99,102,241,0.12)", cursor: "pointer" }
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
              style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
              <p className="text-[11px]" style={{ color: "#fde68a" }}>{warning}</p>
            </div>
          )}
          <input
            type="text"
            value={editValue}
            onChange={e => onEditChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffffff",
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
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(203,213,225,1)" }}
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 pl-10">
          <p className="text-sm font-bold truncate" style={{ color: "#ffffff" }}>{displayValue}</p>
          {locked && (
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(100,116,139,1)" }}>
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
        background: "rgba(15,23,42,0.55)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: "rgba(148,163,184,1)" }}>{label}</p>
        {badge ?? (
          <p className="text-sm font-bold" style={{ color: "#ffffff" }}>{value}</p>
        )}
      </div>
      <span
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "rgba(71,85,105,1)" }}
      >
        Read-only
      </span>
    </div>
  );
}
