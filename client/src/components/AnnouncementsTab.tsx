import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle2, Info, XCircle, Loader2, RefreshCw } from "lucide-react";
import type { Announcement } from "../../../drizzle/schema";

type AnnType = "info" | "warning" | "success" | "error";

// Dark glassmorphism type config
const TYPE_CONFIG: Record<AnnType, { label: string; icon: React.ReactNode; accentColor: string; glowBg: string; borderColor: string; textColor: string }> = {
  info:    { label: "Info",    icon: <Info size={14} />,          accentColor: "#60a5fa", glowBg: "rgba(59,130,246,0.12)",  borderColor: "rgba(59,130,246,0.3)",  textColor: "#93c5fd" },
  warning: { label: "Warning", icon: <AlertTriangle size={14} />, accentColor: "#fbbf24", glowBg: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)", textColor: "#fcd34d" },
  success: { label: "Success", icon: <CheckCircle2 size={14} />,  accentColor: "#34d399", glowBg: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.3)", textColor: "#6ee7b7" },
  error:   { label: "Alert",   icon: <XCircle size={14} />,       accentColor: "#f87171", glowBg: "rgba(239,68,68,0.12)",  borderColor: "rgba(239,68,68,0.3)",  textColor: "#fca5a5" },
};

function RefreshButton({ onRefresh }: { onRefresh: () => void }) {
  const [spinning, setSpinning] = useState(false);
  return (
    <button
      onClick={() => { setSpinning(true); onRefresh(); setTimeout(() => setSpinning(false), 800); }}
      className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-white"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
      title="Refresh"
    >
      <RefreshCw size={14} className={spinning ? "animate-spin" : ""} />
    </button>
  );
}

export function AnnouncementsTab() {
  const utils = trpc.useUtils();
  const { data: allAnnouncements = [], isLoading } = trpc.announcements.listAll.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnType>("info");
  const [expiresIn, setExpiresIn] = useState<string>("never");

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      toast.success("Announcement published!");
      utils.announcements.listAll.invalidate();
      utils.announcements.listActive.invalidate();
      setShowForm(false); setTitle(""); setMessage(""); setType("info"); setExpiresIn("never");
    },
    onError: (e) => toast.error(e.message),
  });

  const setActiveMutation = trpc.announcements.setActive.useMutation({
    onSuccess: () => { utils.announcements.listAll.invalidate(); utils.announcements.listActive.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => { toast.success("Announcement deleted"); utils.announcements.listAll.invalidate(); utils.announcements.listActive.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function handleCreate() {
    if (!title.trim() || !message.trim()) { toast.error("Title and message are required"); return; }
    let expiresAt: number | undefined;
    if (expiresIn !== "never") expiresAt = Date.now() + parseInt(expiresIn, 10) * 60 * 60 * 1000;
    createMutation.mutate({ title: title.trim(), message: message.trim(), type, createdBy: "Admin", expiresAt });
  }

  const activeCount = (allAnnouncements as Announcement[]).filter((a: Announcement) => a.isActive).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            <Megaphone size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Announcements
              {activeCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" }}>
                  {activeCount} active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Publish banners that appear for all users when they open the app.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={() => utils.announcements.listAll.invalidate()} />
          <button
            onClick={() => setShowForm(v => !v)}
            title="New Announcement"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}>
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #7c3aed)" }} />
          <div className="p-4 space-y-3">
            <p className="text-sm font-bold text-indigo-300">Create Announcement</p>

            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {(["info", "warning", "success", "error"] as AnnType[]).map((t: AnnType) => {
                const cfg = TYPE_CONFIG[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                    style={active ? {
                      background: cfg.glowBg,
                      borderColor: cfg.borderColor,
                      color: cfg.textColor,
                      boxShadow: `0 0 0 2px ${cfg.borderColor}`,
                    } : {
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "rgba(148,163,184,0.8)",
                    }}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="e.g. System Maintenance Tonight"
                maxLength={255}
                className="w-full text-sm rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                placeholder="Write your announcement message here..."
                rows={3}
                className="w-full text-sm rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            {/* Expires */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Auto-expire after</label>
              <select
                value={expiresIn}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpiresIn(e.target.value)}
                className="text-sm rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value="never">Never (manual deactivate)</option>
                <option value="1">1 hour</option>
                <option value="4">4 hours</option>
                <option value="8">8 hours</option>
                <option value="24">24 hours</option>
                <option value="72">3 days</option>
                <option value="168">7 days</option>
              </select>
            </div>

            {/* Preview */}
            {(title || message) && (
              <div className="rounded-xl p-3" style={{ background: TYPE_CONFIG[type].glowBg, border: `1px solid ${TYPE_CONFIG[type].borderColor}` }}>
                <p className="text-xs font-bold mb-0.5 flex items-center gap-1.5" style={{ color: TYPE_CONFIG[type].textColor }}>
                  {TYPE_CONFIG[type].icon}
                  {title || "Preview Title"}
                </p>
                <p className="text-xs opacity-80" style={{ color: TYPE_CONFIG[type].textColor }}>{message || "Preview message..."}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
              >
                {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Megaphone size={13} />}
                Publish
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-xs font-semibold px-4 py-2 rounded-xl text-slate-300 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />)}
        </div>
      ) : allAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Megaphone size={28} className="text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-400">No announcements yet</p>
          <p className="text-xs text-slate-600 mt-1">Click the + button to publish one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(allAnnouncements as Announcement[]).map((ann: Announcement) => {
            const cfg = TYPE_CONFIG[ann.type as AnnType] ?? TYPE_CONFIG.info;
            const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
            const isActive = ann.isActive && !isExpired;
            return (
              <div
                key={ann.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  background: isActive ? cfg.glowBg : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? cfg.borderColor : "rgba(255,255,255,0.07)"}`,
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                {/* Left accent bar */}
                <div className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 flex-shrink-0" style={{ color: cfg.accentColor }}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold" style={{ color: cfg.textColor }}>{ann.title}</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: cfg.glowBg, border: `1px solid ${cfg.borderColor}`, color: cfg.textColor }}>
                        {cfg.label}
                      </span>
                      {isExpired && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
                          Expired
                        </span>
                      )}
                      {!ann.isActive && !isExpired && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 opacity-80 line-clamp-2" style={{ color: cfg.textColor }}>{ann.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      By {ann.createdBy} · {new Date(ann.createdAt).toLocaleString()}
                      {ann.expiresAt && !isExpired && <> · Expires {new Date(ann.expiresAt).toLocaleString()}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setActiveMutation.mutate({ id: ann.id, isActive: !ann.isActive })}
                      disabled={setActiveMutation.isPending}
                      title={ann.isActive ? "Deactivate" : "Activate"}
                      className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-white"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      {ann.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${ann.title}"?`)) deleteMutation.mutate({ id: ann.id }); }}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                      className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
