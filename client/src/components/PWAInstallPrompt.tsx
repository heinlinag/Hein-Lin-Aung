import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA] Service Worker registered:", reg.scope))
        .catch((err) => console.warn("[PWA] SW registration failed:", err));
    }

    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 7 days)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // Show iOS install guide after 3 seconds
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also check if app was installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 z-[9999] max-w-sm mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
          {/* Header gradient strip */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-green-500" />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* App icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                <img
                  src="/icon-192.png"
                  alt="StockDash"
                  className="w-8 h-8 object-contain"
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Install StockDash</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {isIOS
                    ? "Home screen မှာ add လုပ်ပြီး app လို သုံးနိုင်မယ်"
                    : "Phone home screen မှာ install လုပ်ပြီး app လို ဖွင့်နိုင်မယ်"}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/25"
              >
                <Download size={15} />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-green-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Smartphone size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">iPhone/iPad Install Guide</p>
                    <p className="text-xs text-gray-500">Home Screen မှာ Add လုပ်နည်း</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { step: "1", icon: "⬆️", text: "Browser ရဲ့ Share button ကို နှိပ်ပါ (Safari ရဲ့ bottom toolbar မှာ)" },
                  { step: "2", icon: "➕", text: "\"Add to Home Screen\" ကို ရွေးပါ" },
                  { step: "3", icon: "✅", text: "\"Add\" ကို နှိပ်ပြီး confirm လုပ်ပါ" },
                ].map(({ step, icon, text }) => (
                  <div key={step} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {step}
                    </div>
                    <div className="flex-1">
                      <span className="text-lg mr-1">{icon}</span>
                      <span className="text-sm text-gray-700">{text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                Safari browser ကိုသာ သုံးပါ (Chrome/Firefox မရပါ)
              </p>

              <button
                onClick={handleDismiss}
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-xl text-sm transition-all active:scale-95"
              >
                OK, Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
