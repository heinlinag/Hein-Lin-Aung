/**
 * ChatGroup — Group Chat page (/chat_group)
 * Desktop/Tablet: Left sidebar (group list) + Right thread panel
 * Mobile: Group list OR thread (single panel, back button to return)
 * Max 10 members per group
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Search, Plus, ArrowLeft, Send, X, UserCircle2,
  MessageSquareDot, LogOut, Crown, Check,
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

// ─── Create Group Modal ───────────────────────────────────────────────────────
function CreateGroupModal({ workerID, onClose, onCreate }: {
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
    setSelected(prev =>
      prev.includes(wid) ? prev.filter(x => x !== wid) : prev.length < 9 ? [...prev, wid] : prev
    );
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
              <button
                key={w.workerID}
                onClick={() => !isDisabled && toggleSelect(w.workerID)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left
                  ${isSelected ? "bg-[#f0fdf4]" : ""} ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
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
          <Button
            onClick={handleCreate}
            disabled={!groupName.trim() || selected.length === 0 || createGroup.isPending}
            className="w-full bg-[#075e54] hover:bg-[#128c7e] text-white rounded-full"
          >
            {createGroup.isPending ? "Creating..." : `Create Group (${selected.length + 1} members)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Thread ─────────────────────────────────────────────────────────────
function GroupThread({ group, workerID, workerName, onBack, onLeave }: {
  group: Group;
  workerID: string;
  workerName: string;
  onBack?: () => void;
  onLeave: () => void;
}) {
  const [text, setText] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [] } = trpc.groupChat.getMessages.useQuery(
    { groupID: group.id },
    { refetchInterval: 2000 }
  );

  const { data: members = [] } = trpc.groupChat.getMembers.useQuery(
    { groupID: group.id },
    { refetchOnWindowFocus: false }
  );

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
    onSuccess: () => {
      utils.groupChat.getGroups.invalidate({ workerID });
      toast.success("Left group");
      onLeave();
    },
    onError: () => toast.error("Failed to leave group"),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [group.id]);

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
          <Avatar name={group.name} size="md" isGroup />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{group.name}</div>
            <div className="text-xs text-green-200 truncate">{group.memberCount} members · tap for info</div>
          </div>
        </button>
        <Button
          variant="ghost" size="icon"
          onClick={() => { if (confirm(`Leave group "${group.name}"?`)) leaveGroup.mutate({ groupID: group.id, workerID }); }}
          className="text-white hover:bg-red-500/30"
          title="Leave group"
        >
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
              <span className="bg-white/80 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">
                {formatDateSeparator(new Date(date))}
              </span>
            </div>
            {msgs.map((msg: GroupMessage, i: number) => {
              const isMine = msg.senderID === workerID;
              const prevMsg = i > 0 ? msgs[i - 1] : null;
              const showSenderName = !isMine && (!prevMsg || prevMsg.senderID !== msg.senderID);
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-0.5`}>
                  {!isMine && <div className="w-8 mr-1 flex-shrink-0" />}
                  <div className={`max-w-[75%] md:max-w-[60%] px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed
                    ${isMine ? "bg-[#dcf8c6] rounded-tr-sm" : "bg-white rounded-tl-sm"}`}>
                    {showSenderName && (
                      <div className="text-xs font-semibold text-[#075e54] mb-0.5">{msg.senderName}</div>
                    )}
                    <p className="break-words whitespace-pre-wrap text-gray-900">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-gray-400">{formatMessageTime(msg.createdAt)}</span>
                    </div>
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
                  <Avatar name={m.worker?.name || m.workerID} size="md" />
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

// ─── Group List ───────────────────────────────────────────────────────────────
function GroupList({ workerID, selectedID, onSelect, onNew }: {
  workerID: string;
  selectedID: number | null;
  onSelect: (group: Group) => void;
  onNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const { data: groups = [] } = trpc.groupChat.getGroups.useQuery(
    { workerID },
    { refetchInterval: 3000 }
  );

  const filtered = (groups as Group[]).filter((g: Group) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-[#075e54] text-white px-4 py-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-semibold">Group Chats</h1>
        <Button variant="ghost" size="icon" onClick={onNew} className="text-white hover:bg-white/20" title="New Group">
          <Plus size={20} />
        </Button>
      </div>
      <div className="px-3 py-2 bg-white border-b border-gray-100">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups"
            className="w-full pl-9 pr-3 py-2 bg-[#f0f2f5] rounded-lg text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MessageSquareDot size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No group chats yet</p>
            <p className="text-xs mt-1">Tap + to create a new group</p>
          </div>
        )}
        {filtered.map((group: Group) => {
          const isSelected = group.id === selectedID;
          return (
            <button
              key={group.id}
              onClick={() => onSelect(group)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${isSelected ? "bg-[#f0f2f5]" : ""}`}
            >
              <Avatar name={group.name} size="md" isGroup />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 truncate">{group.name}</span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                    {group.lastMessage ? formatTime(group.lastMessage.createdAt) : formatTime(group.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-400 truncate">
                    {group.lastMessage
                      ? `${group.lastMessage.senderName}: ${group.lastMessage.text}`
                      : `${group.memberCount} members`}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2 flex items-center gap-1">
                    <Users size={10} /> {group.memberCount}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ChatGroup Page ──────────────────────────────────────────────────────
export default function ChatGroup() {
  const { worker } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const utils = trpc.useUtils();

  const workerID = worker?.workerID || "";
  const workerName = worker?.name || "";

  function handleSelectGroup(group: Group) {
    setSelectedGroup(group);
    setMobileView("thread");
  }

  function handleGroupCreated(group: Group) {
    setShowCreateModal(false);
    setSelectedGroup(group);
    setMobileView("thread");
  }

  function handleLeave() {
    setSelectedGroup(null);
    setMobileView("list");
  }

  if (!workerID) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <UserCircle2 size={48} className="mx-auto mb-2 opacity-30" />
          <p>Please log in to use Group Chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-[#f0f2f5]">
      {/* Desktop/Tablet */}
      <div className="hidden md:flex w-full h-full">
        <div className="w-[360px] lg:w-[400px] flex-shrink-0 border-r border-gray-200 h-full overflow-hidden">
          <GroupList workerID={workerID} selectedID={selectedGroup?.id || null} onSelect={handleSelectGroup} onNew={() => setShowCreateModal(true)} />
        </div>
        <div className="flex-1 h-full overflow-hidden">
          {selectedGroup ? (
            <GroupThread group={selectedGroup} workerID={workerID} workerName={workerName} onLeave={handleLeave} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#f8f9fa]">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Users size={40} className="opacity-40" />
              </div>
              <p className="text-lg font-medium text-gray-500">Group Chats</p>
              <p className="text-sm text-gray-400 mt-1">Select a group or create a new one (max 10 members)</p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4 bg-[#075e54] hover:bg-[#128c7e] text-white rounded-full px-6">
                <Plus size={16} className="mr-2" /> New Group
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden w-full h-full flex-col">
        {mobileView === "list" ? (
          <GroupList workerID={workerID} selectedID={selectedGroup?.id || null} onSelect={handleSelectGroup} onNew={() => setShowCreateModal(true)} />
        ) : selectedGroup ? (
          <GroupThread group={selectedGroup} workerID={workerID} workerName={workerName} onBack={() => setMobileView("list")} onLeave={handleLeave} />
        ) : null}
      </div>

      {showCreateModal && (
        <CreateGroupModal workerID={workerID} onClose={() => setShowCreateModal(false)} onCreate={handleGroupCreated} />
      )}
    </div>
  );
}
