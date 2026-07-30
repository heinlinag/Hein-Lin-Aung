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
import { useState, useRef, useCallback } from "react";
import {
  Camera, User, IdCard, Building2, Shield, Calendar,
  Edit2, Check, X, Clock, AlertTriangle, Loader2, ChevronLeft,
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

  const [editingName, setEditingName] = useState(false);
  const [editingId,   setEditingId]   = useState(false);
  const [nameVal,     setNameVal]     = useState("");
  const [idVal,       setIdVal]       = useState("");
  const [picPreview,  setPicPreview]  = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (!worker) { navigate("/login"); return null; }

  const lv = levelInfo(worker.userLevel);
  const avatarUrl = picPreview ?? profile?.profilePicture ?? null;
  const displayedName = profile?.displayName ?? profile?.name ?? worker.name;
  const nameRemaining = daysLeft(profile?.displayNameChangedAt, 7);
  const idRemaining   = daysLeft(profile?.employeeIdChangedAt, 30);

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
                onSave={saveName}
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
                onSave={saveId}
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
