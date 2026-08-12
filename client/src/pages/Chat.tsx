/**
 * Chat — Glassmorphism Messaging Hub
 * Features: Online status, typing indicator, message reply/quote, message delete,
 * search within conversation, auto-resize textarea, sound notifications,
 * smooth scroll with "New messages" floating button, improved empty states
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import {
  MessageCircle, Search, Plus, ArrowLeft, Send,
  X, UserCircle2, MessageSquareDot, Check, CheckCheck,
  Users, LogOut, Crown, Reply, Trash2, ArrowDown, BadgeCheck, Bell,
  ShieldCheck, Sparkles, Wifi, Paperclip, FileText, Download, Loader2, Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SYSTEM_MAINTENANCE_SENDER_ID = "SYSTEM_MAINTENANCE";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reaction { id: number; messageType: "dm" | "group"; messageID: number; workerID: string; emoji: string; createdAt: Date; }
interface Worker { id: number; workerID: string; name: string; department: string; userLevel: string; lastSeenAt?: Date | null; }
interface ChatAttachment { id: number; messageType: "dm" | "group"; messageID: number; fileName: string; mimeType: string; sizeBytes: number; uploadedBy: string; createdAt: Date; }
interface UploadedAttachment { storageKey: string; fileName: string; mimeType: string; sizeBytes: number; }
interface PendingAttachment { file: File; previewUrl: string | null; }
interface ConvMessage { id: number; conversationID: number; senderID: string; text: string; replyToID: number | null; deletedAt: Date | null; createdAt: Date; readAt: Date | null; attachment?: ChatAttachment | null; }
interface Conversation { id: number; worker1ID: string; worker2ID: string; lastMessageAt: Date; createdAt: Date; otherWorker: Worker | null; lastMessage: ConvMessage | null; unreadCount: number; }
interface GroupMessage { id: number; groupID: number; senderID: string; senderName: string; text: string; replyToID: number | null; deletedAt: Date | null; createdAt: Date; attachment?: ChatAttachment | null; }
interface Group { id: number; name: string; createdBy: string; lastMessageAt: Date; createdAt: Date; memberCount: number; memberIDs: string[]; lastMessage: GroupMessage | null; }
interface GroupMember { id: number; groupID: number; workerID: string; joinedAt: Date; worker: Worker | null; }

// ─── Page-local animations ────────────────────────────────────────────────────
const chatStyles = `
@keyframes chatFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-12px) scale(1.03)} }
@keyframes chatScan  { 0%{top:-2px;opacity:0} 10%{opacity:.6} 90%{opacity:.6} 100%{top:100%;opacity:0} }
@keyframes chatPulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
@keyframes chatFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes chatBubble { from{opacity:0;transform:scale(.95) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }
.chat-float  { animation: chatFloat  6s ease-in-out infinite }
.chat-scan   { animation: chatScan   4s linear infinite }
.chat-pulse  { animation: chatPulse  2s ease-in-out infinite }
.chat-fadeup { animation: chatFadeUp .25s ease both }
.chat-bubble { animation: chatBubble .18s ease both }
.chat-shell { position:relative; isolation:isolate; background:linear-gradient(135deg,#070b18 0%,#101334 48%,#071525 100%); }
.chat-shell::before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.035; background-image:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.55) 3px,rgba(255,255,255,.55) 4px); }
.chat-sidebar { background:linear-gradient(180deg,rgba(12,19,38,.94),rgba(8,15,30,.94)); }
.chat-sidebar-head { background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(14,165,233,.06) 55%,rgba(20,184,166,.08)); }
.chat-list-item { position:relative; overflow:hidden; }
.chat-list-item::after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(90deg,rgba(129,140,248,.08),transparent 62%); opacity:0; transition:opacity .2s ease; }
.chat-list-item:hover::after { opacity:1; }
.chat-thread { position:relative; overflow:hidden; background:radial-gradient(circle at 85% 8%,rgba(56,189,248,.10),transparent 30%),radial-gradient(circle at 12% 88%,rgba(99,102,241,.11),transparent 34%),linear-gradient(160deg,#0a0f1e 0%,#0d1b2a 40%,#0a1628 100%); }
.chat-thread-header { background:linear-gradient(90deg,rgba(15,23,42,.97),rgba(17,31,56,.9)); backdrop-filter:blur(20px); }
.chat-message-canvas { background:linear-gradient(180deg,rgba(8,15,30,.26),rgba(8,15,30,.05)); }
.chat-composer { background:linear-gradient(90deg,rgba(15,23,42,.98),rgba(17,29,51,.96)); backdrop-filter:blur(22px); box-shadow:0 -12px 30px rgba(2,6,23,.22); }
.chat-send-button { box-shadow:0 10px 24px rgba(79,70,229,.35); }
.chat-group-send-button { box-shadow:0 10px 24px rgba(13,148,136,.32); }
@media (max-width: 767px) { .chat-shell { padding:8px; } .chat-mobile-panel { border-radius:22px; border:1px solid rgba(255,255,255,.10); box-shadow:0 18px 48px rgba(2,6,23,.32); } }
`;

// ─── Sound Hook ──────────────────────────────────────────────────────────────
function useMessageSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const play = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (_) { /* ignore audio errors */ }
  }, []);
  return play;
}

// ─── Heartbeat Hook ──────────────────────────────────────────────────────────
function useHeartbeat(workerID: string) {
  const heartbeat = trpc.chat.heartbeat.useMutation();
  useEffect(() => {
    if (!workerID) return;
    heartbeat.mutate({ workerID });
    const interval = setInterval(() => heartbeat.mutate({ workerID }), 30000);
    return () => clearInterval(interval);
  }, [workerID]);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isThisYear) return d.toLocaleDateString([], { month: "short", day: "numeric" });
  return d.toLocaleDateString([], { year: "2-digit", month: "short", day: "numeric" });
}
function formatMessageTime(date: Date | string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDateSeparator(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
function formatLastSeen(date: Date | string | null | undefined) {
  if (!date) return "offline";
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return "online";
  if (diff < 3600000) return `last seen ${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `last seen ${Math.floor(diff / 3600000)}h ago`;
  return `last seen ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}
function getInitials(name: string) {
  return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
}
function levelColor(level: string) {
  if (level === "1") return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
  if (level === "1.1") return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
  return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
}

// ─── Avatar with Online Indicator ────────────────────────────────────────────
function Avatar({ name, size = "md", isGroup = false, online }: { name: string; size?: "sm" | "md" | "lg"; isGroup?: boolean; online?: boolean }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-violet-600",
    "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600",
    "from-cyan-500 to-sky-600",
    "from-indigo-500 to-blue-600",
  ];
  const grad = isGroup ? "from-teal-500 to-emerald-600" : gradients[name.charCodeAt(0) % gradients.length];
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} bg-gradient-to-br ${grad} rounded-full flex items-center justify-center text-white font-semibold shadow-lg ring-1 ring-white/20`}>
        {isGroup ? <Users size={size === "sm" ? 14 : size === "lg" ? 20 : 16} /> : getInitials(name)}
      </div>
      {online !== undefined && !isGroup && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 shadow-sm ${online ? "bg-emerald-400" : "bg-slate-500"}`} />
      )}
    </div>
  );
}

// ─── Auto-Resize Textarea ────────────────────────────────────────────────────
function AutoResizeInput({ value, onChange, onKeyDown, placeholder, maxLength, inputRef }: {
  value: string; onChange: (v: string) => void; onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string; maxLength: number; inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => { onChange(e.target.value); };
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);
  return (
    <textarea
      ref={inputRef}
      value={value}
      onChange={handleInput}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={1}
      className="w-full bg-transparent text-sm outline-none text-slate-100 placeholder:text-slate-400 resize-none overflow-hidden leading-[1.4]"
      style={{ minHeight: "20px", maxHeight: "120px" }}
    />
  );
}

