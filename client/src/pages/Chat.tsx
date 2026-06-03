import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatMessage } from "../../../drizzle/schema";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { MessageCircle, Send, Search, Plus, ArrowLeft, Package, X, ChevronRight } from "lucide-react";

// Stored worker session
function getStoredWorker() {
  try {
    const raw = sessionStorage.getItem("worker") || localStorage.getItem("worker");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatTime(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function Chat() {
  const worker = getStoredWorker();
  const [, navigate] = useLocation();
  const [selectedConvID, setSelectedConvID] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [workerSearch, setWorkerSearch] = useState("");
  const [showMobileThread, setShowMobileThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for deep-link: /chat?with=WORKERID&ref=ORDER&label=LABEL
  const [initTarget, setInitTarget] = useState<{ otherID: string; orderRef?: string; orderLabel?: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withID = params.get("with");
    if (withID && worker?.workerID) {
      setInitTarget({
        otherID: withID,
        orderRef: params.get("ref") ?? undefined,
        orderLabel: params.get("label") ?? undefined,
      });
    }
  }, []);

  const getOrCreate = trpc.chat.getOrCreate.useMutation();

  useEffect(() => {
    if (initTarget && worker?.workerID) {
      getOrCreate.mutate(
        { myWorkerID: worker.workerID, otherWorkerID: initTarget.otherID, orderRef: initTarget.orderRef, orderLabel: initTarget.orderLabel },
        {
          onSuccess: (conv) => {
            if (conv) {
              setSelectedConvID(conv.id);
              setShowMobileThread(true);
              setInitTarget(null);
              // Clear URL params
              window.history.replaceState({}, "", "/chat");
            }
          },
        }
      );
    }
  }, [initTarget, worker?.workerID]);

  // Conversations list
  const { data: conversations = [], refetch: refetchConvs } = trpc.chat.getConversations.useQuery(
    { workerID: worker?.workerID ?? "" },
    { enabled: !!worker?.workerID, refetchInterval: 5000 }
  );

  // Messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = trpc.chat.getMessages.useQuery(
    { conversationID: selectedConvID! },
    { enabled: selectedConvID !== null, refetchInterval: 3000 }
  );

  // Mark read when opening a conversation
  const markRead = trpc.chat.markRead.useMutation();
  useEffect(() => {
    if (selectedConvID && worker?.workerID) {
      markRead.mutate({ conversationID: selectedConvID, workerID: worker.workerID });
    }
  }, [selectedConvID, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      refetchConvs();
    },
  });

  const handleSend = useCallback(() => {
    const text = messageText.trim();
    if (!text || !selectedConvID || !worker?.workerID) return;
    sendMessage.mutate({ conversationID: selectedConvID, senderID: worker.workerID, text });
  }, [messageText, selectedConvID, worker?.workerID]);

  // Workers list for new chat
  const { data: allWorkers = [] } = trpc.chat.getWorkers.useQuery(
    { excludeWorkerID: worker?.workerID ?? "" },
    { enabled: showNewChat && !!worker?.workerID }
  );

  type ConvItem = { id: number; worker1ID: string; worker2ID: string; orderRef?: string | null; orderLabel?: string | null; lastMessageAt: Date | null; unreadCount: number; otherWorker?: { name: string; department: string } | null; lastMessage?: { senderID: string; text: string; createdAt: Date } | null };
  type WorkerItem = { id: number; workerID: string; name: string; department: string; userLevel: string };

  const filteredConvs = (conversations as ConvItem[]).filter((c: ConvItem) => {
    const name = c.otherWorker?.name ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredWorkers = (allWorkers as WorkerItem[]).filter((w: WorkerItem) =>
    w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.workerID.toLowerCase().includes(workerSearch.toLowerCase())
  );

  const selectedConv = (conversations as ConvItem[]).find((c: ConvItem) => c.id === selectedConvID);

  if (!worker) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <MessageCircle size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Please log in to use Chat</p>
            <button onClick={() => navigate("/")} className="mt-3 text-sm text-blue-600 hover:underline">Go to Login</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
        {/* ── Left panel: conversation list ── */}
        <div className={`${showMobileThread ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-80 xl:w-96 bg-white border-r border-gray-100 flex-shrink-0`}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>Messages</h2>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                title="New conversation"
              >
                <Plus size={16} />
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <MessageCircle size={32} className="mb-2 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Click + to start a new chat</p>
              </div>
            ) : (
              filteredConvs.map((conv: { id: number; worker1ID: string; worker2ID: string; orderRef?: string | null; orderLabel?: string | null; lastMessageAt: Date | null; unreadCount: number; otherWorker?: { name: string; department: string } | null; lastMessage?: { senderID: string; text: string; createdAt: Date } | null }) => {
                const name = conv.otherWorker?.name ?? conv.worker1ID === worker.workerID ? (conv.otherWorker?.name ?? conv.worker2ID) : conv.otherWorker?.name ?? conv.worker1ID;
                const isSelected = conv.id === selectedConvID;
                const hasUnread = conv.unreadCount > 0;
                return (
                  <button
                    key={conv.id}
                    onClick={() => { setSelectedConvID(conv.id); setShowMobileThread(true); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${isSelected ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""}`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(conv.otherWorker?.name ?? "?")}`}>
                      {getInitials(conv.otherWorker?.name ?? "?")}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold truncate ${hasUnread ? "text-gray-900" : "text-gray-700"}`}>
                          {conv.otherWorker?.name ?? "Unknown"}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                          {formatTime(conv.lastMessage?.createdAt ?? conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate ${hasUnread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                          {conv.lastMessage ? (
                            conv.lastMessage.senderID === worker.workerID ? `You: ${conv.lastMessage.text}` : conv.lastMessage.text
                          ) : (
                            conv.orderLabel ? `📦 ${conv.orderLabel}` : "No messages yet"
                          )}
                        </p>
                        {hasUnread && (
                          <span className="ml-2 min-w-[18px] h-[18px] bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.orderRef && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Package size={9} className="text-indigo-400" />
                          <span className="text-[10px] text-indigo-500 truncate">{conv.orderRef}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel: message thread ── */}
        <div className={`${showMobileThread ? "flex" : "hidden"} lg:flex flex-col flex-1 min-w-0`}>
          {selectedConv ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
                <button
                  onClick={() => setShowMobileThread(false)}
                  className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(selectedConv.otherWorker?.name ?? "?")}`}>
                  {getInitials(selectedConv.otherWorker?.name ?? "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedConv.otherWorker?.name ?? "Unknown"}</p>
                  <p className="text-xs text-gray-400 truncate">{selectedConv.otherWorker?.department ?? ""}</p>
                </div>
                {selectedConv.orderRef && (
                  <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                    <Package size={11} />
                    <span className="truncate max-w-[120px]">{selectedConv.orderRef}</span>
                  </div>
                )}
              </div>

              {/* Order context banner */}
              {selectedConv.orderLabel && (
                <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
                  <Package size={13} className="text-indigo-500 flex-shrink-0" />
                  <span className="text-xs text-indigo-700 font-medium truncate">{selectedConv.orderLabel}</span>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <MessageCircle size={28} className="mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">No messages yet. Say hi!</p>
                  </div>
                )}
                {(messages as ChatMessage[]).map((msg: ChatMessage, idx: number) => {
                  const isMine = msg.senderID === worker.workerID;
                  const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                            {new Date(msg.createdAt).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                          isMine
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                        }`}>
                          <p className="leading-relaxed break-words">{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-indigo-200 text-right" : "text-gray-400"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-4 py-3 bg-white border-t border-gray-100">
                <div className="flex items-end gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
                    maxLength={2000}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMessage.isPending}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-md shadow-indigo-500/20"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                <MessageCircle size={28} className="text-indigo-500" />
              </div>
              <p className="text-base font-semibold text-gray-600">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">or start a new one with the + button</p>
            </div>
          )}
        </div>
      </div>

      {/* ── New Chat modal ── */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>New Conversation</h3>
              <button onClick={() => { setShowNewChat(false); setWorkerSearch(""); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workers..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-72">
              {filteredWorkers.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No workers found</div>
              ) : (
                filteredWorkers.map((w: { id: number; workerID: string; name: string; department: string; userLevel: string }) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setShowNewChat(false);
                      setWorkerSearch("");
                      getOrCreate.mutate(
                        { myWorkerID: worker.workerID, otherWorkerID: w.workerID },
                        {
                          onSuccess: (conv) => {
                            if (conv) { setSelectedConvID(conv.id); setShowMobileThread(true); refetchConvs(); }
                          },
                        }
                      );
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(w.name)}`}>
                      {getInitials(w.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{w.name}</p>
                      <p className="text-xs text-gray-400 truncate">{w.department} · Level {w.userLevel}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
