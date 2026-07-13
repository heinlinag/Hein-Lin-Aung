import { useEffect, useState, useCallback, useRef } from "react";
import { ShieldX, Globe, Loader2, RefreshCw, WifiOff, ShieldCheck, MapPin } from "lucide-react";

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
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0a0f1e 60%, #050810 100%)" }}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-pulse" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-900/40 border border-blue-500/30 flex items-center justify-center">
            <Globe size={32} className="text-blue-400" />
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm font-semibold text-white">Verifying Location…</p>
          <p className="text-xs text-slate-500">Checking your region ({countdown}s)</p>
        </div>
        <Loader2 size={16} className="animate-spin text-blue-500" />
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
    VN: "🇻🇳", BD: "🇧🇩", PK: "🇵🇰", NL: "🇳🇱", RU: "🇷🇺",
  };
  const flag = flagMap[countryCode] ?? "🌍";
  const allowedRegions = [
    { flag: "🇲🇾", name: "Malaysia", code: "MY" },
    { flag: "🇲🇲", name: "Myanmar", code: "MM" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0a0f1e 60%, #050810 100%)" }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative max-w-md w-full space-y-5">
        {/* Shield icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-red-500/15 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-900/30 border border-red-500/30 flex items-center justify-center shadow-xl">
              <ShieldX size={36} className="text-red-400" />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#0a0f1e] border border-red-500/30 flex items-center justify-center">
                <WifiOff size={12} className="text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}>
          <div className="h-0.5 bg-gradient-to-r from-red-600 via-rose-500 to-orange-500" />
          <div className="p-6 space-y-5">
            {/* Status badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/25 text-red-300 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Access Restricted
              </span>
            </div>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Access Not Permitted</h1>
              <p className="text-xs text-slate-400 mt-1">Your current location is not authorised to use this system.</p>
            </div>

            {/* Detected location */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2">
                <MapPin size={12} className="text-slate-400" />
                <span className="text-sm">{flag}</span>
                <span className="text-sm font-semibold text-white">{country}</span>
                <span className="text-xs text-slate-500">({countryCode})</span>
                <span className="ml-1 w-2 h-2 rounded-full bg-red-500" />
              </div>
            </div>

            <div className="border-t border-white/6" />

            {/* Authorised regions */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-400" />
                Authorised Regions Only
              </p>
              <div className="grid grid-cols-2 gap-2">
                {allowedRegions.map((r) => (
                  <div
                    key={r.code}
                    className="flex items-center gap-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2.5"
                  >
                    <span className="text-xl">{r.flag}</span>
                    <div>
                      <p className="text-xs font-bold text-white">{r.name}</p>
                      <p className="text-[10px] text-emerald-400/70 font-mono">{r.code}</p>
                    </div>
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 text-center mt-3 leading-relaxed">
                This system is exclusively available to users in{" "}
                <span className="text-slate-300 font-semibold">Malaysia</span> and{" "}
                <span className="text-slate-300 font-semibold">Myanmar</span>.
              </p>
            </div>

            <div className="border-t border-white/6" />

            {/* VPN notice */}
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3.5 space-y-2">
              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                VPN / Proxy Detected?
              </p>
              <p className="text-xs text-amber-200/70 leading-relaxed">
                If you are physically in Malaysia or Myanmar, your{" "}
                <span className="text-amber-300 font-semibold">VPN or proxy</span> may be masking your real location. Disable it and retry.
              </p>
            </div>

            {/* Retry button */}
            <button
              onClick={retry}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl py-3 text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-900/40"
            >
              <RefreshCw size={14} />
              Retry After Disabling VPN
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-600">
          PP4 Manual Slitter · Stock Management System · Restricted Access
        </p>
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
