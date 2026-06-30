import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaintenancePageProps {
  message?: string;
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-6 py-12">
      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-10 tracking-tight">
        Server maintenance !
      </h1>

      {/* Illustration */}
      <div className="mb-10 flex items-end justify-center gap-2">
        {/* Stack of books / server */}
        <div className="relative">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-20 h-5 rounded bg-gray-700 shadow-md" />
            <div className="w-22 h-5 rounded bg-gray-600 shadow-md" style={{ width: "5.5rem" }} />
            <div className="w-24 h-5 rounded bg-gray-500 shadow-md" />
            <div className="w-26 h-5 rounded bg-gray-700 shadow-md" style={{ width: "6.5rem" }} />
          </div>
          {/* Feather pen on top */}
          <div className="absolute -top-5 -left-2 text-gray-800 text-xl select-none" style={{ transform: "rotate(-20deg)" }}>
            🪶
          </div>
          {/* Bug/robot character */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-2xl select-none">
            🔧
          </div>
        </div>

        {/* Monitor */}
        <div className="ml-6 flex flex-col items-center">
          <div className="w-28 h-20 bg-gray-800 rounded-lg border-4 border-gray-700 flex items-center justify-center shadow-lg">
            <WifiOff size={28} className="text-gray-400" />
          </div>
          <div className="w-8 h-3 bg-gray-700 mx-auto" />
          <div className="w-16 h-2 bg-gray-600 rounded-sm" />
        </div>
      </div>

      {/* Main message */}
      <p className="text-center text-gray-700 text-base leading-relaxed mb-4 max-w-xs font-medium">
        ယခုအချိန်၌ server တွင် နည်းပညာပိုင်းဆိုင်ရာ အဆင့်မြှင့်တင်မှုများပြုလုပ်နေပြီး application အား ယာယီ အသုံးပြု၍မရနိုင်ပါ။
      </p>

      {/* Custom message if provided */}
      {message && (
        <p className="text-center text-orange-600 text-sm leading-relaxed mb-6 max-w-xs">
          {message}
        </p>
      )}

      {/* Default hint */}
      {!message && (
        <p className="text-center text-orange-500 text-sm leading-relaxed mb-8 max-w-xs">
          (ပျမ်းမျှကြာချိန် ၁၅ မိနစ်သာဘဖြပြီး လကုန်ရက်၏ ညဘက်ဆိုပါက နာရီဝက်ဆိုပါ ကြာမြင့်တတ်ပါတယ်။)
        </p>
      )}

      {/* Restart button */}
      <Button
        variant="outline"
        onClick={handleRestart}
        className="flex items-center gap-2 px-8 py-3 rounded-full text-gray-600 border-gray-300 bg-white hover:bg-gray-50 shadow-sm text-sm font-medium"
      >
        <RefreshCw size={16} />
        Restart Application
      </Button>
    </div>
  );
}
