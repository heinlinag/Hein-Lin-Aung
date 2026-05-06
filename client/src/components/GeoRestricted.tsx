import { useEffect, useState, useCallback } from "react";
import { ShieldX, Globe, Loader2, RefreshCw, WifiOff, AlertTriangle, Wifi } from "lucide-react";

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
      parse: (d: Record<string, string>) => ({ countryCode: d.country_code?.toUpperCase() ?? "", countryName: d.country_name ?? d.country_code ?? "Unknown" }),
    },
    {
      url: "https://ip-api.com/json/?fields=countryCode,country",
      parse: (d: Record<string, string>) => ({ countryCode: d.countryCode?.toUpperCase() ?? "", countryName: d.country ?? d.countryCode ?? "Unknown" }),
    },
    {
      url: "https://ipwho.is/",
      parse: (d: Record<string, string>) => ({ countryCode: d.country_code?.toUpperCase() ?? "", countryName: d.country ?? d.country_code ?? "Unknown" }),
    },
  ];
  let lastError: Error | null = null;
  for (const api of apis) {
    try {
      const res = await fetch(api.url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as Record<string, string>;
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

  const check = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await detectCountry();
      setGeoResult(result);
      setStatus(ALLOWED_COUNTRIES.includes(result.countryCode) ? "allowed" : "blocked");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { check(); }, [check, attemptCount]);

  const retry = useCallback(() => setAttemptCount(c => c + 1), []);

  return { status, geoResult, retry };
}

export default function GeoGuard({ children }: { children: React.ReactNode }) {
  const { status, geoResult, retry } = useGeoCheck();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center">
              <Globe size={28} className="text-slate-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Loader2 size={12} className="animate-spin text-blue-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">Verifying access location…</p>
            <p className="text-xs text-slate-500 mt-1">ကင်ရာက်ခွင့် သစ်ဆေးနေသည်…</p>
          </div>
        </div>
      </div>
    );
  }

  // On network error, allow access (fail-open)
  if (status === "error") {
    return <>{children}</>;
  }

  if (status === "blocked") {
    const country = geoResult?.countryName ?? "Unknown";
    const countryCode = geoResult?.countryCode ?? "??";
    const flagMap: Record<string, string> = { US: "🇺🇸", SG: "🇸🇬", TH: "🇹🇭", ID: "🇮🇩", CN: "🇨🇳", JP: "🇯🇵", KR: "🇰🇷", IN: "🇮🇳", AU: "🇦🇺", GB: "🇬🇧" };
    const flag = flagMap[countryCode] ?? "🌍";

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Header Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                <ShieldX size={44} className="text-red-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 border border-red-500/30 flex items-center justify-center">
                <WifiOff size={14} className="text-red-400" />
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />
            <div className="p-7">
              {/* Badge */}
              <div className="flex justify-center mb-5">
                <div className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-full px-4 py-1.5">
                  <Globe size={13} className="text-red-400" />
                  <span className="text-xs font-semibold text-red-300 tracking-wide uppercase">Access Restricted</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex justify-center mb-5">
                <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5">
                  <span className="text-lg">{flag}</span>
                  <span className="text-xs font-mono text-slate-300">{country} ({countryCode})</span>
                </div>
              </div>

              {/* English */}
              <div className="mb-5">
                <h1 className="text-lg font-bold text-white mb-2 text-center">Access Not Permitted</h1>
                <p className="text-sm text-slate-300 leading-relaxed text-center">
                  This system is restricted to users in{" "}
                  <span className="font-semibold text-white bg-green-500/20 px-1.5 py-0.5 rounded">🇲🇾 Malaysia</span>{" "}
                  and{" "}
                  <span className="font-semibold text-white bg-yellow-500/20 px-1.5 py-0.5 rounded">🇲🇲 Myanmar</span>{" "}
                  only.
                </p>
              </div>

              <div className="border-t border-white/10 mb-5" />

              {/* Myanmar */}
              <div className="mb-5">
                <h2 className="text-base font-bold text-white mb-2 text-center">ကင်ရာက်ခွင့် မရှိပဪbမရှိပဪb</h2>
                <p className="text-sm text-slate-300 leading-relaxed text-center">
                  ဤ System သည်{" "}
                  <span className="font-semibold text-white">မလေးရှား 🇲🇾</span>{" "}
                  နှင််{" "}
                  <span className="font-semibold text-white">မြန်မာနိုင်ငံ 🇲🇲</span>{" "}
                  တွင်သာ ကင်ရာက် အသုံပြုနိုင်သည်။
                </p>
              </div>

              {/* VPN Warning */}
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-300 mb-1.5">⚠ VPN Notice / VPN သတိပေးချက်ချက်တ်</p>
                    <p className="text-xs text-amber-200/80 leading-relaxed mb-1.5">
                      <strong className="text-amber-300">EN:</strong> Disable your VPN and reconnect from Malaysia or Myanmar to access this system.
                    </p>
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      <strong className="text-amber-300">MM:</strong> VPN ခ်အသုံပြုနေပဪbက ပိတ်ပြီး မလေးရှား သိုမြက်တ် မြန်မာနိုင်ငံမှ ထပ်မံ ကြိုးသာပဪb။
                    </p>
                  </div>
                </div>
              </div>

              {/* Retry */}
              <button
                onClick={retry}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                <RefreshCw size={14} />
                Retry / ထပ်မံ သစ်ဆေးမည်
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <Wifi size={12} className="text-slate-600" />
            <p className="text-center text-xs text-slate-500">PP4 Manual Slitter · Stock Management System</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
