/**
 * UserProfile — /user-profile
 * Dark glassmorphism design consistent with the rest of the app.
 *
 * Features:
 * - Profile picture upload (click avatar to change)
 * - Display Name edit (7-day cooldown)
 * - Employee ID edit (30-day cooldown)
 * - Read-only: Department, Access Level, Member Since
 */
import { useState, useRef, useCallback } from "react";
import { Camera, User, IdCard, Building2, Shield, Calendar, Edit2, Check, X, Clock, AlertTriangle, Loader2, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useLocation } from "wouter";
import { toast } from "sonner";

const DAYS_MS = 24 * 60 * 60 * 1000;

function daysLeft(changedAt: Date | null, cooldownDays: number): number {
  if (!changedAt) return 0;
  const elapsed = (Date.now() - new Date(changedAt).getTime()) / DAYS_MS;
  return Math.max(0, Math.ceil(cooldownDays - elapsed));
}

function levelInfo(level: string) {
  if (level === "1")   return { text: "Level 1",   gradient: "from-orange-500 to-amber-500",   badge: "bg-orange-500/20 text-orange-300 border border-orange-400/30" };
  if (level === "1.1") return { text: "Level 1.1", gradient: "from-purple-500 to-violet-500",   badge: "bg-purple-500/20 text-purple-300 border border-purple-400/30" };
  return                     { text: "Level 2",   gradient: "from-emerald-500 to-teal-500",    badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" };
}

export default function UserProfile() {
  const { worker, loginWorker } = useAuth();
  const [, navigate] = useLocation();

  // ── Profile query ──────────────────────────────────────────────────────────
  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery(
    { workerID: worker?.workerID ?? "" },
    { enabled: !!worker?.workerID }
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const uploadPicMut   = trpc.profile.uploadPicture.useMutation();
  const updateNameMut  = trpc.profile.updateDisplayName.useMutation();
  const updateIdMut    = trpc.profile.updateEmployeeId.useMutation();

  // ── Local state ────────────────────────────────────────────────────────────
  const [editingName, setEditingName]   = useState(false);
  const [editingId,   setEditingId]     = useState(false);
  const [nameVal,     setNameVal]       = useState("");
  const [idVal,       setIdVal]         = useState("");
  const [picPreview,  setPicPreview]    = useState<string | null>(null);
  const [uploading,   setUploading]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
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
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [worker, uploadPicMut, refetch]);

  const startEditName = () => {
    setNameVal(profile?.displayName ?? profile?.name ?? "");
    setEditingName(true);
  };
  const cancelEditName = () => setEditingName(false);
  const saveName = async () => {
    if (!worker || !nameVal.trim()) return;
    try {
      await updateNameMut.mutateAsync({ workerID: worker.workerID, displayName: nameVal.trim() });
      await refetch();
      toast.success("Display name updated!");
      setEditingName(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update display name");
    }
  };

  const startEditId = () => {
    setIdVal(profile?.workerID ?? "");
    setEditingId(true);
  };
  const cancelEditId = () => setEditingId(false);
  const saveId = async () => {
    if (!worker || !idVal.trim()) return;
    try {
      const result = await updateIdMut.mutateAsync({ workerID: worker.workerID, newEmployeeId: idVal.trim() });
      // Update local auth session with new workerID
      loginWorker(result.newWorkerID, worker.name, worker.department, worker.userLevel, worker.deviceToken);
      await refetch();
      toast.success("Employee ID updated! Please note your new ID.");
      setEditingId(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update Employee ID");
    }
  };

  if (!worker) {
    navigate("/login");
    return null;
  }

  const lv = levelInfo(worker.userLevel);
  const avatarUrl = picPreview ?? profile?.profilePicture ?? null;
  const displayedName = profile?.displayName ?? profile?.name ?? worker.name;

  const nameRemaining = daysLeft(profile?.displayNameChangedAt ?? null, 7);
  const idRemaining   = daysLeft(profile?.employeeIdChangedAt ?? null, 30);

  return (
    <AppLayout pageTitle="My Profile">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* ── Back button ─────────────────────────────────────────────── */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ChevronLeft size={16} /> Back to Home
        </button>

        {/* ── Hero card: avatar + name + level ────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* gradient accent bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${lv.gradient}`} />

          <div className="px-6 py-6 flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <button
                onClick={handleAvatarClick}
                className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-indigo-500/40 hover:ring-indigo-400/70 transition-all group"
                title="Change profile picture"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${lv.gradient} flex items-center justify-center`}>
                    <span className="text-3xl font-bold text-white">
                      {displayedName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading ? (
                    <Loader2 size={20} className="text-white animate-spin" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </div>
              </button>
              {/* Camera badge */}
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

            {/* Name */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{displayedName}</h2>
              <p className="text-sm text-slate-400">{profile?.workerID ?? worker.workerID}</p>
            </div>

            {/* Level badge */}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${lv.badge}`}>
              {lv.text} Access
            </span>
          </div>
        </div>

        {/* ── Profile fields ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="space-y-3">

            {/* Display Name */}
            <FieldCard
              icon={<User size={16} className="text-indigo-400" />}
              label="Display Name"
              sublabel="Shown across the app"
              cooldownDays={7}
              daysRemaining={nameRemaining}
              editing={editingName}
              onEdit={startEditName}
              onCancel={cancelEditName}
              onSave={saveName}
              saving={updateNameMut.isPending}
              editValue={nameVal}
              onEditChange={setNameVal}
              displayValue={profile?.displayName ?? profile?.name ?? worker.name}
              placeholder="Enter display name"
            />

            {/* Employee ID */}
            <FieldCard
              icon={<IdCard size={16} className="text-amber-400" />}
              label="Employee ID"
              sublabel="Your login identifier"
              cooldownDays={30}
              daysRemaining={idRemaining}
              editing={editingId}
              onEdit={startEditId}
              onCancel={cancelEditId}
              onSave={saveId}
              saving={updateIdMut.isPending}
              editValue={idVal}
              onEditChange={setIdVal}
              displayValue={profile?.workerID ?? worker.workerID}
              placeholder="Enter new Employee ID"
              warning="Changing your Employee ID will update your login credentials. Make sure to remember your new ID."
            />

            {/* Department (read-only) */}
            <ReadOnlyField
              icon={<Building2 size={16} className="text-sky-400" />}
              label="Department"
              value={profile?.department ?? worker.department}
            />

            {/* Access Level (read-only) */}
            <ReadOnlyField
              icon={<Shield size={16} className="text-emerald-400" />}
              label="Access Level"
              value={lv.text}
              badge={<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lv.badge}`}>{lv.text}</span>}
            />

            {/* Member Since (read-only) */}
            <ReadOnlyField
              icon={<Calendar size={16} className="text-rose-400" />}
              label="Member Since"
              value={profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
                : "—"
              }
            />
          </div>
        )}

      </div>
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
        background: "rgba(15,23,42,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">{label}</p>
            {sublabel && <p className="text-[10px] text-slate-500">{sublabel}</p>}
          </div>
        </div>

        {/* Edit / Lock button */}
        {!editing && (
          <button
            onClick={locked ? undefined : onEdit}
            disabled={locked}
            title={locked ? `Available in ${daysRemaining} day(s)` : `Edit ${label}`}
            className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors ${
              locked
                ? "text-slate-600 bg-slate-800/50 cursor-not-allowed"
                : "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer"
            }`}
          >
            {locked ? <Clock size={12} /> : <Edit2 size={12} />}
            {locked ? `${daysRemaining}d` : "Edit"}
          </button>
        )}
      </div>

      {/* Value / Edit input */}
      {editing ? (
        <div className="mt-3 space-y-2">
          {warning && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300">{warning}</p>
            </div>
          )}
          <input
            type="text"
            value={editValue}
            onChange={e => onEditChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            onKeyDown={e => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving || !editValue.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 ml-10.5">
          <p className="text-sm font-semibold text-white truncate">{displayValue}</p>
          {locked && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              <Clock size={9} className="inline mr-1" />
              Next change available in {daysRemaining} day(s) · every {cooldownDays} days
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
        background: "rgba(15,23,42,0.4)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        {badge ?? <p className="text-sm font-semibold text-white">{value}</p>}
      </div>
      <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wide">Read-only</span>
    </div>
  );
}
