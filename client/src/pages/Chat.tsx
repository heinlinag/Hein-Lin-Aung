/**
 * Chat — Next Level Messaging Hub
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
  Users, LogOut, Crown, ChevronDown, Reply, Trash2, ArrowDown, BadgeCheck, Bell,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SYSTEM_MAINTENANCE_SENDER_ID = "SYSTEM_MAINTENANCE";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reaction { id: number; messageType: "dm" | "group"; messageID: number; workerID: string; emoji: string; createdAt: Date; }
interface Worker { id: number; workerID: string; name: string; department: string; userLevel: string; lastSeenAt?: Date | null; }
interface ConvMessage { id: number; conversationID: number; senderID: string; text: string; replyToID: number | null; deletedAt: Date | null; createdAt: Date; readAt: Date | null; }
interface Conversation { id: number; worker1ID: string; worker2ID: string; lastMessageAt: Date; createdAt: Date; otherWorker: Worker | null; lastMessage: ConvMessage | null; unreadCount: number; }
interface GroupMessage { id: number; groupID: number; senderID: string; senderName: string; text: string; replyToID: number | null; deletedAt: Date | null; createdAt: Date; }
interface Group { id: number; name: string; createdBy: string; lastMessageAt: Date; createdAt: Date; memberCount: number; memberIDs: string[]; lastMessage: GroupMessage | null; }
interface GroupMember { id: number; groupID: number; workerID: string; joinedAt: Date; worker: Worker | null; }

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
  if (level === "1") return "bg-orange-100 text-orange-700";
  if (level === "1.1") return "bg-purple-100 text-purple-700";
  return "bg-green-100 text-green-700";
}

// ─── Avatar with Online Indicator ────────────────────────────────────────────
function Avatar({ name, size = "md", isGroup = false, online }: { name: string; size?: "sm" | "md" | "lg"; isGroup?: boolean; online?: boolean }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500"];
  const color = isGroup ? "bg-[#128c7e]" : colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold`}>
        {isGroup ? <Users size={size === "sm" ? 14 : size === "lg" ? 20 : 16} /> : getInitials(name)}
      </div>
      {online !== undefined && !isGroup && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-300"}`} />
      )}
    </div>
  );
}

// ─── Auto-Resize Textarea ────────────────────────────────────────────────────
function AutoResizeInput({ value, onChange, onKeyDown, placeholder, maxLength, inputRef }: {
  value: string; onChange: (v: string) => void; onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string; maxLength: number; inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };
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
      className="w-full bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400 resize-none overflow-hidden leading-[1.4]"
      style={{ minHeight: "20px", maxHeight: "120px" }}
    />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">New Message</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>
        <div className="p-3 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search workers..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm outline-none placeholder:text-gray-400" autoFocus />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No workers found</div>
          ) : filtered.map((w: Worker) => {
            const status = (onlineStatus as Record<string, { online: boolean }>)[w.workerID];
            return (
              <button key={w.workerID} onClick={() => onSelect(w)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                <Avatar name={w.name} size="md" online={status?.online} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{w.name}</div>
                  <div className="text-xs text-gray-500 truncate">{w.workerID} · {w.department}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor(w.userLevel)}`}>L{w.userLevel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="font-semibold text-gray-900">New Group</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>
        <div className="p-3 border-b flex-shrink-0 space-y-2">
          <input placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none placeholder:text-gray-400" autoFocus />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm outline-none placeholder:text-gray-400" />
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.map(id => {
                const w = (workers as Worker[]).find(w => w.workerID === id);
                return (
                  <span key={id} className="flex items-center gap-1 bg-[#e7ffdb] text-[#075e54] text-xs px-2 py-1 rounded-full">
                    {w?.name || id}
                    <button onClick={() => setSelected(s => s.filter(x => x !== id))} className="hover:text-red-500"><X size={10} /></button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((w: Worker) => {
            const isSelected = selected.includes(w.workerID);
            return (
              <button key={w.workerID} onClick={() => setSelected(s => isSelected ? s.filter(x => x !== w.workerID) : s.length < 9 ? [...s, w.workerID] : s)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${isSelected ? "bg-green-50" : ""}`}>
                <Avatar name={w.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{w.name}</div>
                  <div className="text-xs text-gray-500 truncate">{w.workerID} · {w.department}</div>
                </div>
                {isSelected && <Check size={16} className="text-green-600" />}
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t flex-shrink-0">
          <Button onClick={handleCreate} disabled={!groupName.trim() || selected.length === 0 || createGroup.isPending}
            className="w-full bg-[#075e54] hover:bg-[#128c7e] text-white rounded-full">
            {createGroup.isPending ? "Creating..." : `Create Group (${selected.length + 1} members)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Emoji Picker ────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-1 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 px-2 py-1.5 flex gap-1">
        {QUICK_EMOJIS.map(e => (
          <button key={e} onClick={() => { onSelect(e); onClose(); }}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors">{e}</button>
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
            ${mine ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
          <span>{emoji}</span><span className="font-medium">{count}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Reply Preview Bar ───────────────────────────────────────────────────────
function ReplyPreview({ text, senderName, onCancel }: { text: string; senderName: string; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-t border-gray-100">
      <div className="w-1 h-8 bg-[#075e54] rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[#075e54]">{senderName}</div>
        <div className="text-xs text-gray-500 truncate">{text}</div>
      </div>
      <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full"><X size={14} className="text-gray-400" /></button>
    </div>
  );
}

// ─── Send Alert Button (Worker → Worker) ────────────────────────────────────────────────────────────────────────────
function SendAlertButton({ senderID, senderName, recipientID, recipientName }: {
  senderID: string;
  senderName: string;
  recipientID: string;
  recipientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const sendAlert = trpc.notifications.sendAlert.useMutation({
    onSuccess: () => {
      toast.success(`Alert sent to ${recipientName}!`);
      setTitle(""); setMessage(""); setOpen(false);
    },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Bell size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Send Alert</h3>
                  <p className="text-xs text-gray-500">To: {recipientName}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Alert Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Urgent, Please check stock"
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your alert message..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={sendAlert.isPending || !title.trim() || !message.trim()}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold disabled:opacity-50">
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

// ─── DM Thread ────────────────────────────────────────────────────────────────────────────
function DMThread({ conv, workerID, workerName, onBack }: { conv: Conversation; workerID: string; workerName: string; onBack?: () => void }) {
  const [text, setText] = useState("");
  const [emojiPickerMsgID, setEmojiPickerMsgID] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<ConvMessage | null>(null);
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

  // Online status
  const otherWorkerID = conv.otherWorker?.workerID || "";
  const { data: onlineStatus = {} } = trpc.chat.getOnlineStatus.useQuery(
    { workerIDs: otherWorkerID ? [otherWorkerID] : [] }, { enabled: !!otherWorkerID, refetchInterval: 15000 }
  );
  const otherOnline = (onlineStatus as Record<string, { online: boolean; lastSeenAt: Date | null }>)[otherWorkerID];

  // Search
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
        { id: Date.now(), conversationID: conv.id, senderID: vars.senderID, text: vars.text, replyToID: vars.replyToID || null, deletedAt: null, createdAt: new Date(), readAt: null },
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

  // Sound on new incoming message
  useEffect(() => {
    const currentCount = (messages as ConvMessage[]).length;
    if (prevMsgCountRef.current > 0 && currentCount > prevMsgCountRef.current) {
      const lastMsg = (messages as ConvMessage[])[currentCount - 1];
      if (lastMsg && lastMsg.senderID !== workerID) playSound();
    }
    prevMsgCountRef.current = currentCount;
  }, [messages]);

  // Scroll handling
  useEffect(() => {
    if (!showScrollBtn) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    markRead.mutate({ conversationID: conv.id, workerID });
    inputRef.current?.focus();
    setReplyTo(null);
    setText("");
  }, [conv.id]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMsg.mutate({ conversationID: conv.id, senderID: workerID, senderName: workerName, text: trimmed, replyToID: replyTo?.id });
    setText("");
    setReplyTo(null);
    inputRef.current?.focus();
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
    <div className="flex flex-col h-full bg-[#f0f2f5]">
      {/* Header */}
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 -ml-2 mr-1"><ArrowLeft size={20} /></Button>
        )}
        {isSystemMaintenance
          ? <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"><BadgeCheck size={20} className="text-white" /></div>
          : <Avatar name={otherName} online={otherOnline?.online} />}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate flex items-center gap-1">
            {otherName}
            {isSystemMaintenance && <BadgeCheck size={14} className="text-blue-300 flex-shrink-0" />}
          </div>
          <div className="text-xs text-green-200 truncate">
            {isSystemMaintenance ? "System" : (otherOnline?.online ? "online" : formatLastSeen(otherOnline?.lastSeenAt))}
          </div>
        </div>
        {!isSystemMaintenance && (
          <SendAlertButton
            senderID={workerID}
            senderName={conv.otherWorker?.name ? (conv.worker1ID === workerID ? conv.otherWorker.name : conv.otherWorker.name) : "Unknown"}
            recipientID={conv.worker1ID === workerID ? conv.worker2ID : conv.worker1ID}
            recipientName={otherName}
          />
        )}
        <button onClick={() => setShowSearch(!showSearch)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <Search size={16} />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="bg-white px-3 py-2 border-b border-gray-200 flex items-center gap-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in conversation..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400" autoFocus />
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="p-1 hover:bg-gray-100 rounded-full"><X size={14} /></button>
          {searchQuery.length >= 2 && <span className="text-xs text-gray-400">{(searchResults as any[]).length} results</span>}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center mb-4 shadow-sm">
              <MessageCircle size={36} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1 text-gray-400">Say hello to {otherName}!</p>
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <span className="bg-white/90 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm font-medium">{formatDateSeparator(new Date(date))}</span>
            </div>
            {msgs.map((msg: ConvMessage, i: number) => {
              const isMine = msg.senderID === workerID;
              const msgReactions = (reactions as Reaction[]).filter(r => r.messageID === msg.id);
              const nextMsg = i < msgs.length - 1 ? msgs[i + 1] : null;
              const isLast = !nextMsg || nextMsg.senderID !== msg.senderID;
              const radius = isMine ? `rounded-[18px] ${isLast ? "rounded-br-[4px]" : ""}` : `rounded-[18px] ${isLast ? "rounded-bl-[4px]" : ""}`;
              const replyMsg = msg.replyToID ? activeMessages.find(m => m.id === msg.replyToID) : null;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isLast ? "mb-1" : "mb-0.5"}`}>
                  {!isMine && <div className="w-8 mr-1 flex-shrink-0" />}
                  <div className="relative group max-w-[75%] md:max-w-[65%]">
                    <div className={`px-3 py-[6px] shadow-sm text-sm ${radius} ${isMine ? "bg-[#e7ffdb]" : msg.senderID === SYSTEM_MAINTENANCE_SENDER_ID ? "bg-blue-50 border border-blue-100" : "bg-white"}`}>
                      {/* Reply quote */}
                      {replyMsg && (
                        <div className="mb-1 pl-2 border-l-2 border-[#075e54] bg-black/5 rounded-r-lg px-2 py-1">
                          <div className="text-[10px] font-semibold text-[#075e54]">{replyMsg.senderID === workerID ? "You" : otherName}</div>
                          <div className="text-[11px] text-gray-600 truncate">{replyMsg.text}</div>
                        </div>
                      )}
                      <span className="float-right ml-2 mt-1 flex items-center gap-0.5 opacity-0 pointer-events-none select-none text-[11px]" aria-hidden>
                        {formatMessageTime(msg.createdAt)}{isMine && <CheckCheck size={12} />}
                      </span>
                      <p className="break-words whitespace-pre-wrap text-[14.2px] text-gray-900 leading-[1.4]">{msg.text}</p>
                      <div className="flex items-center gap-0.5 justify-end -mt-0.5">
                        <span className="text-[11px] text-gray-400 leading-none">{formatMessageTime(msg.createdAt)}</span>
                        {isMine && (msg.readAt ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} className="text-gray-400" />)}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className={`absolute -top-2 ${isMine ? "left-0 -translate-x-full" : "right-0 translate-x-full"} opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-0.5`}>
                      <button onClick={() => setReplyTo(msg)} className="w-6 h-6 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50" title="Reply">
                        <Reply size={11} className="text-gray-500" />
                      </button>
                      <button onClick={() => setEmojiPickerMsgID(emojiPickerMsgID === msg.id ? null : msg.id)} className="w-6 h-6 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50" title="React">😊</button>
                      {isMine && (
                        <button onClick={() => { if (confirm("Delete this message?")) deleteMsg.mutate({ messageID: msg.id, workerID }); }}
                          className="w-6 h-6 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center hover:bg-red-50" title="Delete">
                          <Trash2 size={11} className="text-red-400" />
                        </button>
                      )}
                    </div>
                    {emojiPickerMsgID === msg.id && (
                      <EmojiPicker onSelect={(emoji) => toggleReaction.mutate({ messageType: "dm", messageID: msg.id, workerID, emoji })} onClose={() => setEmojiPickerMsgID(null)} />
                    )}
                    <ReactionBar reactions={msgReactions} workerID={workerID} onToggle={(emoji) => toggleReaction.mutate({ messageType: "dm", messageID: msg.id, workerID, emoji })} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-20 right-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10">
          <ArrowDown size={18} className="text-gray-600" />
        </button>
      )}

      {/* Reply preview */}
      {replyTo && <ReplyPreview text={replyTo.text} senderName={replyTo.senderID === workerID ? "You" : otherName} onCancel={() => setReplyTo(null)} />}

      {/* Input */}
      <div className="bg-[#f0f2f5] px-3 py-2 flex items-end gap-2 flex-shrink-0 border-t border-gray-200">
        <div className="flex-1 bg-white rounded-3xl px-4 py-2.5 shadow-sm">
          <AutoResizeInput inputRef={inputRef} value={text} onChange={setText} onKeyDown={handleKey} placeholder="Type a message" maxLength={2000} />
        </div>
        <button onClick={handleSend} disabled={!text.trim()}
          className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#128c7e] transition-colors disabled:opacity-40 flex-shrink-0 self-end">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Group Thread ─────────────────────────────────────────────────────────────
function GroupThread({ group, workerID, workerName, onBack, onLeave }: {
  group: Group; workerID: string; workerName: string; onBack?: () => void; onLeave: () => void;
}) {
  const [text, setText] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [emojiPickerMsgID, setEmojiPickerMsgID] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
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

  // Online status for group members
  const memberIDs = useMemo(() => (members as GroupMember[]).map(m => m.workerID), [members]);
  const { data: onlineStatus = {} } = trpc.chat.getOnlineStatus.useQuery(
    { workerIDs: memberIDs }, { enabled: memberIDs.length > 0, refetchInterval: 15000 }
  );

  // Search
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
        { id: Date.now(), groupID: group.id, senderID: vars.senderID, senderName: vars.senderName, text: vars.text, replyToID: vars.replyToID || null, deletedAt: null, createdAt: new Date() },
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

  // Sound on new incoming message
  useEffect(() => {
    const currentCount = (messages as GroupMessage[]).length;
    if (prevMsgCountRef.current > 0 && currentCount > prevMsgCountRef.current) {
      const lastMsg = (messages as GroupMessage[])[currentCount - 1];
      if (lastMsg && lastMsg.senderID !== workerID) playSound();
    }
    prevMsgCountRef.current = currentCount;
  }, [messages]);

  useEffect(() => {
    if (!showScrollBtn) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => { inputRef.current?.focus(); setReplyTo(null); setText(""); }, [group.id]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMsg.mutate({ groupID: group.id, senderID: workerID, senderName: workerName, text: trimmed, replyToID: replyTo?.id });
    setText("");
    setReplyTo(null);
    inputRef.current?.focus();
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
    <div className="flex flex-col h-full bg-[#f0f2f5]">
      {/* Header */}
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 -ml-2 mr-1"><ArrowLeft size={20} /></Button>
        )}
        <button onClick={() => setShowMembers(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <Avatar name={group.name} isGroup />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{group.name}</div>
            <div className="text-xs text-green-200 truncate">{group.memberCount} members · {onlineCount} online</div>
          </div>
        </button>
        <button onClick={() => setShowSearch(!showSearch)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <Search size={16} />
        </button>
        <Button variant="ghost" size="icon"
          onClick={() => { if (confirm(`Leave group "${group.name}"?`)) leaveGroup.mutate({ groupID: group.id, workerID }); }}
          className="text-white hover:bg-red-500/30" title="Leave group"><LogOut size={18} /></Button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="bg-white px-3 py-2 border-b border-gray-200 flex items-center gap-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in group..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400" autoFocus />
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="p-1 hover:bg-gray-100 rounded-full"><X size={14} /></button>
          {searchQuery.length >= 2 && <span className="text-xs text-gray-400">{(searchResults as any[]).length} results</span>}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center mb-4 shadow-sm">
              <Users size={36} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1 text-gray-400">Start the conversation!</p>
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <span className="bg-white/90 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm font-medium">{formatDateSeparator(new Date(date))}</span>
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
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isLast ? "mb-1" : "mb-0.5"}`}>
                  {!isMine ? (
                    <div className="w-8 mr-1 flex-shrink-0 self-end">
                      {isLast && (
                        msg.senderID === SYSTEM_MAINTENANCE_SENDER_ID
                          ? <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center"><BadgeCheck size={16} className="text-white" /></div>
                          : <Avatar name={msg.senderName || "?"} size="sm" />
                      )}
                    </div>
                  ) : null}
                  <div className="relative group max-w-[75%] md:max-w-[65%]">
                    <div className={`px-3 py-[6px] shadow-sm text-sm ${radius} ${isMine ? "bg-[#e7ffdb]" : msg.senderID === SYSTEM_MAINTENANCE_SENDER_ID ? "bg-blue-50 border border-blue-100" : "bg-white"}`}>
                      {showSenderName && (
                        msg.senderID === SYSTEM_MAINTENANCE_SENDER_ID
                          ? (
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-xs font-bold text-blue-600">{msg.senderName}</span>
                              <BadgeCheck size={12} className="text-blue-500" />
                            </div>
                          )
                          : <div className="text-xs font-semibold text-[#075e54] mb-0.5">{msg.senderName}</div>
                      )}
                      {/* Reply quote */}
                      {replyMsg && (
                        <div className="mb-1 pl-2 border-l-2 border-[#075e54] bg-black/5 rounded-r-lg px-2 py-1">
                          <div className="text-[10px] font-semibold text-[#075e54]">{replyMsg.senderID === workerID ? "You" : replyMsg.senderName}</div>
                          <div className="text-[11px] text-gray-600 truncate">{replyMsg.text}</div>
                        </div>
                      )}
                      <span className="float-right ml-2 mt-1 flex items-center gap-0.5 opacity-0 pointer-events-none select-none text-[11px]" aria-hidden>
                        {formatMessageTime(msg.createdAt)}
                      </span>
                      <p className="break-words whitespace-pre-wrap text-[14.2px] text-gray-900 leading-[1.4]">{msg.text}</p>
                      <div className="flex items-center gap-0.5 justify-end -mt-0.5">
                        <span className="text-[11px] text-gray-400 leading-none">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className={`absolute -top-2 ${isMine ? "left-0 -translate-x-full" : "right-0 translate-x-full"} opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-0.5`}>
                      <button onClick={() => setReplyTo(msg)} className="w-6 h-6 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50" title="Reply">
                        <Reply size={11} className="text-gray-500" />
                      </button>
                      <button onClick={() => setEmojiPickerMsgID(emojiPickerMsgID === msg.id ? null : msg.id)} className="w-6 h-6 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50" title="React">😊</button>
                      {isMine && (
                        <button onClick={() => { if (confirm("Delete this message?")) deleteMsg.mutate({ messageID: msg.id, workerID }); }}
                          className="w-6 h-6 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center hover:bg-red-50" title="Delete">
                          <Trash2 size={11} className="text-red-400" />
                        </button>
                      )}
                    </div>
                    {emojiPickerMsgID === msg.id && (
                      <EmojiPicker onSelect={(emoji) => toggleReaction.mutate({ messageType: "group", messageID: msg.id, workerID, emoji })} onClose={() => setEmojiPickerMsgID(null)} />
                    )}
                    <ReactionBar reactions={msgReactions} workerID={workerID} onToggle={(emoji) => toggleReaction.mutate({ messageType: "group", messageID: msg.id, workerID, emoji })} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-20 right-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10">
          <ArrowDown size={18} className="text-gray-600" />
        </button>
      )}

      {/* Reply preview */}
      {replyTo && <ReplyPreview text={replyTo.text} senderName={replyTo.senderID === workerID ? "You" : replyTo.senderName} onCancel={() => setReplyTo(null)} />}

      {/* Input */}
      <div className="bg-[#f0f2f5] px-3 py-2 flex items-end gap-2 flex-shrink-0 border-t border-gray-200">
        <div className="flex-1 bg-white rounded-3xl px-4 py-2.5 shadow-sm">
          <AutoResizeInput inputRef={inputRef} value={text} onChange={setText} onKeyDown={handleKey} placeholder="Type a message" maxLength={2000} />
        </div>
        <button onClick={handleSend} disabled={!text.trim()}
          className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#128c7e] transition-colors disabled:opacity-40 flex-shrink-0 self-end">
          <Send size={18} />
        </button>
      </div>

      {/* Members modal */}
      {showMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMembers(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">{group.name}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowMembers(false)}><X size={18} /></Button>
            </div>
            <div className="p-3 text-xs text-gray-500 border-b">{group.memberCount} members · {onlineCount} online</div>
            <div className="max-h-72 overflow-y-auto">
              {(members as GroupMember[]).map((m: GroupMember) => {
                const memberOnline = (onlineStatus as Record<string, { online: boolean }>)[m.workerID]?.online;
                return (
                  <div key={m.workerID} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                    <Avatar name={m.worker?.name || m.workerID} online={memberOnline} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">{m.worker?.name || m.workerID}</div>
                      <div className="text-xs text-gray-500 truncate">{m.worker?.department}</div>
                    </div>
                    {m.workerID === group.createdBy && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Crown size={10} /> Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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

  // Get online status for conversation partners
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

  // Count total unread for groups (simple: show badge if any group has new messages)
  const totalGroupUnread = 0; // Group unread tracking would need read receipts per user

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs + New button */}
      <div className="flex items-center border-b border-gray-100 flex-shrink-0">
        <button onClick={() => setTab("messages")}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${tab === "messages" ? "text-[#075e54]" : "text-gray-500 hover:text-gray-700"}`}>
          Messages
          {tab === "messages" && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#075e54] rounded-full" />}
        </button>
        <button onClick={() => setTab("groups")}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${tab === "groups" ? "text-[#075e54]" : "text-gray-500 hover:text-gray-700"}`}>
          Groups
          {tab === "groups" && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#075e54] rounded-full" />}
        </button>
        <div className="relative px-2">
          <button onClick={() => setShowDropdown(v => !v)} className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="New">
            <Plus size={18} className="text-[#075e54]" />
          </button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[160px]">
                <button onClick={() => { setShowDropdown(false); onNewMessage(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-gray-900 text-sm">
                  <MessageCircle size={16} className="text-[#075e54]" /> New Message
                </button>
                <button onClick={() => { setShowDropdown(false); onNewGroup(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-gray-900 text-sm border-t border-gray-50">
                  <Users size={16} className="text-[#128c7e]" /> New Group
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === "messages" ? "Search conversations" : "Search groups"}
            className="w-full pl-9 pr-3 py-2 bg-[#f0f2f5] rounded-lg text-sm outline-none placeholder:text-gray-400" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {tab === "messages" ? (
          filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <MessageSquareDot size={32} className="opacity-40" />
              </div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1">Tap + to start a new message</p>
            </div>
          ) : filteredConvs.map((conv: Conversation) => {
            const isSystemConv = conv.worker1ID === SYSTEM_MAINTENANCE_SENDER_ID || conv.worker2ID === SYSTEM_MAINTENANCE_SENDER_ID;
            const name = isSystemConv ? "Scheduled Maintenance" : (conv.otherWorker?.name || "Unknown");
            const isSelected = selected?.type === "dm" && selected.conv.id === conv.id;
            const hasUnread = conv.unreadCount > 0;
            const partnerOnline = (onlineStatus as Record<string, { online: boolean }>)[conv.otherWorker?.workerID || ""]?.online;
            return (
              <button key={conv.id} onClick={() => onSelectDM(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${isSelected ? "bg-[#f0f2f5]" : ""}`}>
                {isSystemConv
                  ? <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"><BadgeCheck size={20} className="text-white" /></div>
                  : <Avatar name={name} online={partnerOnline} />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${hasUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>{name}</span>
                    <span className={`text-[11px] flex-shrink-0 ml-2 ${hasUnread ? "text-[#25d366] font-semibold" : "text-gray-400"}`}>
                      {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-xs truncate ${hasUnread ? "text-gray-700" : "text-gray-400"}`}>
                      {conv.lastMessage ? (conv.lastMessage.senderID === workerID ? `You: ${conv.lastMessage.text}` : conv.lastMessage.text) : "No messages yet"}
                    </span>
                    {hasUnread && (
                      <span className="ml-2 bg-[#25d366] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
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
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Users size={32} className="opacity-40" />
              </div>
              <p className="text-sm font-medium">No group chats yet</p>
              <p className="text-xs mt-1">Tap + to create a new group</p>
            </div>
          ) : filteredGroups.map((group: Group) => {
            const isSelected = selected?.type === "group" && selected.group.id === group.id;
            return (
              <button key={group.id} onClick={() => onSelectGroup(group)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${isSelected ? "bg-[#f0f2f5]" : ""}`}>
                <Avatar name={group.name} isGroup />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">{group.name}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                      {group.lastMessage ? formatTime(group.lastMessage.createdAt) : formatTime(group.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-gray-400 truncate">
                      {group.lastMessage ? `${group.lastMessage.senderName}: ${group.lastMessage.text}` : `${group.memberCount} members`}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2 flex items-center gap-1">
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

  // Heartbeat for online status
  useHeartbeat(workerID);

  // Handle ?with=WORKERID deep-link
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
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <UserCircle2 size={48} className="mx-auto mb-2 opacity-30" />
          <p>Please log in to use Messages</p>
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
    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#f8f9fa]">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <MessageCircle size={40} className="opacity-40" />
      </div>
      <p className="text-lg font-medium text-gray-500">PP4 Messages</p>
      <p className="text-sm text-gray-400 mt-1">Select a conversation or start a new one</p>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => setShowNewMessage(true)} className="bg-[#075e54] hover:bg-[#128c7e] text-white rounded-full px-5">
          <MessageCircle size={15} className="mr-1.5" /> New Message
        </Button>
        <Button onClick={() => setShowNewGroup(true)} className="bg-[#128c7e] hover:bg-[#075e54] text-white rounded-full px-5">
          <Users size={15} className="mr-1.5" /> New Group
        </Button>
      </div>
    </div>
  ) : selected.type === "dm" ? (
    <DMThread conv={selected.conv} workerID={workerID} workerName={workerName} />
  ) : (
    <GroupThread group={selected.group} workerID={workerID} workerName={workerName} onLeave={handleLeaveGroup} />
  );

  const mobileHeaderActions = (
    <div className="relative">
      <button onClick={() => setShowMobileDropdown(v => !v)} className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors" title="New">
        <Plus size={14} />
      </button>
      {showMobileDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMobileDropdown(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[160px]">
            <button onClick={() => { setShowMobileDropdown(false); setShowNewMessage(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-gray-900 text-sm">
              <MessageCircle size={16} className="text-[#075e54]" /> New Message
            </button>
            <button onClick={() => { setShowMobileDropdown(false); setShowNewGroup(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-gray-900 text-sm border-t border-gray-50">
              <Users size={16} className="text-[#128c7e]" /> New Group
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <AppLayout pageTitle="Messages" headerActions={mobileHeaderActions} fullHeight>
    <div className="h-full flex overflow-hidden bg-[#f0f2f5]">
      {/* Desktop/Tablet: Side-by-side */}
      <div className="hidden md:flex w-full h-full">
        <div className="w-[300px] md:w-[340px] lg:w-[380px] xl:w-[420px] flex-shrink-0 border-r border-gray-200 h-full overflow-hidden">
          <SidebarList {...sidebarProps} />
        </div>
        <div className="flex-1 h-full overflow-hidden relative">
          {threadPanel}
        </div>
      </div>

      {/* Mobile: Single panel */}
      <div className="flex md:hidden w-full h-full flex-col">
        {mobileView === "list" ? (
          <SidebarList {...sidebarProps} />
        ) : selected?.type === "dm" ? (
          <DMThread conv={selected.conv} workerID={workerID} workerName={workerName} onBack={() => setMobileView("list")} />
        ) : selected?.type === "group" ? (
          <GroupThread group={selected.group} workerID={workerID} workerName={workerName}
            onBack={() => setMobileView("list")} onLeave={handleLeaveGroup} />
        ) : null}
      </div>

      {showNewMessage && <NewMessageModal workerID={workerID} onClose={() => setShowNewMessage(false)} onSelect={handleNewWorker} />}
      {showNewGroup && <NewGroupModal workerID={workerID} onClose={() => setShowNewGroup(false)} onCreate={handleGroupCreated} />}
    </div>
    </AppLayout>
  );
}
