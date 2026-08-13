import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, LifeBuoy, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const supportPhone = (import.meta.env.VITE_ADMIN_WHATSAPP || "").replace(/\D/g, "");
  const supportHref = supportPhone ? `https://wa.me/${supportPhone}` : "/help";
  const opensSupportChat = Boolean(supportPhone);

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>

          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            Page Not Found
          </h2>

          <p className="text-slate-600 mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          <nav aria-label="Helpful recovery links" className="mt-8 border-t border-slate-200 pt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Helpful links</p>
            <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setLocation("/help")} className="h-auto justify-start gap-2 border-slate-200 bg-white py-3 text-slate-700 hover:bg-slate-50">
                <LifeBuoy className="h-4 w-4 text-emerald-600" />
                Help Center
              </Button>
              <Button variant="outline" asChild className="h-auto justify-start gap-2 border-emerald-200 bg-emerald-50 py-3 text-emerald-800 hover:bg-emerald-100">
                <a
                  href={supportHref}
                  target={opensSupportChat ? "_blank" : undefined}
                  rel={opensSupportChat ? "noopener noreferrer" : undefined}
                  aria-label="Contact Support via WhatsApp"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  Contact Support
                </a>
              </Button>
            </div>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
