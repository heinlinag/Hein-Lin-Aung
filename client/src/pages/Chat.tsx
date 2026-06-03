/**
 * Chat — Direct Message page
 * Desktop/Tablet: Left sidebar (conversation list) + Right thread panel (WhatsApp Web style)
 * Mobile: Conversation list OR thread (single panel, back button to return)
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageCircle, Search, Plus, ArrowLeft, Send,
  X, UserCircle2, MessageSquareDot, Check, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
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
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

// ─── New Conversation Modal ───────────────────────────────────────────────────
function NewConvModal({ workerID, onClose, onSelect }: {
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
            <button
              key={w.workerID}
              onClick={() => onSelect(w)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <Avatar name={w.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{w.name}</div>
                <div className="text-xs text-gray-500 truncate">{w.workerID} · {w.department}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor(w.userLevel)}`}>
                L{w.userLevel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message Thread ───────────────────────────────────────────────────────────
function MessageThread({ conv, workerID, onBack }: {
  conv: Conversation;
  workerID: string;
  onBack?: () => void;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [] } = trpc.chat.getMessages.useQuery(
    { conversationID: conv.id },
    { refetchInterval: 2000 }
  );

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    markRead.mutate({ conversationID: conv.id, workerID });
    inputRef.current?.focus();
  }, [conv.id]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMsg.mutate({ conversationID: conv.id, senderID: workerID, text: trimmed });
    setText("");
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // Group messages by date
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
      {/* Header */}
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 -ml-2 mr-1">
            <ArrowLeft size={20} />
          </Button>
        )}
        <Avatar name={otherName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{otherName}</div>
          <div className="text-xs text-green-200 truncate">
            {conv.otherWorker?.workerID} · {conv.otherWorker?.department}
          </div>
        </div>
      </div>

      {/* Messages */}
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
              <span className="bg-white/80 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">
                {formatDateSeparator(new Date(date))}
              </span>
            </div>
            {msgs.map((msg: ConvMessage) => {
              const isMine = msg.senderID === workerID;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-0.5`}>
                  {!isMine && <div className="w-8 mr-1 flex-shrink-0" />}
                  <div className={`max-w-[75%] md:max-w-[60%] px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed
                    ${isMine ? "bg-[#dcf8c6] rounded-tr-sm" : "bg-white rounded-tl-sm"}`}>
                    <p className="break-words whitespace-pre-wrap text-gray-900">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-gray-400">{formatMessageTime(msg.createdAt)}</span>
                      {isMine && (
                        msg.readAt
                          ? <CheckCheck size={12} className="text-blue-500" />
                          : <Check size={12} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-[#f0f2f5] px-3 py-2 flex items-end gap-2 flex-shrink-0 border-t border-gray-200">
        <div className="flex-1 bg-white rounded-3xl px-4 py-2.5 shadow-sm">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message"
            className="w-full bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400"
            maxLength={2000}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#128c7e] transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Conversation List ────────────────────────────────────────────────────────
function ConversationList({ workerID, selectedID, onSelect, onNew }: {
  workerID: string;
  selectedID: number | null;
  onSelect: (conv: Conversation) => void;
  onNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const { data: convs = [] } = trpc.chat.getConversations.useQuery(
    { workerID },
    { refetchInterval: 3000 }
  );

  const filtered = (convs as Conversation[]).filter((c: Conversation) =>
    c.otherWorker?.name.toLowerCase().includes(search.toLowerCase()) ||
    c.otherWorker?.workerID.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-[#075e54] text-white px-4 py-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-semibold">Messages</h1>
        <Button
          variant="ghost" size="icon"
          onClick={onNew}
          className="text-white hover:bg-white/20"
          title="New Message"
        >
          <Plus size={20} />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-white border-b border-gray-100">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full pl-9 pr-3 py-2 bg-[#f0f2f5] rounded-lg text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MessageSquareDot size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="text-xs mt-1">Tap + to start a new chat</p>
          </div>
        )}
        {filtered.map((conv: Conversation) => {
          const name = conv.otherWorker?.name || "Unknown";
          const isSelected = conv.id === selectedID;
          const hasUnread = conv.unreadCount > 0;
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left
                ${isSelected ? "bg-[#f0f2f5]" : ""}`}
            >
              <Avatar name={name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate ${hasUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                    {name}
                  </span>
                  <span className={`text-[11px] flex-shrink-0 ml-2 ${hasUnread ? "text-[#25d366] font-semibold" : "text-gray-400"}`}>
                    {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className={`text-xs truncate ${hasUnread ? "text-gray-700" : "text-gray-400"}`}>
                    {conv.lastMessage
                      ? (conv.lastMessage.senderID === workerID ? `You: ${conv.lastMessage.text}` : conv.lastMessage.text)
                      : "No messages yet"}
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
        })}
      </div>
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────
export default function Chat() {
  const { worker } = useAuth();
  const [location, navigate] = useLocation();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const utils = trpc.useUtils();

  const workerID = worker?.workerID || "";

  // Handle ?with=WORKERID deep-link
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const deepLinkWith = searchParams.get("with");

  const getOrCreate = trpc.chat.getOrCreate.useMutation({
    onSuccess: (conv) => {
      if (conv) {
        utils.chat.getConversations.invalidate({ workerID });
        setSelectedConv(conv as unknown as Conversation);
        setMobileView("thread");
      }
    },
    onError: () => toast.error("Could not open conversation"),
  });

  // Process deep-link on mount
  useEffect(() => {
    if (!deepLinkWith || !workerID) return;
    getOrCreate.mutate({ workerID, otherWorkerID: deepLinkWith });
    navigate("/chat", { replace: true });
  }, [deepLinkWith, workerID]);

  function handleSelectConv(conv: Conversation) {
    setSelectedConv(conv);
    setMobileView("thread");
  }

  function handleNewWorker(w: Worker) {
    setShowNewModal(false);
    if (!workerID) return;
    getOrCreate.mutate({ workerID, otherWorkerID: w.workerID });
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

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-[#f0f2f5]">
      {/* ── Desktop/Tablet: Side-by-side ── */}
      <div className="hidden md:flex w-full h-full">
        {/* Left: Conversation list */}
        <div className="w-[360px] lg:w-[400px] flex-shrink-0 border-r border-gray-200 h-full overflow-hidden">
          <ConversationList
            workerID={workerID}
            selectedID={selectedConv?.id || null}
            onSelect={handleSelectConv}
            onNew={() => setShowNewModal(true)}
          />
        </div>
        {/* Right: Thread or placeholder */}
        <div className="flex-1 h-full overflow-hidden">
          {selectedConv ? (
            <MessageThread conv={selectedConv} workerID={workerID} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#f8f9fa]">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <MessageCircle size={40} className="opacity-40" />
              </div>
              <p className="text-lg font-medium text-gray-500">PP4 Messages</p>
              <p className="text-sm text-gray-400 mt-1">Select a conversation or start a new one</p>
              <Button
                onClick={() => setShowNewModal(true)}
                className="mt-4 bg-[#075e54] hover:bg-[#128c7e] text-white rounded-full px-6"
              >
                <Plus size={16} className="mr-2" /> New Message
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile: Single panel ── */}
      <div className="flex md:hidden w-full h-full flex-col">
        {mobileView === "list" ? (
          <ConversationList
            workerID={workerID}
            selectedID={selectedConv?.id || null}
            onSelect={handleSelectConv}
            onNew={() => setShowNewModal(true)}
          />
        ) : selectedConv ? (
          <MessageThread
            conv={selectedConv}
            workerID={workerID}
            onBack={() => setMobileView("list")}
          />
        ) : null}
      </div>

      {/* New conversation modal */}
      {showNewModal && (
        <NewConvModal
          workerID={workerID}
          onClose={() => setShowNewModal(false)}
          onSelect={handleNewWorker}
        />
      )}
    </div>
  );
}
