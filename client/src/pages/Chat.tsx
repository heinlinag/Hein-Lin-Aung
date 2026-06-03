/**
 * Chat — Unified Messaging Hub
 * Combines Direct Messages and Group Chats in one page.
 * Desktop/Tablet: Left sidebar (tabs + list) + Right thread panel (WhatsApp Web style)
 * Mobile: List OR thread (single panel, back button to return)
 * + button dropdown: "New Message" | "New Group"
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import {
  MessageCircle, Search, Plus, ArrowLeft, Send,
  X, UserCircle2, MessageSquareDot, Check, CheckCheck,
  Users, LogOut, Crown, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reaction {
  id: number;
  messageType: "dm" | "group";
  messageID: number;
  workerID: string;
  emoji: string;
  createdAt: Date;
}
interface Worker {
  id: number;
  workerID: string;
  name: string;
  department: string;
  userLevel: string;
}
interface ConvMessage {
  id: number;
  conversationID: number;
  senderID: string;
  text: string;
  createdAt: Date;
  readAt: Date | null;
}
interface Conversation {
  id: number;
  worker1ID: string;
  worker2ID: string;
  lastMessageAt: Date;
  createdAt: Date;
  otherWorker: Worker | null;
  lastMessage: ConvMessage | null;
  unreadCount: number;
}
interface GroupMessage {
  id: number;
  groupID: number;
  senderID: string;
  senderName: string;
  text: string;
  createdAt: Date;
}
interface Group {
  id: number;
  name: string;
  createdBy: string;
  lastMessageAt: Date;
  createdAt: Date;
  memberCount: number;
  memberIDs: string[];
  lastMessage: GroupMessage | null;
}
interface GroupMember {
  id: number;
  groupID: number;
  workerID: string;
  joinedAt: Date;
  worker: Worker | null;
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
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
function getInitials(name: string) {
  return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
}
function levelColor(level: string) {
  if (level === "1") return "bg-orange-100 text-orange-700";
  if (level === "1.1") return "bg-purple-100 text-purple-700";
  return "bg-green-100 text-green-700";
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = "md", isGroup = false }: { name: string; size?: "sm" | "md" | "lg"; isGroup?: boolean }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500"];
  const color = isGroup ? "bg-[#128c7e]" : colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {isGroup ? <Users size={size === "sm" ? 14 : size === "lg" ? 20 : 16} /> : getInitials(name)}
    </div>
  );
}

// ─── New Message Modal ────────────────────────────────────────────────────────
function NewMessageModal({ workerID, onClose, onSelect }: {
  workerID: string;
  onClose: () => void;
  onSelect: (worker: Worker) => void;
}) {
  const [search, setSearch] = useState("");
  const { data: workers = [] } = trpc.chat.getWorkers.useQuery({ workerID }, { refetchOnWindowFocus: false });
  const filtered = (workers as Worker[]).filter((w: Worker) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.workerID.toLowerCase().includes(search.toLowerCase()) ||
    w.department.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">New Message</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>
        <div className="p-3 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search workers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No workers found</div>
          ) : filtered.map((w: Worker) => (
            <button key={w.workerID} onClick={() => onSelect(w)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
              <Avatar name={w.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{w.name}</div>
                <div className="text-xs text-gray-500 truncate">{w.workerID} · {w.department}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor(w.userLevel)}`}>L{w.userLevel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── New Group Modal ──────────────────────────────────────────────────────────
function NewGroupModal({ workerID, onClose, onCreate }: {
  workerID: string;
  onClose: () => void;
  onCreate: (group: Group) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { data: workers = [] } = trpc.chat.getWorkers.useQuery({ workerID }, { refetchOnWindowFocus: false });
  const utils = trpc.useUtils();

  const createGroup = trpc.groupChat.create.useMutation({
    onSuccess: (group) => {
      utils.groupChat.getGroups.invalidate({ workerID });
      onCreate(group as unknown as Group);
      toast.success(`Group "${(group as unknown as Group)?.name}" created!`);
    },
    onError: () => toast.error("Failed to create group"),
  });

  const filtered = (workers as Worker[]).filter((w: Worker) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.workerID.toLowerCase().includes(search.toLowerCase())
  );

  function toggleSelect(wid: string) {
    setSelected(prev => prev.includes(wid) ? prev.filter(x => x !== wid) : prev.length < 9 ? [...prev, wid] : prev);
  }

  function handleCreate() {
    if (!groupName.trim()) { toast.error("Enter a group name"); return; }
    if (selected.length === 0) { toast.error("Select at least 1 member"); return; }
    createGroup.mutate({ name: groupName.trim(), createdBy: workerID, memberIDs: selected });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="font-semibold text-gray-900">New Group</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>
        <div className="p-3 border-b flex-shrink-0">
          <input
            placeholder="Group name (required)"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none placeholder:text-gray-400"
            maxLength={128}
            autoFocus
          />
        </div>
        {selected.length > 0 && (
          <div className="px-3 py-2 border-b flex flex-wrap gap-1.5 flex-shrink-0">
            {selected.map(wid => {
              const w = (workers as Worker[]).find((x: Worker) => x.workerID === wid);
              return (
                <span key={wid} className="flex items-center gap-1 bg-[#dcf8c6] text-gray-800 text-xs px-2 py-1 rounded-full">
                  {w?.name || wid}
                  <button onClick={() => toggleSelect(wid)} className="hover:text-red-500"><X size={12} /></button>
                </span>
              );
            })}
            <span className="text-xs text-gray-400 self-center">{selected.length}/9 selected</span>
          </div>
        )}
        <div className="p-3 border-b flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search workers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No workers found</div>
          ) : filtered.map((w: Worker) => {
            const isSelected = selected.includes(w.workerID);
            const isDisabled = !isSelected && selected.length >= 9;
            return (
              <button key={w.workerID} onClick={() => !isDisabled && toggleSelect(w.workerID)} disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left
                  ${isSelected ? "bg-[#f0fdf4]" : ""} ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}>
                <div className="relative">
                  <Avatar name={w.name} size="md" />
                  {isSelected && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#25d366] rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{w.name}</div>
                  <div className="text-xs text-gray-500 truncate">{w.workerID} · {w.department}</div>
                </div>
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

// ─── Emoji Picker (quick 6 emojis) ──────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-1 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 px-2 py-1.5 flex gap-1">
        {QUICK_EMOJIS.map(e => (
          <button key={e} onClick={() => { onSelect(e); onClose(); }}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors">
            {e}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Reaction Bar ────────────────────────────────────────────────────────────────────
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
          <span>{emoji}</span>
          <span className="font-medium">{count}</span>
        </button>
      ))}
    </div>
  );
}

// ─── DM Thread ────────────────────────────────────────────────────────────────────
function DMThread({ conv, workerID, workerName, onBack }: { conv: Conversation; workerID: string; workerName: string; onBack?: () => void }) {
  const [text, setText] = useState("");
  const [emojiPickerMsgID, setEmojiPickerMsgID] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [] } = trpc.chat.getMessages.useQuery({ conversationID: conv.id }, { refetchInterval: 2000 });
  const msgIDs = (messages as ConvMessage[]).map(m => m.id);
  const { data: reactions = [] } = trpc.reactions.getForMessages.useQuery(
    { messageType: "dm", messageIDs: msgIDs },
    { enabled: msgIDs.length > 0, refetchInterval: 3000 }
  );

  const toggleReaction = trpc.reactions.toggle.useMutation({
    onSettled: () => utils.reactions.getForMessages.invalidate({ messageType: "dm", messageIDs: msgIDs }),
  });

  const sendMsg = trpc.chat.sendMessage.useMutation({
    onMutate: async (vars) => {
      await utils.chat.getMessages.cancel({ conversationID: conv.id });
      const prev = utils.chat.getMessages.getData({ conversationID: conv.id });
      utils.chat.getMessages.setData({ conversationID: conv.id }, (old) => [
        ...(old || []),
        { id: Date.now(), conversationID: conv.id, senderID: vars.senderID, text: vars.text, createdAt: new Date(), readAt: null },
      ]);
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { prev: ConvMessage[] | undefined } | undefined) => {
      if (ctx?.prev) utils.chat.getMessages.setData({ conversationID: conv.id }, ctx.prev);
    },
    onSettled: () => {
      utils.chat.getMessages.invalidate({ conversationID: conv.id });
      utils.chat.getConversations.invalidate({ workerID });
    },
  });

  const markRead = trpc.chat.markRead.useMutation();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    markRead.mutate({ conversationID: conv.id, workerID });
    inputRef.current?.focus();
  }, [conv.id]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMsg.mutate({ conversationID: conv.id, senderID: workerID, senderName: workerName, text: trimmed });
    setText("");
    inputRef.current?.focus();
  }
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const grouped: { date: string; msgs: ConvMessage[] }[] = [];
  (messages as ConvMessage[]).forEach((msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== dateKey) grouped.push({ date: dateKey, msgs: [msg] });
    else last.msgs.push(msg);
  });

  const otherName = conv.otherWorker?.name || "Unknown";

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5]">
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 -ml-2 mr-1">
            <ArrowLeft size={20} />
          </Button>
        )}
        <Avatar name={otherName} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{otherName}</div>
          <div className="text-xs text-green-200 truncate">{conv.otherWorker?.workerID} · {conv.otherWorker?.department}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <MessageCircle size={48} className="mb-3 opacity-30" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <span className="bg-white/80 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">{formatDateSeparator(new Date(date))}</span>
            </div>
            {msgs.map((msg: ConvMessage) => {
              const isMine = msg.senderID === workerID;
              const msgReactions = (reactions as Reaction[]).filter(r => r.messageID === msg.id);
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                  {!isMine && <div className="w-8 mr-1 flex-shrink-0" />}
                  <div className="relative group">
                    <div className={`max-w-[75%] md:max-w-[60%] px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed
                      ${isMine ? "bg-[#dcf8c6] rounded-tr-sm" : "bg-white rounded-tl-sm"}`}>
                      <p className="break-words whitespace-pre-wrap text-gray-900">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-gray-400">{formatMessageTime(msg.createdAt)}</span>
                        {isMine && (msg.readAt ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} className="text-gray-400" />)}
                      </div>
                    </div>
                    {/* Emoji reaction trigger */}
                    <button
                      onClick={() => setEmojiPickerMsgID(emojiPickerMsgID === msg.id ? null : msg.id)}
                      className={`absolute -top-2 ${isMine ? "left-0 -translate-x-full mr-1" : "right-0 translate-x-full ml-1"} opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-6 h-6 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50`}
                      title="React"
                    >😊</button>
                    {emojiPickerMsgID === msg.id && (
                      <EmojiPicker
                        onSelect={(emoji) => toggleReaction.mutate({ messageType: "dm", messageID: msg.id, workerID, emoji })}
                        onClose={() => setEmojiPickerMsgID(null)}
                      />
                    )}
                    <ReactionBar
                      reactions={msgReactions}
                      workerID={workerID}
                      onToggle={(emoji) => toggleReaction.mutate({ messageType: "dm", messageID: msg.id, workerID, emoji })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="bg-[#f0f2f5] px-3 py-2 flex items-end gap-2 flex-shrink-0 border-t border-gray-200">
        <div className="flex-1 bg-white rounded-3xl px-4 py-2.5 shadow-sm">
          <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
            placeholder="Type a message"
            className="w-full bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400" maxLength={2000} />
        </div>
        <button onClick={handleSend} disabled={!text.trim()}
          className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#128c7e] transition-colors disabled:opacity-40 flex-shrink-0">
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [] } = trpc.groupChat.getMessages.useQuery({ groupID: group.id }, { refetchInterval: 2000 });
  const { data: members = [] } = trpc.groupChat.getMembers.useQuery({ groupID: group.id }, { refetchOnWindowFocus: false });
  const msgIDs = (messages as GroupMessage[]).map(m => m.id);
  const { data: reactions = [] } = trpc.reactions.getForMessages.useQuery(
    { messageType: "group", messageIDs: msgIDs },
    { enabled: msgIDs.length > 0, refetchInterval: 3000 }
  );

  const toggleReaction = trpc.reactions.toggle.useMutation({
    onSettled: () => utils.reactions.getForMessages.invalidate({ messageType: "group", messageIDs: msgIDs }),
  });

  const sendMsg = trpc.groupChat.sendMessage.useMutation({
    onMutate: async (vars) => {
      await utils.groupChat.getMessages.cancel({ groupID: group.id });
      const prev = utils.groupChat.getMessages.getData({ groupID: group.id });
      utils.groupChat.getMessages.setData({ groupID: group.id }, (old) => [
        ...(old || []),
        { id: Date.now(), groupID: group.id, senderID: vars.senderID, senderName: vars.senderName, text: vars.text, createdAt: new Date() },
      ]);
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { prev: GroupMessage[] | undefined } | undefined) => {
      if (ctx?.prev) utils.groupChat.getMessages.setData({ groupID: group.id }, ctx.prev);
    },
    onSettled: () => {
      utils.groupChat.getMessages.invalidate({ groupID: group.id });
      utils.groupChat.getGroups.invalidate({ workerID });
    },
  });

  const leaveGroup = trpc.groupChat.leave.useMutation({
    onSuccess: () => { utils.groupChat.getGroups.invalidate({ workerID }); toast.success("Left group"); onLeave(); },
    onError: () => toast.error("Failed to leave group"),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, [group.id]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMsg.mutate({ groupID: group.id, senderID: workerID, senderName: workerName, text: trimmed });
    setText("");
    inputRef.current?.focus();
  }
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const grouped: { date: string; msgs: GroupMessage[] }[] = [];
  (messages as GroupMessage[]).forEach((msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== dateKey) grouped.push({ date: dateKey, msgs: [msg] });
    else last.msgs.push(msg);
  });

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5]">
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 -ml-2 mr-1">
            <ArrowLeft size={20} />
          </Button>
        )}
        <button onClick={() => setShowMembers(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <Avatar name={group.name} isGroup />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{group.name}</div>
            <div className="text-xs text-green-200 truncate">{group.memberCount} members · tap for info</div>
          </div>
        </button>
        <Button variant="ghost" size="icon"
          onClick={() => { if (confirm(`Leave group "${group.name}"?`)) leaveGroup.mutate({ groupID: group.id, workerID }); }}
          className="text-white hover:bg-red-500/30" title="Leave group">
          <LogOut size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <Users size={48} className="mb-3 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <span className="bg-white/80 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">{formatDateSeparator(new Date(date))}</span>
            </div>
            {msgs.map((msg: GroupMessage, i: number) => {
              const isMine = msg.senderID === workerID;
              const prevMsg = i > 0 ? msgs[i - 1] : null;
              const showSenderName = !isMine && (!prevMsg || prevMsg.senderID !== msg.senderID);
              const msgReactions = (reactions as Reaction[]).filter(r => r.messageID === msg.id);
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                  {!isMine && <div className="w-8 mr-1 flex-shrink-0" />}
                  <div className="relative group">
                    <div className={`max-w-[75%] md:max-w-[60%] px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed
                      ${isMine ? "bg-[#dcf8c6] rounded-tr-sm" : "bg-white rounded-tl-sm"}`}>
                      {showSenderName && <div className="text-xs font-semibold text-[#075e54] mb-0.5">{msg.senderName}</div>}
                      <p className="break-words whitespace-pre-wrap text-gray-900">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-gray-400">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEmojiPickerMsgID(emojiPickerMsgID === msg.id ? null : msg.id)}
                      className={`absolute -top-2 ${isMine ? "left-0 -translate-x-full mr-1" : "right-0 translate-x-full ml-1"} opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-6 h-6 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50`}
                      title="React"
                    >😊</button>
                    {emojiPickerMsgID === msg.id && (
                      <EmojiPicker
                        onSelect={(emoji) => toggleReaction.mutate({ messageType: "group", messageID: msg.id, workerID, emoji })}
                        onClose={() => setEmojiPickerMsgID(null)}
                      />
                    )}
                    <ReactionBar
                      reactions={msgReactions}
                      workerID={workerID}
                      onToggle={(emoji) => toggleReaction.mutate({ messageType: "group", messageID: msg.id, workerID, emoji })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="bg-[#f0f2f5] px-3 py-2 flex items-end gap-2 flex-shrink-0 border-t border-gray-200">
        <div className="flex-1 bg-white rounded-3xl px-4 py-2.5 shadow-sm">
          <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
            placeholder="Type a message"
            className="w-full bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400" maxLength={2000} />
        </div>
        <button onClick={handleSend} disabled={!text.trim()}
          className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#128c7e] transition-colors disabled:opacity-40 flex-shrink-0">
          <Send size={18} />
        </button>
      </div>

      {showMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">{group.name}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowMembers(false)}><X size={18} /></Button>
            </div>
            <div className="p-3 text-xs text-gray-500 border-b">{group.memberCount} members</div>
            <div className="max-h-72 overflow-y-auto">
              {(members as GroupMember[]).map((m: GroupMember) => (
                <div key={m.workerID} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                  <Avatar name={m.worker?.name || m.workerID} />
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
              ))}
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
  workerID: string;
  tab: ActiveTab;
  setTab: (t: ActiveTab) => void;
  selected: SelectedItem;
  onSelectDM: (conv: Conversation) => void;
  onSelectGroup: (group: Group) => void;
  onNewMessage: () => void;
  onNewGroup: () => void;
}) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: convs = [] } = trpc.chat.getConversations.useQuery({ workerID }, { refetchInterval: 3000 });
  const { data: groups = [] } = trpc.groupChat.getGroups.useQuery({ workerID }, { refetchInterval: 3000 });

  const filteredConvs = (convs as Conversation[]).filter((c: Conversation) =>
    c.otherWorker?.name.toLowerCase().includes(search.toLowerCase()) ||
    c.otherWorker?.workerID.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGroups = (groups as Group[]).filter((g: Group) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header — hidden on mobile (AppLayout provides header), visible on desktop sidebar */}
      <div className="hidden md:flex bg-[#075e54] text-white px-4 py-4 items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-semibold">Messages</h1>
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setShowDropdown(v => !v)}
            className="text-white hover:bg-white/20" title="New">
            <Plus size={20} />
          </Button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[160px]">
                <button onClick={() => { setShowDropdown(false); onNewMessage(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-gray-900 text-sm">
                  <MessageCircle size={16} className="text-[#075e54]" />
                  New Message
                </button>
                <button onClick={() => { setShowDropdown(false); onNewGroup(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-gray-900 text-sm border-t border-gray-50">
                  <Users size={16} className="text-[#128c7e]" />
                  New Group
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        <button onClick={() => setTab("messages")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === "messages" ? "text-[#075e54] border-b-2 border-[#075e54]" : "text-gray-500 hover:text-gray-700"}`}>
          Messages
        </button>
        <button onClick={() => setTab("groups")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === "groups" ? "text-[#075e54] border-b-2 border-[#075e54]" : "text-gray-500 hover:text-gray-700"}`}>
          Groups
        </button>
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
              <MessageSquareDot size={48} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1">Tap + → New Message</p>
            </div>
          ) : filteredConvs.map((conv: Conversation) => {
            const name = conv.otherWorker?.name || "Unknown";
            const isSelected = selected?.type === "dm" && selected.conv.id === conv.id;
            const hasUnread = conv.unreadCount > 0;
            return (
              <button key={conv.id} onClick={() => onSelectDM(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${isSelected ? "bg-[#f0f2f5]" : ""}`}>
                <Avatar name={name} />
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
              <Users size={48} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No group chats yet</p>
              <p className="text-xs mt-1">Tap + → New Group</p>
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

  function handleSelectDM(conv: Conversation) {
    setSelected({ type: "dm", conv });
    setMobileView("thread");
  }
  function handleSelectGroup(group: Group) {
    setSelected({ type: "group", group });
    setMobileView("thread");
  }
  function handleNewWorker(w: Worker) {
    setShowNewMessage(false);
    if (!workerID) return;
    getOrCreate.mutate({ workerID, otherWorkerID: w.workerID });
  }
  function handleGroupCreated(group: Group) {
    setShowNewGroup(false);
    setTab("groups");
    setSelected({ type: "group", group });
    setMobileView("thread");
  }
  function handleLeaveGroup() {
    setSelected(null);
    setMobileView("list");
  }

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
    onSelectDM: handleSelectDM,
    onSelectGroup: handleSelectGroup,
    onNewMessage: () => setShowNewMessage(true),
    onNewGroup: () => setShowNewGroup(true),
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
      <button
        onClick={() => setShowMobileDropdown(v => !v)}
        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
        title="New"
      >
        <Plus size={16} />
      </button>
      {showMobileDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMobileDropdown(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[160px]">
            <button onClick={() => { setShowMobileDropdown(false); setShowNewMessage(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-gray-900 text-sm">
              <MessageCircle size={16} className="text-[#075e54]" />
              New Message
            </button>
            <button onClick={() => { setShowMobileDropdown(false); setShowNewGroup(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-gray-900 text-sm border-t border-gray-50">
              <Users size={16} className="text-[#128c7e]" />
              New Group
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <AppLayout pageTitle="Messages" headerActions={mobileHeaderActions} fullHeight>
    <div className="h-full flex overflow-hidden bg-[#f0f2f5]">
      {/* ── Desktop/Tablet: Side-by-side ── */}
      <div className="hidden md:flex w-full h-full">
        <div className="w-[360px] lg:w-[400px] flex-shrink-0 border-r border-gray-200 h-full overflow-hidden">
          <SidebarList {...sidebarProps} />
        </div>
        <div className="flex-1 h-full overflow-hidden">
          {threadPanel}
        </div>
      </div>

      {/* ── Mobile: Single panel ── */}
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
