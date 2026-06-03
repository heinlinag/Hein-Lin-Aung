import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle2, Info, XCircle, Loader2, RefreshCw } from "lucide-react";
import type { Announcement } from "../../../drizzle/schema";

type AnnType = "info" | "warning" | "success" | "error";

const TYPE_CONFIG: Record<AnnType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  info:    { label: "Info",    icon: <Info size={14} />,          color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  warning: { label: "Warning", icon: <AlertTriangle size={14} />, color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200" },
  success: { label: "Success", icon: <CheckCircle2 size={14} />,  color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
  error:   { label: "Alert",   icon: <XCircle size={14} />,       color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
};

function RefreshButton({ onRefresh }: { onRefresh: () => void }) {
  const [spinning, setSpinning] = useState(false);
  return (
    <button
      onClick={() => { setSpinning(true); onRefresh(); setTimeout(() => setSpinning(false), 800); }}
      className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground transition-colors"
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
      setShowForm(false);
      setTitle("");
      setMessage("");
      setType("info");
      setExpiresIn("never");
    },
    onError: (e) => toast.error(e.message),
  });

  const setActiveMutation = trpc.announcements.setActive.useMutation({
    onSuccess: () => {
      utils.announcements.listAll.invalidate();
      utils.announcements.listActive.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      toast.success("Announcement deleted");
      utils.announcements.listAll.invalidate();
      utils.announcements.listActive.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleCreate() {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    let expiresAt: number | undefined;
    if (expiresIn !== "never") {
      const hours = parseInt(expiresIn, 10);
      expiresAt = Date.now() + hours * 60 * 60 * 1000;
    }
    createMutation.mutate({ title: title.trim(), message: message.trim(), type, createdBy: "Admin", expiresAt });
  }

  const activeCount = (allAnnouncements as Announcement[]).filter((a: Announcement) => a.isActive).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone size={16} className="text-indigo-500" />
            Announcements
            {activeCount > 0 && (
              <span className="ml-1 text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {activeCount} active
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Publish banners that appear for all users when they open the app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={() => utils.announcements.listAll.invalidate()} />
          <button
            onClick={() => setShowForm(v => !v)}
            title="New Announcement"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
          <p className="text-sm font-semibold text-indigo-800">Create Announcement</p>

          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {(["info", "warning", "success", "error"] as AnnType[]).map((t: AnnType) => {
              const cfg = TYPE_CONFIG[t];
              const active = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    active ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-2 ring-offset-1 ring-indigo-400` : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="e.g. System Maintenance Tonight"
              maxLength={255}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Write your announcement message here..."
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none"
            />
          </div>

          {/* Expires */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Auto-expire after</label>
            <select
              value={expiresIn}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpiresIn(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
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
            <div className={`rounded-lg border p-3 ${TYPE_CONFIG[type].bg} ${TYPE_CONFIG[type].border}`}>
              <p className={`text-xs font-bold mb-0.5 flex items-center gap-1.5 ${TYPE_CONFIG[type].color}`}>
                {TYPE_CONFIG[type].icon}
                {title || "Preview Title"}
              </p>
              <p className={`text-xs ${TYPE_CONFIG[type].color} opacity-90`}>{message || "Preview message..."}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Megaphone size={13} />}
              Publish
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : allAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Megaphone size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Click "New Announcement" to publish one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(allAnnouncements as Announcement[]).map((ann: Announcement) => {
            const cfg = TYPE_CONFIG[ann.type as AnnType] ?? TYPE_CONFIG.info;
            const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
            return (
              <div
                key={ann.id}
                className={`rounded-xl border p-3 flex items-start gap-3 transition-all ${
                  ann.isActive && !isExpired ? `${cfg.bg} ${cfg.border}` : "bg-gray-50 border-gray-200 opacity-60"
                }`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-xs font-bold ${cfg.color}`}>{ann.title}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    {isExpired && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        Expired
                      </span>
                    )}
                    {!ann.isActive && !isExpired && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${cfg.color} opacity-90 line-clamp-2`}>{ann.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    By {ann.createdBy} · {new Date(ann.createdAt).toLocaleString()}
                    {ann.expiresAt && !isExpired && (
                      <> · Expires {new Date(ann.expiresAt).toLocaleString()}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setActiveMutation.mutate({ id: ann.id, isActive: !ann.isActive })}
                    disabled={setActiveMutation.isPending}
                    title={ann.isActive ? "Deactivate" : "Activate"}
                    className="p-1.5 rounded-lg hover:bg-white/60 text-muted-foreground hover:text-gray-700 transition-colors"
                  >
                    {ann.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${ann.title}"?`)) deleteMutation.mutate({ id: ann.id });
                    }}
                    disabled={deleteMutation.isPending}
                    title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
