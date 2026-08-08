import { useState } from "react";
import { Mail, Check, Eye, MessageSquare, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function ContactMessagesTab() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: messages, isLoading, refetch } = trpc.system.getContactMessages.useQuery();
  const markAsRead = trpc.system.markContactMessageAsRead.useMutation({
    onSuccess: () => { refetch(); toast.success("Marked as read"); },
  });
  const markAsReplied = trpc.system.markContactMessageAsReplied.useMutation({
    onSuccess: () => {
      refetch();
      setReplyingTo(null);
      setReplyText("");
      toast.success("Message marked as replied");
    },
  });

  const handleReply = async (messageId: number, adminName: string) => {
    if (!replyText.trim()) { toast.error("Reply cannot be empty"); return; }
    await markAsReplied.mutateAsync({ id: messageId, repliedBy: adminName });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}>New</span>;
      case "read":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}>Read</span>;
      case "replied":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" }}>Replied</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <span className="text-slate-400 text-sm">Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
            <Mail size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Contact Messages</h3>
            <p className="text-xs text-slate-400">{messages?.length || 0} message{(messages?.length || 0) !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {!messages || messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <MessageSquare size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm font-medium">No contact messages yet</p>
          <p className="text-slate-600 text-xs mt-1">Messages from the Help Center will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message: any) => (
            <div key={message.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Status accent bar */}
              <div className="h-0.5 w-full" style={{
                background: message.status === "replied"
                  ? "linear-gradient(90deg, #10b981, #059669)"
                  : message.status === "read"
                  ? "linear-gradient(90deg, #f59e0b, #d97706)"
                  : "linear-gradient(90deg, #3b82f6, #2563eb)"
              }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold text-white text-sm">{message.name}</h4>
                      {getStatusBadge(message.status)}
                    </div>
                    <p className="text-xs text-slate-400">{message.email}</p>
                    <p className="text-sm font-semibold text-slate-200 mt-1">{message.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0 ml-2">
                    <Clock size={11} />
                    {new Date(message.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {selectedMessage === message.id && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">{message.message}</p>

                    <div className="flex flex-wrap gap-2">
                      {message.status === "new" && (
                        <button
                          onClick={() => markAsRead.mutate({ id: message.id })}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                          style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}
                        >
                          <Eye size={13} /> Mark as Read
                        </button>
                      )}
                      {message.status !== "replied" && (
                        <button
                          onClick={() => setReplyingTo(replyingTo === message.id ? null : message.id)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" }}
                        >
                          <Check size={13} /> Mark as Replied
                        </button>
                      )}
                    </div>

                    {replyingTo === message.id && (
                      <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Reply message (for reference only)"
                          className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReply(message.id, "Administrator")}
                            disabled={markAsReplied.isPending}
                            className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-60"
                            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                          >
                            Confirm Replied
                          </button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-all"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 mt-3 font-semibold transition-colors"
                >
                  {selectedMessage === message.id ? "▲ Hide" : "▼ View"} Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