// ─── Message Attachments ─────────────────────────────────────────────────────
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MESSAGE_ATTACHMENT_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "text/csv",
  "application/msword", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useMessageAttachment(workerID: string, deviceToken?: string) {
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const clear = useCallback(() => {
    setPending(current => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    setUploadProgress(0);
  }, []);

  const selectFile = useCallback((file: File) => {
    if (!MESSAGE_ATTACHMENT_TYPES.includes(file.type)) {
      toast.error("Choose an image, PDF, text, CSV, Word, or Excel file.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Attachments must be 10 MB or smaller.");
      return;
    }
    setPending(current => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return { file, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null };
    });
    setUploadProgress(0);
  }, []);

  const upload = useCallback(async (): Promise<UploadedAttachment | undefined> => {
    if (!pending) return undefined;
    if (!workerID || !deviceToken) throw new Error("Your worker session needs refreshing. Please sign in again.");
    setIsUploading(true);
    setUploadProgress(0);
    try {
      return await new Promise<UploadedAttachment>((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", pending.file);
        formData.append("workerID", workerID);
        formData.append("deviceToken", deviceToken);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/chat-upload");
        xhr.upload.onprogress = event => {
          if (event.lengthComputable) setUploadProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
        };
        xhr.onerror = () => reject(new Error("Upload connection failed. Please try again."));
        xhr.onload = () => {
          try {
            const response = JSON.parse(xhr.responseText || "{}");
            if (xhr.status < 200 || xhr.status >= 300 || !response.attachment) {
              reject(new Error(response.error || "Unable to upload this attachment."));
              return;
            }
            setUploadProgress(100);
            resolve(response.attachment as UploadedAttachment);
          } catch {
            reject(new Error("Unable to upload this attachment."));
          }
        };
        xhr.send(formData);
      });
    } finally {
      setIsUploading(false);
    }
  }, [deviceToken, pending, workerID]);

  return { pending, isUploading, uploadProgress, selectFile, upload, clear };
}

function AttachmentPicker({ attachment, isUploading, uploadProgress, onSelect, onRemove, accent = "indigo" }: {
  attachment: PendingAttachment | null; isUploading: boolean; uploadProgress: number; onSelect: (file: File) => void; onRemove: () => void; accent?: "indigo" | "teal";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accentClass = accent === "teal" ? "text-teal-300 border-teal-400/25 bg-teal-400/10" : "text-indigo-300 border-indigo-400/25 bg-indigo-400/10";
  return (
    <>
      <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx" onChange={event => {
        const file = event.target.files?.[0];
        if (file) onSelect(file);
        event.currentTarget.value = "";
      }} />
      {attachment ? (
        <div className="mx-3 mb-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-2.5 shadow-inner">
          {attachment.previewUrl ? <img src={attachment.previewUrl} alt="Selected attachment preview" className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/15" /> : <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accentClass}`}><FileText size={20} /></div>}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-100">{attachment.file.name}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{isUploading ? `Uploading ${uploadProgress}%` : formatFileSize(attachment.file.size)}</p>
            {isUploading && <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-all ${accent === "teal" ? "bg-teal-400" : "bg-indigo-400"}`} style={{ width: `${uploadProgress}%` }} /></div>}
          </div>
          <button type="button" onClick={onRemove} disabled={isUploading} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40" aria-label="Remove attachment"><X size={15} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="mb-1 ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white" title="Attach a file" aria-label="Attach a file"><Paperclip size={17} /></button>
      )}
    </>
  );
}

function MessageAttachmentCard({ attachment, workerID }: { attachment: ChatAttachment; workerID: string }) {
  const { worker } = useAuth();
  const deviceToken = worker?.deviceToken;
  const isImage = attachment.mimeType.startsWith("image/");
  const download = trpc.chat.getAttachmentDownload.useQuery({ attachmentID: attachment.id || 1, workerID, deviceToken: deviceToken || "missing" }, { enabled: false, retry: false });
  const handleDownload = async () => {
    if (!deviceToken) { toast.error("Your session needs refreshing. Please sign in again."); return; }
    const result = await download.refetch();
    if (!result.data?.url) { toast.error("Unable to prepare the attachment download."); return; }
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  };
  return (
    <button type="button" onClick={handleDownload} disabled={download.isFetching} className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-white/15 bg-slate-950/25 p-2.5 text-left transition-colors hover:bg-white/10 disabled:opacity-60">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isImage ? "bg-cyan-400/15 text-cyan-200" : "bg-indigo-400/15 text-indigo-200"}`}>{isImage ? <ImageIcon size={17} /> : <FileText size={17} />}</div>
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-100">{attachment.fileName}</p><p className="mt-0.5 text-[10px] text-slate-400">{formatFileSize(attachment.sizeBytes)} · {isImage ? "Image" : "File"}</p></div>
      {download.isFetching ? <Loader2 size={16} className="animate-spin text-slate-300" /> : <Download size={16} className="text-slate-300" />}
    </button>
  );
}

// ─── Glass Modal Wrapper ─────────────────────────────────────────────────────
function GlassModal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: "linear-gradient(135deg,rgba(15,23,42,.97) 0%,rgba(30,41,59,.97) 100%)" }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── New Message Modal ────────────────────────────────────────────────────────
function NewMessageModal({ workerID, onClose, onSelect }: { workerID: string; onClose: () => void; onSelect: (worker: Worker) => void; }) {
  const [search, setSearch] = useState("");
  const { data: workers = [] } = trpc.chat.getWorkers.useQuery({ workerID }, { refetchOnWindowFocus: false });
  const workerIDs = useMemo(() => (workers as Worker[]).map(w => w.workerID), [workers]);
  const { data: onlineStatus = {} } = trpc.chat.getOnlineStatus.useQuery({ workerIDs }, { enabled: workerIDs.length > 0, refetchInterval: 15000 });
  const filtered = (workers as Worker[]).filter((w: Worker) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.workerID.toLowerCase().includes(search.toLowerCase()) ||
    w.department.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <GlassModal onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
            <MessageCircle size={15} className="text-white" />
          </div>
          <h3 className="font-bold text-white text-sm">New Message</h3>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X size={14} className="text-slate-300" />
        </button>
      </div>
      {/* Search */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search workers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-400 outline-none focus:border-indigo-400/50 focus:bg-white/15 transition-all" autoFocus />
        </div>
      </div>
      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No workers found</div>
        ) : filtered.map((w: Worker) => {
          const status = (onlineStatus as Record<string, { online: boolean }>)[w.workerID];
          return (
            <button key={w.workerID} onClick={() => onSelect(w)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0">
              <Avatar name={w.name} size="md" online={status?.online} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">{w.name}</div>
                <div className="text-xs text-slate-400 truncate">{w.workerID} · {w.department}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor(w.userLevel)}`}>L{w.userLevel}</span>
            </button>
          );
        })}
      </div>
    </GlassModal>
  );
}

// ─── New Group Modal ──────────────────────────────────────────────────────────
function NewGroupModal({ workerID, onClose, onCreate }: { workerID: string; onClose: () => void; onCreate: (group: Group) => void; }) {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { data: workers = [] } = trpc.chat.getWorkers.useQuery({ workerID }, { refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const createGroup = trpc.groupChat.create.useMutation({
    onSuccess: (group) => { utils.groupChat.getGroups.invalidate({ workerID }); onCreate(group as unknown as Group); toast.success(`Group "${(group as unknown as Group)?.name}" created!`); },
    onError: () => toast.error("Failed to create group"),
  });
  const filtered = (workers as Worker[]).filter((w: Worker) =>
    w.name.toLowerCase().includes(search.toLowerCase()) || w.workerID.toLowerCase().includes(search.toLowerCase())
  );
  function handleCreate() {
    if (!groupName.trim() || selected.length === 0) return;
    createGroup.mutate({ name: groupName.trim(), createdBy: workerID, memberIDs: [workerID, ...selected] });
  }
  return (
    <GlassModal onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <Users size={15} className="text-white" />
          </div>
          <h3 className="font-bold text-white text-sm">New Group</h3>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X size={14} className="text-slate-300" />
        </button>
      </div>
      {/* Inputs */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0 space-y-2">
        <input placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-400 outline-none focus:border-teal-400/50 transition-all" autoFocus />
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-400 outline-none focus:border-teal-400/50 transition-all" />
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selected.map(id => {
              const w = (workers as Worker[]).find(w => w.workerID === id);
              return (
                <span key={id} className="flex items-center gap-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs px-2 py-1 rounded-full">
                  {w?.name || id}
                  <button onClick={() => setSelected(s => s.filter(x => x !== id))} className="hover:text-red-400"><X size={10} /></button>
                </span>
              );
            })}
          </div>
        )}
      </div>
      {/* Member list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((w: Worker) => {
          const isSelected = selected.includes(w.workerID);
          return (
            <button key={w.workerID} onClick={() => setSelected(s => isSelected ? s.filter(x => x !== w.workerID) : s.length < 9 ? [...s, w.workerID] : s)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0 ${isSelected ? "bg-teal-500/10" : ""}`}>
              <Avatar name={w.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">{w.name}</div>
                <div className="text-xs text-slate-400 truncate">{w.workerID} · {w.department}</div>
              </div>
              {isSelected && <Check size={16} className="text-teal-400" />}
            </button>
          );
        })}
      </div>
      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
        <button onClick={handleCreate} disabled={!groupName.trim() || selected.length === 0 || createGroup.isPending}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity shadow-lg">
          {createGroup.isPending ? "Creating..." : `Create Group (${selected.length + 1} members)`}
        </button>
      </div>
    </GlassModal>
  );
}

