import { useState } from "react";
import { Mail, Check, AlertCircle, Trash2, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function ContactMessagesTab() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: messages, isLoading, refetch } = trpc.system.getContactMessages.useQuery();
  const markAsRead = trpc.system.markContactMessageAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Marked as read");
    },
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
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    await markAsReplied.mutateAsync({ id: messageId, repliedBy: adminName });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">New</span>;
      case "read":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Read</span>;
      case "replied":
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Replied</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Contact Messages</h3>
        <span className="text-sm text-gray-600">{messages?.length || 0} messages</span>
      </div>

      {!messages || messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Mail size={32} className="mx-auto mb-2 opacity-50" />
          <p>No contact messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message: any) => (
            <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{message.name}</h4>
                    {getStatusBadge(message.status)}
                  </div>
                  <p className="text-sm text-gray-600">{message.email}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{message.subject}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleDateString()}
                </div>
              </div>

              {selectedMessage === message.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-gray-700 text-sm mb-3">{message.message}</p>
                  
                  {message.status === "new" && (
                    <button
                      onClick={() => markAsRead.mutate({ id: message.id })}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 mr-2"
                    >
                      <Eye size={14} className="inline mr-1" /> Mark as Read
                    </button>
                  )}

                  {message.status !== "replied" && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === message.id ? null : message.id)}
                      className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <Check size={14} className="inline mr-1" /> Mark as Replied
                    </button>
                  )}

                  {replyingTo === message.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply message (for reference only)"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReply(message.id, "Administrator")}
                          disabled={markAsReplied.isPending}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-60"
                        >
                          Send Reply
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
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
                className="text-xs text-blue-600 hover:text-blue-700 mt-2"
              >
                {selectedMessage === message.id ? "Hide" : "View"} Message
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
