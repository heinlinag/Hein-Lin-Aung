import { useEffect, useState } from "react";
import { ShieldX, Globe, Loader2 } from "lucide-react";

const ALLOWED_COUNTRIES = ["MY", "MM"]; // Malaysia, Myanmar

type GeoStatus = "loading" | "allowed" | "blocked";

interface GeoData {
  country_code: string;
  country_name: string;
}

function useGeoCheck() {
  const [status, setStatus] = useState<GeoStatus>("loading");
  const [country, setCountry] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(6000) });
        if (!res.ok) throw new Error("geo fetch failed");
        const data: GeoData = await res.json();
        if (cancelled) return;
        const code = data.country_code?.toUpperCase() ?? "";
        setCountry(data.country_name ?? code);
        setStatus(ALLOWED_COUNTRIES.includes(code) ? "allowed" : "blocked");
      } catch {
        // On error (timeout, network issue), allow access to avoid false blocks
        if (!cancelled) setStatus("allowed");
      }
    };

    check();
    return () => { cancelled = true; };
  }, []);

  return { status, country };
}

export default function GeoGuard({ children }: { children: React.ReactNode }) {
  const { status, country } = useGeoCheck();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <ShieldX size={40} className="text-red-400" />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
            {/* Globe badge */}
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-5">
              <Globe size={14} className="text-red-400" />
              <span className="text-xs font-medium text-red-300">Access Restricted</span>
            </div>

            {/* English */}
            <h1 className="text-xl font-bold text-white mb-2">Access Not Available</h1>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              This system is only accessible from <strong className="text-white">Malaysia</strong> and{" "}
              <strong className="text-white">Myanmar</strong>. Your current location ({country}) is not
              permitted to access this website.
            </p>

            {/* Divider */}
            <div className="border-t border-white/10 mb-6" />

            {/* Myanmar */}
            <h2 className="text-lg font-bold text-white mb-2">ဝင်ရောက်ခွင့် မရှိပါ</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              ဤ System သည် <strong className="text-white">မလေးရှား</strong> နှင့်{" "}
              <strong className="text-white">မြန်မာနိုင်ငံ</strong> တွင်သာ ဝင်ရောက် အသုံးပြုနိုင်သည်။
              သင်၏ လက်ရှိ တည်နေရာ ({country}) မှ ဤ Website ကို ဝင်ရောက်ခွင့် မရှိပါ။
            </p>

            {/* VPN Warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left">
              <p className="text-xs font-semibold text-amber-300 mb-1">⚠ VPN Notice / VPN သတိပေးချက်</p>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                <strong>EN:</strong> If you are using a VPN, you may experience difficulty accessing this website. Please disable your VPN and try again from Malaysia or Myanmar.
              </p>
              <p className="text-xs text-amber-200/80 leading-relaxed mt-1">
                <strong>MM:</strong> VPN ခံအသုံးပြုနေပါက ဤ Website ကို ဝင်ရောက်ရန် အခက်အခဲ ရှိနိုင်သည်။ VPN ကို ပိတ်ပြီး မလေးရှား သို့မဟုတ် မြန်မာနိုင်ငံမှ ထပ်မံ ကြိုးစားပါ။
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-4">
            PP4 Manual Slitter Stock Management System
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