// ─── Emoji Picker ────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-1 z-50 rounded-2xl shadow-2xl border border-white/10 px-2 py-1.5 flex gap-1"
        style={{ background: "rgba(15,23,42,.95)", backdropFilter: "blur(16px)" }}>
        {QUICK_EMOJIS.map(e => (
          <button key={e} onClick={() => { onSelect(e); onClose(); }}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-colors">{e}</button>
        ))}
      </div>
    </>
  );
}

// ─── Reaction Bar ────────────────────────────────────────────────────────────
function ReactionBar({ reactions, workerID, onToggle }: { reactions: Reaction[]; workerID: string; onToggle: (emoji: string) => void }) {
  if (reactions.length === 0) return null;
  const grouped: Record<string, { count: number; mine: boolean }> = {};
  reactions.forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
    grouped[r.emoji].count++;
    if (r.workerID === workerID) grouped[r.emoji].mine = true;
  });
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, { count, mine }]) => (
        <button key={emoji} onClick={() => onToggle(emoji)}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors
            ${mine ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-300" : "bg-white/10 border-white/15 text-slate-300 hover:bg-white/20"}`}>
          <span>{emoji}</span><span className="font-medium">{count}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Reply Preview Bar ───────────────────────────────────────────────────────
function ReplyPreview({ text, senderName, onCancel }: { text: string; senderName: string; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-white/10" style={{ background: "rgba(15,23,42,.9)", backdropFilter: "blur(12px)" }}>
      <div className="w-1 h-8 bg-gradient-to-b from-indigo-400 to-blue-500 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-indigo-300">{senderName}</div>
        <div className="text-xs text-slate-400 truncate">{text}</div>
      </div>
      <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={14} className="text-slate-400" /></button>
    </div>
  );
}

// ─── Send Alert Button ───────────────────────────────────────────────────────
function SendAlertButton({ senderID, senderName, recipientID, recipientName }: {
  senderID: string; senderName: string; recipientID: string; recipientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const sendAlert = trpc.notifications.sendAlert.useMutation({
    onSuccess: () => { toast.success(`Alert sent to ${recipientName}!`); setTitle(""); setMessage(""); setOpen(false); },
    onError: (err) => toast.error(err.message || "Failed to send alert."),
  });
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!message.trim()) { toast.error("Message is required."); return; }
    sendAlert.mutate({ senderID, senderName, recipientID, title: title.trim(), message: message.trim() });
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Send Alert">
        <Bell size={16} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4"
            style={{ background: "linear-gradient(135deg,rgba(15,23,42,.97) 0%,rgba(30,41,59,.97) 100%)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                  <Bell size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Send Alert</h3>
                  <p className="text-xs text-slate-400">To: {recipientName}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X size={14} className="text-slate-300" />
              </button>
            </div>
            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Alert Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Urgent, Please check stock" maxLength={100}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your alert message..." maxLength={500} rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-white/10 border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/20 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={sendAlert.isPending || !title.trim() || !message.trim()}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg">
                  {sendAlert.isPending ? "Sending..." : "Send Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Shared Thread Styles ────────────────────────────────────────────────────
const threadBg = "linear-gradient(160deg,#0a0f1e 0%,#0d1b2a 40%,#0a1628 100%)";

// ─── DM Thread ────────────────────────────────────────────────────────────────────────────
function DMThread({ conv, workerID, workerName, deviceToken, onBack }: { conv: Conversation; workerID: string; workerName: string; deviceToken?: string; onBack?: () => void }) {
  const [text, setText] = useState("");
  const [emojiPickerMsgID, setEmojiPickerMsgID] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<ConvMessage | null>(null);
  const attachment = useMessageAttachment(workerID, deviceToken);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();
  const playSound = useMessageSound();
  const prevMsgCountRef = useRef(0);

  const { data: messages = [] } = trpc.chat.getMessages.useQuery({ conversationID: conv.id }, { refetchInterval: 2000 });
  const msgIDs = (messages as ConvMessage[]).map(m => m.id);
  const { data: reactions = [] } = trpc.reactions.getForMessages.useQuery(
    { messageType: "dm", messageIDs: msgIDs }, { enabled: msgIDs.length > 0, refetchInterval: 3000 }
  );
  const otherWorkerID = conv.otherWorker?.workerID || "";
  const { data: onlineStatus = {} } = trpc.chat.getOnlineStatus.useQuery(
    { workerIDs: otherWorkerID ? [otherWorkerID] : [] }, { enabled: !!otherWorkerID, refetchInterval: 15000 }
  );
  const otherOnline = (onlineStatus as Record<string, { online: boolean; lastSeenAt: Date | null }>)[otherWorkerID];
  const { data: searchResults = [] } = trpc.chat.searchMessages.useQuery(
    { conversationID: conv.id, query: searchQuery }, { enabled: searchQuery.length >= 2 }
  );
  const toggleReaction = trpc.reactions.toggle.useMutation({
    onSettled: () => utils.reactions.getForMessages.invalidate({ messageType: "dm", messageIDs: msgIDs }),
  });
  const sendMsg = trpc.chat.sendMessageWithReply.useMutation({
    onMutate: async (vars) => {
      await utils.chat.getMessages.cancel({ conversationID: conv.id });
      const prev = utils.chat.getMessages.getData({ conversationID: conv.id });
      utils.chat.getMessages.setData({ conversationID: conv.id }, (old) => [
        ...(old || []),
        { id: Date.now(), conversationID: conv.id, senderID: vars.senderID, text: vars.text, replyToID: vars.replyToID || null, deletedAt: null, createdAt: new Date(), readAt: null, attachment: vars.attachment ? { id: 0, messageType: "dm", messageID: 0, ...vars.attachment, uploadedBy: vars.senderID, createdAt: new Date() } : null },
      ]);
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev) utils.chat.getMessages.setData({ conversationID: conv.id }, ctx.prev as any);
    },
    onSettled: () => {
      utils.chat.getMessages.invalidate({ conversationID: conv.id });
      utils.chat.getConversations.invalidate({ workerID });
    },
  });
  const deleteMsg = trpc.chat.deleteMessage.useMutation({
    onSuccess: () => { utils.chat.getMessages.invalidate({ conversationID: conv.id }); toast.success("Message deleted"); },
    onError: () => toast.error("Failed to delete message"),
  });
  const markRead = trpc.chat.markRead.useMutation();

  useEffect(() => {
    const currentCount = (messages as ConvMessage[]).length;
    if (prevMsgCountRef.current > 0 && currentCount > prevMsgCountRef.current) {
      const lastMsg = (messages as ConvMessage[])[currentCount - 1];
      if (lastMsg && lastMsg.senderID !== workerID) playSound();
    }
    prevMsgCountRef.current = currentCount;
  }, [messages]);
  useEffect(() => { if (!showScrollBtn) bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    markRead.mutate({ conversationID: conv.id, workerID });
    inputRef.current?.focus();
    setReplyTo(null);
    setText("");
    attachment.clear();
  }, [conv.id]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };
  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !attachment.pending) return;
    try {
      const uploadedAttachment = await attachment.upload();
      sendMsg.mutate({ conversationID: conv.id, senderID: workerID, senderName: workerName, text: trimmed, replyToID: replyTo?.id, attachment: uploadedAttachment });
      setText(""); setReplyTo(null); attachment.clear(); inputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload this attachment.");
    }
  }
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const activeMessages = (messages as ConvMessage[]).filter(m => !m.deletedAt);
  const grouped: { date: string; msgs: ConvMessage[] }[] = [];
  activeMessages.forEach((msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== dateKey) grouped.push({ date: dateKey, msgs: [msg] });
    else last.msgs.push(msg);
  });
  const isSystemMaintenance = conv.worker1ID === SYSTEM_MAINTENANCE_SENDER_ID || conv.worker2ID === SYSTEM_MAINTENANCE_SENDER_ID;
  const otherName = isSystemMaintenance ? "Scheduled Maintenance" : (conv.otherWorker?.name || "Unknown");

  return (
    <div className="chat-thread flex flex-col h-full">
      {/* Header */}
      <div className="chat-thread-header px-4 py-3.5 flex items-center gap-3 flex-shrink-0 border-b border-white/10">
        {onBack && (
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
            <ArrowLeft size={16} className="text-slate-300" />
          </button>
        )}
        {isSystemMaintenance
          ? <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm"><BadgeCheck size={18} className="text-white" /></div>
          : <Avatar name={otherName} online={otherOnline?.online} />}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate flex items-center gap-1">
            {otherName}
            {isSystemMaintenance && <BadgeCheck size={13} className="text-blue-400 flex-shrink-0" />}
          </div>
          <div className="text-xs text-slate-400 truncate">
            {isSystemMaintenance ? "System" : (otherOnline?.online ? <span className="text-emerald-400">online</span> : formatLastSeen(otherOnline?.lastSeenAt))}
          </div>
        </div>
        {!isSystemMaintenance && (
          <SendAlertButton senderID={workerID} senderName={workerName}
            recipientID={conv.worker1ID === workerID ? conv.worker2ID : conv.worker1ID} recipientName={otherName} />
        )}
        <button onClick={() => setShowSearch(!showSearch)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300">
          <Search size={16} />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2"
          style={{ background: "rgba(15,23,42,.85)", backdropFilter: "blur(12px)" }}>
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in conversation..."
            className="flex-1 text-sm outline-none text-white bg-transparent placeholder:text-slate-500" autoFocus />
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={14} className="text-slate-400" /></button>
          {searchQuery.length >= 2 && <span className="text-xs text-slate-500">{(searchResults as any[]).length} results</span>}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="chat-message-canvas flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <MessageCircle size={36} className="opacity-40" />
            </div>
            <p className="text-sm font-medium text-slate-400">No messages yet</p>
            <p className="text-xs mt-1 text-slate-500">Say hello to {otherName}!</p>
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <span className="bg-white/10 backdrop-blur-sm text-slate-400 text-xs px-3 py-1 rounded-full border border-white/10 font-medium">{formatDateSeparator(new Date(date))}</span>
            </div>
            {msgs.map((msg: ConvMessage, i: number) => {
              const isMine = msg.senderID === workerID;
              const msgReactions = (reactions as Reaction[]).filter(r => r.messageID === msg.id);
              const nextMsg = i < msgs.length - 1 ? msgs[i + 1] : null;
              const isLast = !nextMsg || nextMsg.senderID !== msg.senderID;
              const radius = isMine ? `rounded-[18px] ${isLast ? "rounded-br-[4px]" : ""}` : `rounded-[18px] ${isLast ? "rounded-bl-[4px]" : ""}`;
              const replyMsg = msg.replyToID ? activeMessages.find(m => m.id === msg.replyToID) : null;
              const bubbleBg = isMine
                ? "bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-900/40"
                : msg.senderID === SYSTEM_MAINTENANCE_SENDER_ID
                  ? "bg-blue-900/40 border border-blue-500/20"
                  : "bg-white/10 border border-white/10 backdrop-blur-sm";
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isLast ? "mb-1" : "mb-0.5"} chat-bubble`}>
                  {!isMine && <div className="w-8 mr-1 flex-shrink-0" />}
                  <div className="relative group max-w-[75%] md:max-w-[65%]">
                    <div className={`px-3 py-[6px] shadow-md text-sm ${radius} ${bubbleBg}`}>
                      {replyMsg && (
                        <div className="mb-1 pl-2 border-l-2 border-indigo-400/60 bg-white/5 rounded-r-lg px-2 py-1">
                          <div className="text-[10px] font-semibold text-indigo-300">{replyMsg.senderID === workerID ? "You" : otherName}</div>
                          <div className="text-[11px] text-slate-400 truncate">{replyMsg.text}</div>
                        </div>
                      )}
                      <span className="float-right ml-2 mt-1 flex items-center gap-0.5 opacity-0 pointer-events-none select-none text-[11px]" aria-hidden>
                        {formatMessageTime(msg.createdAt)}{isMine && <CheckCheck size={12} />}
                      </span>
                      <p className="break-words whitespace-pre-wrap text-[14.2px] text-slate-100 leading-[1.4]">{msg.text}</p>
                      <div className="flex items-center gap-0.5 justify-end -mt-0.5">
                        <span className="text-[11px] text-slate-400 leading-none">{formatMessageTime(msg.createdAt)}</span>
                        {isMine && (msg.readAt ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} className="text-slate-500" />)}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className={`absolute -top-2 ${isMine ? "left-0 -translate-x-full" : "right-0 translate-x-full"} opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-0.5`}>
                      <button onClick={() => setReplyTo(msg)} className="w-6 h-6 bg-slate-700 border border-white/10 rounded-full shadow flex items-center justify-center hover:bg-slate-600" title="Reply">
                        <Reply size={11} className="text-slate-300" />
                      </button>
                      <button onClick={() => setEmojiPickerMsgID(emojiPickerMsgID === msg.id ? null : msg.id)} className="w-6 h-6 bg-slate-700 border border-white/10 rounded-full shadow flex items-center justify-center text-xs hover:bg-slate-600" title="React">😊</button>
                      {isMine && (
                        <button onClick={() => { if (confirm("Delete this message?")) deleteMsg.mutate({ messageID: msg.id, workerID }); }}
                          className="w-6 h-6 bg-slate-700 border border-white/10 rounded-full shadow flex items-center justify-center hover:bg-red-900/50" title="Delete">
                          <Trash2 size={11} className="text-red-400" />
                        </button>
                      )}
                    </div>
                    {emojiPickerMsgID === msg.id && (
                      <EmojiPicker onSelect={(emoji) => toggleReaction.mutate({ messageType: "dm", messageID: msg.id, workerID, emoji })} onClose={() => setEmojiPickerMsgID(null)} />
                    )}
                    <ReactionBar reactions={msgReactions} workerID={workerID} onToggle={(emoji) => toggleReaction.mutate({ messageType: "dm", messageID: msg.id, workerID, emoji })} />
                    {msg.attachment && msg.attachment.id > 0 && <MessageAttachmentCard attachment={msg.attachment} workerID={workerID} />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-20 right-4 w-10 h-10 bg-slate-700 border border-white/10 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-600 transition-colors z-10">
          <ArrowDown size={18} className="text-slate-300" />
        </button>
      )}

      {replyTo && <ReplyPreview text={replyTo.text} senderName={replyTo.senderID === workerID ? "You" : otherName} onCancel={() => setReplyTo(null)} />}

      {/* Input */}
      <div className="chat-composer px-3 py-2.5 flex flex-col flex-shrink-0 border-t border-white/10">
        <AttachmentPicker attachment={attachment.pending} isUploading={attachment.isUploading} uploadProgress={attachment.uploadProgress} onSelect={attachment.selectFile} onRemove={attachment.clear} />
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/[0.07] border border-white/10 rounded-3xl px-4 py-2.5 shadow-inner focus-within:border-indigo-400/60 focus-within:bg-white/[0.12] transition-all">
            <AutoResizeInput inputRef={inputRef} value={text} onChange={setText} onKeyDown={handleKey} placeholder="Type a message" maxLength={2000} />
          </div>
          <button onClick={handleSend} disabled={(!text.trim() && !attachment.pending) || attachment.isUploading || sendMsg.isPending}
            className="chat-send-button w-11 h-11 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white hover:brightness-110 transition-all disabled:opacity-30 flex-shrink-0 self-end">
            {attachment.isUploading || sendMsg.isPending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Thread ─────────────────────────────────────────────────────────────
function GroupThread({ group, workerID, workerName, deviceToken, onBack, onLeave }: {
  group: Group; workerID: string; workerName: string; deviceToken?: string; onBack?: () => void; onLeave: () => void;
}) {
  const [text, setText] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [emojiPickerMsgID, setEmojiPickerMsgID] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const attachment = useMessageAttachment(workerID, deviceToken);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();
  const playSound = useMessageSound();
  const prevMsgCountRef = useRef(0);

  const { data: messages = [] } = trpc.groupChat.getMessages.useQuery({ groupID: group.id }, { refetchInterval: 2000 });
  const { data: members = [] } = trpc.groupChat.getMembers.useQuery({ groupID: group.id }, { refetchOnWindowFocus: false });
  const msgIDs = (messages as GroupMessage[]).map(m => m.id);
  const { data: reactions = [] } = trpc.reactions.getForMessages.useQuery(
    { messageType: "group", messageIDs: msgIDs }, { enabled: msgIDs.length > 0, refetchInterval: 3000 }
  );
  const memberIDs = useMemo(() => (members as GroupMember[]).map(m => m.workerID), [members]);
  const { data: onlineStatus = {} } = trpc.chat.getOnlineStatus.useQuery(
    { workerIDs: memberIDs }, { enabled: memberIDs.length > 0, refetchInterval: 15000 }
  );
  const { data: searchResults = [] } = trpc.groupChat.searchMessages.useQuery(
    { groupID: group.id, query: searchQuery }, { enabled: searchQuery.length >= 2 }
  );
  const toggleReaction = trpc.reactions.toggle.useMutation({
    onSettled: () => utils.reactions.getForMessages.invalidate({ messageType: "group", messageIDs: msgIDs }),
  });
  const sendMsg = trpc.groupChat.sendMessageWithReply.useMutation({
    onMutate: async (vars) => {
      await utils.groupChat.getMessages.cancel({ groupID: group.id });
      const prev = utils.groupChat.getMessages.getData({ groupID: group.id });
      utils.groupChat.getMessages.setData({ groupID: group.id }, (old) => [
        ...(old || []),
        { id: Date.now(), groupID: group.id, senderID: vars.senderID, senderName: vars.senderName, text: vars.text, replyToID: vars.replyToID || null, deletedAt: null, createdAt: new Date(), attachment: vars.attachment ? { id: 0, messageType: "group", messageID: 0, ...vars.attachment, uploadedBy: vars.senderID, createdAt: new Date() } : null },
      ]);
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev) utils.groupChat.getMessages.setData({ groupID: group.id }, ctx.prev as any);
    },
    onSettled: () => {
      utils.groupChat.getMessages.invalidate({ groupID: group.id });
      utils.groupChat.getGroups.invalidate({ workerID });
    },
  });
  const deleteMsg = trpc.groupChat.deleteMessage.useMutation({
    onSuccess: () => { utils.groupChat.getMessages.invalidate({ groupID: group.id }); toast.success("Message deleted"); },
    onError: () => toast.error("Failed to delete message"),
  });
  const leaveGroup = trpc.groupChat.leave.useMutation({
    onSuccess: () => { utils.groupChat.getGroups.invalidate({ workerID }); toast.success("Left group"); onLeave(); },
    onError: () => toast.error("Failed to leave group"),
  });

  useEffect(() => {
    const currentCount = (messages as GroupMessage[]).length;
    if (prevMsgCountRef.current > 0 && currentCount > prevMsgCountRef.current) {
      const lastMsg = (messages as GroupMessage[])[currentCount - 1];
      if (lastMsg && lastMsg.senderID !== workerID) playSound();
    }
    prevMsgCountRef.current = currentCount;
  }, [messages]);
  useEffect(() => { if (!showScrollBtn) bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); setReplyTo(null); setText(""); attachment.clear(); }, [group.id]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };
  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !attachment.pending) return;
    try {
      const uploadedAttachment = await attachment.upload();
      sendMsg.mutate({ groupID: group.id, senderID: workerID, senderName: workerName, text: trimmed, replyToID: replyTo?.id, attachment: uploadedAttachment });
      setText(""); setReplyTo(null); attachment.clear(); inputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload this attachment.");
    }
  }
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const activeMessages = (messages as GroupMessage[]).filter(m => !m.deletedAt);
  const grouped: { date: string; msgs: GroupMessage[] }[] = [];
  activeMessages.forEach((msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== dateKey) grouped.push({ date: dateKey, msgs: [msg] });
    else last.msgs.push(msg);
  });
  const onlineCount = Object.values(onlineStatus as Record<string, { online: boolean }>).filter(s => s.online).length;

  return (
    <div className="chat-thread flex flex-col h-full">
      {/* Header */}
      <div className="chat-thread-header px-4 py-3.5 flex items-center gap-3 flex-shrink-0 border-b border-white/10">
        {onBack && (
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
            <ArrowLeft size={16} className="text-slate-300" />
          </button>
        )}
        <button onClick={() => setShowMembers(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <Avatar name={group.name} isGroup />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm truncate">{group.name}</div>
            <div className="text-xs text-slate-400 truncate">{group.memberCount} members · <span className="text-emerald-400">{onlineCount} online</span></div>
          </div>
        </button>
        <button onClick={() => setShowSearch(!showSearch)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300">
          <Search size={16} />
        </button>
        <button onClick={() => { if (confirm(`Leave group "${group.name}"?`)) leaveGroup.mutate({ groupID: group.id, workerID }); }}
          className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-slate-400 hover:text-red-400" title="Leave group">
          <LogOut size={16} />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2"
          style={{ background: "rgba(15,23,42,.85)", backdropFilter: "blur(12px)" }}>
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in group..."
            className="flex-1 text-sm outline-none text-white bg-transparent placeholder:text-slate-500" autoFocus />
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={14} className="text-slate-400" /></button>
          {searchQuery.length >= 2 && <span className="text-xs text-slate-500">{(searchResults as any[]).length} results</span>}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="chat-message-canvas flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Users size={36} className="opacity-40" />
            </div>
            <p className="text-sm font-medium text-slate-400">No messages yet</p>
            <p className="text-xs mt-1 text-slate-500">Start the conversation!</p>
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <span className="bg-white/10 backdrop-blur-sm text-slate-400 text-xs px-3 py-1 rounded-full border border-white/10 font-medium">{formatDateSeparator(new Date(date))}</span>
            </div>
            {msgs.map((msg: GroupMessage, i: number) => {
              const isMine = msg.senderID === workerID;
              const prevMsg = i > 0 ? msgs[i - 1] : null;
              const nextMsg = i < msgs.length - 1 ? msgs[i + 1] : null;
              const showSenderName = !isMine && (!prevMsg || prevMsg.senderID !== msg.senderID);
              const isLast = !nextMsg || nextMsg.senderID !== msg.senderID;
              const msgReactions = (reactions as Reaction[]).filter(r => r.messageID === msg.id);
              const radius = isMine ? `rounded-[18px] ${isLast ? "rounded-br-[4px]" : ""}` : `rounded-[18px] ${isLast ? "rounded-bl-[4px]" : ""}`;
              const replyMsg = msg.replyToID ? activeMessages.find(m => m.id === msg.replyToID) : null;
              const bubbleBg = isMine
                ? "bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-900/40"
                : msg.senderID === SYSTEM_MAINTENANCE_SENDER_ID
                  ? "bg-blue-900/40 border border-blue-500/20"
                  : "bg-white/10 border border-white/10 backdrop-blur-sm";
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isLast ? "mb-1" : "mb-0.5"} chat-bubble`}>
                  {!isMine ? (
                    <div className="w-8 mr-1 flex-shrink-0 self-end">
                      {isLast && (
                        msg.senderID === SYSTEM_MAINTENANCE_SENDER_ID
                          ? <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><BadgeCheck size={14} className="text-white" /></div>
                          : <Avatar name={msg.senderName || "?"} size="sm" />
                      )}
                    </div>
                  ) : null}
                  <div className="relative group max-w-[75%] md:max-w-[65%]">
                    <div className={`px-3 py-[6px] shadow-md text-sm ${radius} ${bubbleBg}`}>
                      {showSenderName && (
                        msg.senderID === SYSTEM_MAINTENANCE_SENDER_ID
                          ? <div className="flex items-center gap-1 mb-0.5"><span className="text-xs font-bold text-blue-400">{msg.senderName}</span><BadgeCheck size={11} className="text-blue-400" /></div>
                          : <div className="text-xs font-semibold text-teal-300 mb-0.5">{msg.senderName}</div>
                      )}
                      {replyMsg && (
                        <div className="mb-1 pl-2 border-l-2 border-teal-400/60 bg-white/5 rounded-r-lg px-2 py-1">
                          <div className="text-[10px] font-semibold text-teal-300">{replyMsg.senderID === workerID ? "You" : replyMsg.senderName}</div>
                          <div className="text-[11px] text-slate-400 truncate">{replyMsg.text}</div>
                        </div>
                      )}
                      <span className="float-right ml-2 mt-1 flex items-center gap-0.5 opacity-0 pointer-events-none select-none text-[11px]" aria-hidden>
                        {formatMessageTime(msg.createdAt)}
                      </span>
                      <p className="break-words whitespace-pre-wrap text-[14.2px] text-slate-100 leading-[1.4]">{msg.text}</p>
                      <div className="flex items-center gap-0.5 justify-end -mt-0.5">
                        <span className="text-[11px] text-slate-400 leading-none">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className={`absolute -top-2 ${isMine ? "left-0 -translate-x-full" : "right-0 translate-x-full"} opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-0.5`}>
                      <button onClick={() => setReplyTo(msg)} className="w-6 h-6 bg-slate-700 border border-white/10 rounded-full shadow flex items-center justify-center hover:bg-slate-600" title="Reply">
                        <Reply size={11} className="text-slate-300" />
                      </button>
                      <button onClick={() => setEmojiPickerMsgID(emojiPickerMsgID === msg.id ? null : msg.id)} className="w-6 h-6 bg-slate-700 border border-white/10 rounded-full shadow flex items-center justify-center text-xs hover:bg-slate-600" title="React">😊</button>
                      {isMine && (
                        <button onClick={() => { if (confirm("Delete this message?")) deleteMsg.mutate({ messageID: msg.id, workerID }); }}
                          className="w-6 h-6 bg-slate-700 border border-white/10 rounded-full shadow flex items-center justify-center hover:bg-red-900/50" title="Delete">
                          <Trash2 size={11} className="text-red-400" />
                        </button>
                      )}
                    </div>
                    {emojiPickerMsgID === msg.id && (
                      <EmojiPicker onSelect={(emoji) => toggleReaction.mutate({ messageType: "group", messageID: msg.id, workerID, emoji })} onClose={() => setEmojiPickerMsgID(null)} />
                    )}
                    <ReactionBar reactions={msgReactions} workerID={workerID} onToggle={(emoji) => toggleReaction.mutate({ messageType: "group", messageID: msg.id, workerID, emoji })} />
                    {msg.attachment && msg.attachment.id > 0 && <MessageAttachmentCard attachment={msg.attachment} workerID={workerID} />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-20 right-4 w-10 h-10 bg-slate-700 border border-white/10 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-600 transition-colors z-10">
          <ArrowDown size={18} className="text-slate-300" />
        </button>
      )}

      {replyTo && <ReplyPreview text={replyTo.text} senderName={replyTo.senderID === workerID ? "You" : replyTo.senderName} onCancel={() => setReplyTo(null)} />}

      {/* Input */}
      <div className="chat-composer px-3 py-2.5 flex flex-col flex-shrink-0 border-t border-white/10">
        <AttachmentPicker attachment={attachment.pending} isUploading={attachment.isUploading} uploadProgress={attachment.uploadProgress} onSelect={attachment.selectFile} onRemove={attachment.clear} accent="teal" />
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/[0.07] border border-white/10 rounded-3xl px-4 py-2.5 shadow-inner focus-within:border-teal-400/60 focus-within:bg-white/[0.12] transition-all">
            <AutoResizeInput inputRef={inputRef} value={text} onChange={setText} onKeyDown={handleKey} placeholder="Type a message" maxLength={2000} />
          </div>
          <button onClick={handleSend} disabled={(!text.trim() && !attachment.pending) || attachment.isUploading || sendMsg.isPending}
            className="chat-group-send-button w-11 h-11 bg-gradient-to-br from-teal-500 via-emerald-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white hover:brightness-110 transition-all disabled:opacity-30 flex-shrink-0 self-end">
            {attachment.isUploading || sendMsg.isPending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </div>
      </div>

      {/* Members modal */}
      {showMembers && (
        <GlassModal onClose={() => setShowMembers(false)}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <Users size={15} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{group.name}</h3>
                <p className="text-xs text-slate-400">{group.memberCount} members · <span className="text-emerald-400">{onlineCount} online</span></p>
              </div>
            </div>
            <button onClick={() => setShowMembers(false)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X size={14} className="text-slate-300" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(members as GroupMember[]).map((m: GroupMember) => {
              const memberOnline = (onlineStatus as Record<string, { online: boolean }>)[m.workerID]?.online;
              return (
                <div key={m.workerID} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <Avatar name={m.worker?.name || m.workerID} online={memberOnline} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{m.worker?.name || m.workerID}</div>
                    <div className="text-xs text-slate-400 truncate">{m.worker?.department}</div>
                  </div>
                  {m.workerID === group.createdBy && (
                    <span className="flex items-center gap-1 text-xs text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full">
                      <Crown size={10} /> Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </GlassModal>
      )}
    </div>
  );
}

// ─── Unified Sidebar List ─────────────────────────────────────────────────────
type ActiveTab = "messages" | "groups";
type SelectedItem = { type: "dm"; conv: Conversation } | { type: "group"; group: Group } | null;

function SidebarList({ workerID, tab, setTab, selected, onSelectDM, onSelectGroup, onNewMessage, onNewGroup }: {
  workerID: string; tab: ActiveTab; setTab: (t: ActiveTab) => void; selected: SelectedItem;
  onSelectDM: (conv: Conversation) => void; onSelectGroup: (group: Group) => void;
  onNewMessage: () => void; onNewGroup: () => void;
}) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: convs = [] } = trpc.chat.getConversations.useQuery({ workerID }, { refetchInterval: 3000 });
  const { data: groups = [] } = trpc.groupChat.getGroups.useQuery({ workerID }, { refetchInterval: 3000 });
  const convWorkerIDs = useMemo(() => (convs as Conversation[]).map(c => c.otherWorker?.workerID).filter(Boolean) as string[], [convs]);
  const { data: onlineStatus = {} } = trpc.chat.getOnlineStatus.useQuery(
    { workerIDs: convWorkerIDs }, { enabled: convWorkerIDs.length > 0, refetchInterval: 15000 }
  );
  const filteredConvs = (convs as Conversation[]).filter((c: Conversation) => {
    const isSystemConv = c.worker1ID === SYSTEM_MAINTENANCE_SENDER_ID || c.worker2ID === SYSTEM_MAINTENANCE_SENDER_ID;
    if (isSystemConv) return "scheduled maintenance".includes(search.toLowerCase()) || search === "";
    return c.otherWorker?.name.toLowerCase().includes(search.toLowerCase()) ||
      c.otherWorker?.workerID.toLowerCase().includes(search.toLowerCase());
  });
  const filteredGroups = (groups as Group[]).filter((g: Group) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="chat-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="chat-sidebar-head px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <MessageCircle size={14} className="text-white" />
            </div>
            <div>
              <span className="block font-bold text-white text-sm">Messages</span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-200/80"><Wifi size={9} className="text-emerald-300" /> Team inbox</span>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowDropdown(v => !v)}
              className="w-8 h-8 rounded-xl bg-indigo-500/25 border border-indigo-300/25 hover:bg-indigo-500/40 flex items-center justify-center transition-colors shadow-lg shadow-indigo-950/30" title="New">
              <Plus size={14} className="text-indigo-300" />
            </button>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl border border-white/10 overflow-hidden min-w-[160px]"
                  style={{ background: "rgba(15,23,42,.97)", backdropFilter: "blur(16px)" }}>
                  <button onClick={() => { setShowDropdown(false); onNewMessage(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left text-white text-sm">
                    <MessageCircle size={15} className="text-indigo-400" /> New Message
                  </button>
                  <button onClick={() => { setShowDropdown(false); onNewGroup(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left text-white text-sm border-t border-white/5">
                    <Users size={15} className="text-teal-400" /> New Group
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-950/25 border border-white/10 rounded-xl p-1 shadow-inner">
          <button onClick={() => setTab("messages")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === "messages" ? "bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 shadow-sm" : "text-slate-400 hover:text-slate-300"}`}>
            Messages
          </button>
          <button onClick={() => setTab("groups")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === "groups" ? "bg-teal-500/30 text-teal-200 border border-teal-500/30 shadow-sm" : "text-slate-400 hover:text-slate-300"}`}>
            Groups
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/10 flex-shrink-0"
        style={{ background: "rgba(15,23,42,.8)" }}>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === "messages" ? "Search conversations" : "Search groups"}
            className="w-full pl-8 pr-3 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none shadow-inner focus:border-indigo-400/50 focus:bg-white/[0.1] transition-all" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {tab === "messages" ? (
          filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <MessageSquareDot size={28} className="opacity-40" />
              </div>
              <p className="text-sm font-medium text-slate-400">No conversations yet</p>
              <p className="text-xs mt-1 text-slate-500">Tap + to start a new message</p>
            </div>
          ) : filteredConvs.map((conv: Conversation) => {
            const isSystemConv = conv.worker1ID === SYSTEM_MAINTENANCE_SENDER_ID || conv.worker2ID === SYSTEM_MAINTENANCE_SENDER_ID;
            const name = isSystemConv ? "Scheduled Maintenance" : (conv.otherWorker?.name || "Unknown");
            const isSelected = selected?.type === "dm" && selected.conv.id === conv.id;
            const hasUnread = conv.unreadCount > 0;
            const partnerOnline = (onlineStatus as Record<string, { online: boolean }>)[conv.otherWorker?.workerID || ""]?.online;
            return (
              <button key={conv.id} onClick={() => onSelectDM(conv)}
                className={`chat-list-item w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 hover:bg-white/[0.07] transition-colors text-left ${isSelected ? "bg-indigo-500/15 border-l-2 border-l-indigo-400" : ""}`}>
                {isSystemConv
                  ? <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm"><BadgeCheck size={18} className="text-white" /></div>
                  : <Avatar name={name} online={partnerOnline} />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${hasUnread ? "font-semibold text-white" : "font-medium text-slate-300"}`}>{name}</span>
                    <span className={`text-[11px] flex-shrink-0 ml-2 ${hasUnread ? "text-indigo-300 font-semibold" : "text-slate-500"}`}>
                      {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-xs truncate ${hasUnread ? "text-slate-300" : "text-slate-500"}`}>
                      {conv.lastMessage ? (conv.lastMessage.text ? (conv.lastMessage.senderID === workerID ? `You: ${conv.lastMessage.text}` : conv.lastMessage.text) : "📎 Attachment") : "No messages yet"}
                    </span>
                    {hasUnread && (
                      <span className="ml-2 bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0 shadow-sm">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <Users size={28} className="opacity-40" />
              </div>
              <p className="text-sm font-medium text-slate-400">No group chats yet</p>
              <p className="text-xs mt-1 text-slate-500">Tap + to create a new group</p>
            </div>
          ) : filteredGroups.map((group: Group) => {
            const isSelected = selected?.type === "group" && selected.group.id === group.id;
            return (
              <button key={group.id} onClick={() => onSelectGroup(group)}
                className={`chat-list-item w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 hover:bg-white/[0.07] transition-colors text-left ${isSelected ? "bg-teal-500/15 border-l-2 border-l-teal-400" : ""}`}>
                <Avatar name={group.name} isGroup />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300 truncate">{group.name}</span>
                    <span className="text-[11px] text-slate-500 flex-shrink-0 ml-2">
                      {group.lastMessage ? formatTime(group.lastMessage.createdAt) : formatTime(group.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-slate-500 truncate">
                      {group.lastMessage ? (group.lastMessage.text ? `${group.lastMessage.senderName}: ${group.lastMessage.text}` : `${group.lastMessage.senderName}: 📎 Attachment`) : `${group.memberCount} members`}
                    </span>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2 flex items-center gap-1">
                      <Users size={10} /> {group.memberCount}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────
export default function Chat() {
  const { worker } = useAuth();
  const [location, navigate] = useLocation();
  const [tab, setTab] = useState<ActiveTab>("messages");
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const utils = trpc.useUtils();

  const workerID = worker?.workerID || "";
  const workerName = worker?.name || "";
  const deviceToken = worker?.deviceToken;

  useHeartbeat(workerID);

  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const deepLinkWith = searchParams.get("with");

  const getOrCreate = trpc.chat.getOrCreate.useMutation({
    onSuccess: (conv) => {
      if (conv) {
        utils.chat.getConversations.invalidate({ workerID });
        setTab("messages");
        setSelected({ type: "dm", conv: conv as unknown as Conversation });
        setMobileView("thread");
      }
    },
    onError: () => toast.error("Could not open conversation"),
  });

  useEffect(() => {
    if (!deepLinkWith || !workerID) return;
    getOrCreate.mutate({ workerID, otherWorkerID: deepLinkWith });
    navigate("/chat", { replace: true });
  }, [deepLinkWith, workerID]);

  function handleSelectDM(conv: Conversation) { setSelected({ type: "dm", conv }); setMobileView("thread"); }
  function handleSelectGroup(group: Group) { setSelected({ type: "group", group }); setMobileView("thread"); }
  function handleNewWorker(w: Worker) { setShowNewMessage(false); if (!workerID) return; getOrCreate.mutate({ workerID, otherWorkerID: w.workerID }); }
  function handleGroupCreated(group: Group) { setShowNewGroup(false); setTab("groups"); setSelected({ type: "group", group }); setMobileView("thread"); }
  function handleLeaveGroup() { setSelected(null); setMobileView("list"); }

  if (!workerID) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: threadBg }}>
        <div className="text-center">
          <UserCircle2 size={48} className="mx-auto mb-2 text-slate-500 opacity-50" />
          <p className="text-slate-400">Please log in to use Messages</p>
        </div>
      </div>
    );
  }

  const sidebarProps = {
    workerID, tab, setTab, selected,
    onSelectDM: handleSelectDM, onSelectGroup: handleSelectGroup,
    onNewMessage: () => setShowNewMessage(true), onNewGroup: () => setShowNewGroup(true),
  };

  const threadPanel = selected === null ? (
    <div className="flex flex-col items-center justify-center h-full" style={{ background: threadBg }}>
      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-64 h-64 rounded-full opacity-5 chat-float" style={{ background: "radial-gradient(circle,#6366f1,transparent)", top: "10%", left: "20%" }} />
        <div className="absolute w-48 h-48 rounded-full opacity-5 chat-float" style={{ background: "radial-gradient(circle,#14b8a6,transparent)", bottom: "20%", right: "15%", animationDelay: "3s" }} />
      </div>
      <div className="relative z-10 text-center">
        <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-indigo-500/20 via-blue-500/10 to-cyan-400/10 border border-indigo-300/20 flex items-center justify-center mb-5 mx-auto shadow-xl shadow-indigo-950/30">
          <MessageCircle size={40} className="text-indigo-400 opacity-70" />
        </div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">
          <ShieldCheck size={12} /> Connected workspace
        </div>
        <p className="text-lg font-bold text-white mb-1">PP4 Messages</p>
        <p className="text-sm text-slate-400 mb-5">Select a conversation or start a new one</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => setShowNewMessage(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity">
            <MessageCircle size={15} /> New Message
          </button>
          <button onClick={() => setShowNewGroup(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity">
            <Users size={15} /> New Group
          </button>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500"><Sparkles size={12} className="text-indigo-400" /> Keep stock conversations in one focused place</p>
      </div>
    </div>
  ) : selected.type === "dm" ? (
    <DMThread conv={selected.conv} workerID={workerID} workerName={workerName} deviceToken={deviceToken} />
  ) : (
    <GroupThread group={selected.group} workerID={workerID} workerName={workerName} deviceToken={deviceToken} onLeave={handleLeaveGroup} />
  );

  const mobileHeaderActions = (
    <div className="relative">
      <button onClick={() => setShowMobileDropdown(v => !v)}
        className="p-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-300 transition-colors" title="New">
        <Plus size={14} />
      </button>
      {showMobileDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMobileDropdown(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl border border-white/10 overflow-hidden min-w-[160px]"
            style={{ background: "rgba(15,23,42,.97)", backdropFilter: "blur(16px)" }}>
            <button onClick={() => { setShowMobileDropdown(false); setShowNewMessage(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left text-white text-sm">
              <MessageCircle size={16} className="text-indigo-400" /> New Message
            </button>
            <button onClick={() => { setShowMobileDropdown(false); setShowNewGroup(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left text-white text-sm border-t border-white/5">
              <Users size={16} className="text-teal-400" /> New Group
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <AppLayout pageTitle="Messages" headerActions={mobileHeaderActions} fullHeight>
      <style>{chatStyles}</style>
      <div className="chat-shell h-full flex overflow-hidden p-2 md:p-3">
        {/* Desktop/Tablet: Side-by-side */}
        <div className="hidden md:flex w-full h-full overflow-hidden rounded-[28px] border border-white/10 shadow-2xl shadow-slate-950/40">
          <div className="w-[340px] lg:w-[380px] xl:w-[420px] flex-shrink-0 border-r border-white/10 h-full overflow-hidden">
            <SidebarList {...sidebarProps} />
          </div>
          <div className="flex-1 h-full overflow-hidden relative">
            {threadPanel}
          </div>
        </div>

        {/* Mobile: Single panel */}
        <div className="chat-mobile-panel flex md:hidden w-full h-full flex-col overflow-hidden">
          {mobileView === "list" ? (
            <SidebarList {...sidebarProps} />
          ) : selected?.type === "dm" ? (
            <DMThread conv={selected.conv} workerID={workerID} workerName={workerName} deviceToken={deviceToken} onBack={() => setMobileView("list")} />
          ) : selected?.type === "group" ? (
            <GroupThread group={selected.group} workerID={workerID} workerName={workerName} deviceToken={deviceToken}
              onBack={() => setMobileView("list")} onLeave={handleLeaveGroup} />
          ) : null}
        </div>

        {showNewMessage && <NewMessageModal workerID={workerID} onClose={() => setShowNewMessage(false)} onSelect={handleNewWorker} />}
        {showNewGroup && <NewGroupModal workerID={workerID} onClose={() => setShowNewGroup(false)} onCreate={handleGroupCreated} />}
      </div>
    </AppLayout>
  );
}
