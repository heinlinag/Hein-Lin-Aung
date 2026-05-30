import { useEffect, useState, useCallback, useRef } from "react";
import {
  ShieldX, Globe, Loader2, RefreshCw, WifiOff,
  AlertTriangle, Wifi, Lock, MapPin, Info, XCircle
} from "lucide-react";

const ALLOWED_COUNTRIES = ["MY", "MM"]; // Malaysia, Myanmar

type GeoStatus = "loading" | "allowed" | "blocked" | "error";

interface GeoResult {
  countryCode: string;
  countryName: string;
}

async function detectCountry(): Promise<GeoResult> {
  const apis = [
    {
      url: "https://ipapi.co/json/",
      parse: (d: Record<string, string>) => ({
        countryCode: d.country_code?.toUpperCase() ?? "",
        countryName: d.country_name ?? d.country_code ?? "Unknown",
      }),
    },
    {
      url: "https://ip-api.com/json/?fields=countryCode,country",
      parse: (d: Record<string, string>) => ({
        countryCode: d.countryCode?.toUpperCase() ?? "",
        countryName: d.country ?? d.countryCode ?? "Unknown",
      }),
    },
    {
      url: "https://ipwho.is/",
      parse: (d: Record<string, string>) => ({
        countryCode: d.country_code?.toUpperCase() ?? "",
        countryName: d.country ?? d.country_code ?? "Unknown",
      }),
    },
  ];
  let lastError: Error | null = null;
  for (const api of apis) {
    try {
      const res = await fetch(api.url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Record<string, string>;
      const result = api.parse(data);
      if (result.countryCode && result.countryCode.length === 2) return result;
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw lastError ?? new Error("All geo APIs failed");
}

function useGeoCheck() {
  const [status, setStatus] = useState<GeoStatus>("loading");
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    setCountdown(30);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const check = useCallback(async () => {
    setStatus("loading");
    startCountdown();
    try {
      const result = await detectCountry();
      setGeoResult(result);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setStatus(ALLOWED_COUNTRIES.includes(result.countryCode) ? "allowed" : "blocked");
    } catch {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setStatus("error");
    }
  }, [startCountdown]);

  useEffect(() => {
    check();
  }, [check, attemptCount]);
  useEffect(
    () => () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    },
    []
  );

  const retry = useCallback(() => setAttemptCount((c) => c + 1), []);

  return { status, geoResult, retry, countdown };
}

// ── Loading Screen ──────────────────────────────────────────────────────────
function LoadingScreen({ countdown }: { countdown: number }) {
  const pct = countdown / 30;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex flex-col items-center gap-5 text-slate-400">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={countdown > 10 ? "#3b82f6" : "#f97316"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="flex flex-col items-center justify-center z-10">
            <Globe size={16} className="text-slate-400 mb-0.5" />
            <span className={`text-2xl font-bold leading-none tabular-nums ${countdown > 10 ? "text-white" : "text-orange-400"}`}>
              {countdown}
            </span>
            <span className="text-[9px] text-slate-500 leading-none mt-0.5">sec</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-200">Verifying your access location…</p>
          <p className="text-xs text-slate-500 mt-1">Please wait while we check your region</p>
        </div>
        <Loader2 size={14} className="animate-spin text-blue-400" />
      </div>
    </div>
  );
}

// ── Blocked Screen ───────────────────────────────────────────────────────────
function BlockedScreen({ country, countryCode, retry }: { country: string; countryCode: string; retry: () => void }) {
  const flagMap: Record<string, string> = {
    US: "🇺🇸", SG: "🇸🇬", TH: "🇹🇭", ID: "🇮🇩", CN: "🇨🇳",
    JP: "🇯🇵", KR: "🇰🇷", IN: "🇮🇳", AU: "🇦🇺", GB: "🇬🇧",
    DE: "🇩🇪", FR: "🇫🇷", CA: "🇨🇦", BR: "🇧🇷", PH: "🇵🇭",
  };
  const flag = flagMap[countryCode] ?? "🌍";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full space-y-4">

        {/* ── Hero Icon ── */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: "2.5s" }} />
            <div className="absolute inset-2 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-600/20 to-red-900/30 border-2 border-red-500/40 flex items-center justify-center shadow-2xl shadow-red-900/50">
              <ShieldX size={40} className="text-red-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 border-2 border-red-500/40 flex items-center justify-center">
              <WifiOff size={13} className="text-red-400" />
            </div>
          </div>
        </div>

        {/* ── Main Card ── */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-red-700 via-red-500 to-orange-500" />

          <div className="p-7 space-y-5">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-full px-4 py-1.5">
                <Lock size={12} className="text-red-400" />
                <span className="text-xs font-bold text-red-300 tracking-widest uppercase">Access Restricted</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">
                Access Not Permitted
              </h1>
              <p className="text-sm text-slate-400">
                Your current location is not authorised to use this system.
              </p>
            </div>

            {/* Detected location */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2">
                <MapPin size={13} className="text-slate-400" />
                <span className="text-sm font-mono text-slate-300">
                  {flag} {country} <span className="text-slate-500">({countryCode})</span>
                </span>
                <XCircle size={13} className="text-red-400 ml-1" />
              </div>
            </div>

            {/* Allowed countries */}
            <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className="text-green-400" />
                <p className="text-xs font-bold text-green-300 uppercase tracking-wide">Authorised Regions Only</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { flag: "🇲🇾", name: "Malaysia", code: "MY" },
                  { flag: "🇲🇲", name: "Myanmar", code: "MM" },
                ].map((c) => (
                  <div key={c.code} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <span className="text-xl">{c.flag}</span>
                    <div>
                      <p className="text-xs font-semibold text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.code}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">
                This system is exclusively available to users located in <strong className="text-white">Malaysia</strong> and <strong className="text-white">Myanmar</strong>.
                Access from all other countries is blocked for security and compliance reasons.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-white/8" />

            {/* VPN Warning — main focus */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl overflow-hidden">
              <div className="bg-amber-500/15 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">VPN Detected — Action Required</p>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-amber-100 leading-relaxed font-medium">
                  If you are physically located in Malaysia or Myanmar but are seeing this page, your <strong className="text-amber-300">VPN or proxy service</strong> is masking your real IP address and reporting a different country.
                </p>
                <div className="space-y-2">
                  {[
                    {
                      icon: "🚫",
                      title: "VPN Blocks Access",
                      desc: "Using a VPN changes your detected location to another country, which triggers this access restriction — even if you are physically in an allowed region.",
                    },
                    {
                      icon: "⚠️",
                      title: "Proxy Services Are Also Affected",
                      desc: "Browser extensions, corporate proxies, and anonymising tools that route your traffic through overseas servers will also cause this block.",
                    },
                    {
                      icon: "✅",
                      title: "How to Fix It",
                      desc: "Disconnect your VPN or proxy completely, then tap Retry below. Your real IP address must be from Malaysia or Myanmar to gain access.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                      <span className="text-base mt-0.5 flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white mb-0.5">{item.title}</p>
                        <p className="text-xs text-amber-200/70 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2.5 bg-blue-500/8 border border-blue-500/20 rounded-xl p-3.5">
              <Info size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-300/80 leading-relaxed">
                If you believe this is an error and you are not using a VPN, please contact your system administrator with your IP address and country details.
              </p>
            </div>

            {/* Retry button */}
            <button
              onClick={retry}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 border border-slate-500/50 text-white rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95 shadow-lg"
            >
              <RefreshCw size={15} />
              Retry After Disabling VPN
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <Wifi size={11} className="text-slate-600" />
          <p className="text-center text-xs text-slate-600">
            PP4 Manual Slitter · Stock Management System · Restricted Access
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Guard ───────────────────────────────────────────────────────────────
export default function GeoGuard({ children }: { children: React.ReactNode }) {
  const { status, geoResult, retry, countdown } = useGeoCheck();

  if (status === "loading") return <LoadingScreen countdown={countdown} />;
  if (status === "error") return <>{children}</>;
  if (status === "blocked") {
    return (
      <BlockedScreen
        country={geoResult?.countryName ?? "Unknown"}
        countryCode={geoResult?.countryCode ?? "??"}
        retry={retry}
      />
    );
  }
  return <>{children}</>;
}
