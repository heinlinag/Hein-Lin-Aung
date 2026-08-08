import { BellOff, Bell, X, ExternalLink } from "lucide-react";
import type { PushPermissionState } from "@/hooks/usePushNotifications";

interface Props {
  permissionState: PushPermissionState;
  onEnable: () => void;
  onDismiss: () => void;
}

/**
 * Shown when browser notification permission is "default" (not yet asked) or "denied".
 * Dismissed state is persisted in sessionStorage so it doesn't re-appear on every navigation.
 */
export function NotificationPermissionBanner({ permissionState, onEnable, onDismiss }: Props) {
  if (permissionState === "granted" || permissionState === "unsupported") return null;

  const isDenied = permissionState === "denied";

  return (
    <div
      style={{
        background: isDenied
          ? "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.10) 100%)"
          : "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)",
        borderBottom: isDenied ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(99,102,241,0.25)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      className="relative z-20 px-4 py-3"
    >
      {/* Accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: isDenied
            ? "linear-gradient(90deg, #ef4444, #f97316)"
            : "linear-gradient(90deg, #6366f1, #8b5cf6)",
        }}
      />

      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {/* Icon */}
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: isDenied
              ? "linear-gradient(135deg, #ef4444, #f97316)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: isDenied
              ? "0 4px 12px rgba(239,68,68,0.3)"
              : "0 4px 12px rgba(99,102,241,0.3)",
          }}
        >
          {isDenied ? <BellOff size={16} className="text-white" /> : <Bell size={16} className="text-white" />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>
            {isDenied ? "Notifications are blocked" : "Enable push notifications"}
          </p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.60)" }}>
            {isDenied
              ? "To receive alerts for new requests and messages, allow notifications in your browser settings."
              : "Get instant alerts for new requests, approvals, and messages — even when the app is closed."}
          </p>
        </div>

        {/* Action */}
        <div className="shrink-0 flex items-center gap-2">
          {isDenied ? (
            <a
              href="https://support.google.com/chrome/answer/3220216"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
              }}
            >
              How to enable
              <ExternalLink size={11} />
            </a>
          ) : (
            <button
              onClick={onEnable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
              }}
            >
              <Bell size={12} />
              Enable
            </button>
          )}
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 active:scale-95"
            aria-label="Dismiss"
          >
            <X size={14} style={{ color: "rgba(255,255,255,0.55)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
