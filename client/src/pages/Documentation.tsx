import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import {
  FileText, Download, BookOpen, Shield, HelpCircle, ChevronRight,
  Eye, Users, Settings, Zap, ArrowRight, Sparkles, ExternalLink,
} from "lucide-react";

const EMPLOYEE_GUIDE_URL = "/manus-storage/StockDash_Employee_Guide_v6.2.5_a77c18c3.pdf";
const ADMIN_GUIDE_URL = "/manus-storage/Admin_Documentation_v3.1.0_4b46e34e.pdf";

const ANIM_STYLES = `
@keyframes docSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes docFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes docFloatOrb {
  0%, 100% { transform: translateY(0) scale(1); }
  50%  { transform: translateY(-12px) scale(1.03); }
}
.doc-slide-up { animation: docSlideUp 0.55s cubic-bezier(0.22,0.61,0.36,1) both; }
.doc-fade-in  { animation: docFadeIn 0.5s cubic-bezier(0.22,0.61,0.36,1) both; }
`;

type Tab = "employee" | "admin";

const employeeGuideContent = [
  {
    icon: <Zap size={18} className="text-white" />,
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    glow: "rgba(99,102,241,0.2)",
    accentRgb: "99,102,241",
    title: "Getting Started",
    sections: [
      "System Requirements",
      "Accessing the System",
      "Login Access — Level 1, 1.1 & 2",
      "1-Hour Session & Re-login",
      "User Profile Dropdown",
      "Geo-Restriction (Malaysia & Myanmar only)",
    ],
  },
  {
    icon: <Settings size={18} className="text-white" />,
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    glow: "rgba(16,185,129,0.2)",
    accentRgb: "16,185,129",
    title: "Core Features",
    sections: [
      "Home Dashboard & Animated Stats",
      "Add Stock NPRM — AI Label Scanner & Manual Entry",
      "Scanner Review — MASTERCARD PB Validation & Duplicate Protection",
      "Stock History — Low-Stock Alerts & Filters",
      "NPRM Modify Order — Pending / In Process / Approved",
      "Process Approve Workflow (Level 1.1)",
      "QR Scanner — Tracking ID Verification",
      "Customer Sample — Request & Track Delivery",
      "Messages — Real-time Direct Chat",
    ],
  },
  {
    icon: <HelpCircle size={18} className="text-white" />,
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    glow: "rgba(245,158,11,0.2)",
    accentRgb: "245,158,11",
    title: "Support & Navigation",
    sections: [
      "FAQ — 42+ Q&A across 8 categories",
      "System Status — Real-time monitoring",
      "Notifications — Browser Push Alerts",
      "Help Center — Guides, Troubleshooting & Contact",
      "Troubleshooting & Contact Administrator",
    ],
  },
];

const adminGuideContent = [
  {
    icon: <Shield size={18} className="text-white" />,
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
    glow: "rgba(239,68,68,0.2)",
    accentRgb: "239,68,68",
    title: "Admin Access",
    sections: [
      "Admin Login via /admin route",
      "Password-Protected Admin Panel",
      "Admin Panel Dashboard & Summary Stats",
      "Level 1 / 1.1 / 2 Role Management",
      "Role-Based Feature Access Control",
    ],
  },
  {
    icon: <Users size={18} className="text-white" />,
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    glow: "rgba(139,92,246,0.2)",
    accentRgb: "139,92,246",
    title: "Management",
    sections: [
      "Employee Management (Add / Edit / Delete)",
      "Orders Management & Export (Excel / PDF)",
      "Approval Workflow — Approve / Cancel / Process",
      "Deleted Logs & Full Audit Trail",
      "Push Notification Subscriptions",
      "QR Scan History & Verification Logs",
    ],
  },
  {
    icon: <Settings size={18} className="text-white" />,
    gradient: "linear-gradient(135deg, #0891b2, #0e7490)",
    glow: "rgba(8,145,178,0.2)",
    accentRgb: "8,145,178",
    title: "Operations",
    sections: [
      "Real-Time System Statistics",
      "Geo-Restriction (Malaysia & Myanmar only)",
      "System Status Monitoring & Uptime",
      "A4 Label Generation & Print Management",
      "Best Practices & Maintenance",
      "Troubleshooting & WhatsApp Support",
    ],
  },
];

export default function Documentation() {
  const [activeTab, setActiveTab] = useState<Tab>("employee");
  const [, navigate] = useLocation();

  const styleInjected = useRef(false);
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = ANIM_STYLES;
    document.head.appendChild(el);
  }, []);

  const isEmployee = activeTab === "employee";
  const guideContent = isEmployee ? employeeGuideContent : adminGuideContent;
  const guideURL = isEmployee ? EMPLOYEE_GUIDE_URL : ADMIN_GUIDE_URL;
  const guideTitle = isEmployee ? "Employee User Guide" : "Admin Documentation";
  const guideFile = isEmployee ? "StockDash_User_Guide_v6.2.5.pdf" : "Admin_Documentation_v3.1.0.pdf";
  const accentGradient = isEmployee
    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
    : "linear-gradient(135deg, #ef4444, #dc2626)";
  const accentGlow = isEmployee ? "rgba(99,102,241,0.25)" : "rgba(239,68,68,0.25)";

  return (
    <AppLayout>
      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #1e3a5f 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)", animation: "docFloatOrb 9s ease-in-out infinite" }} />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)", animation: "docFloatOrb 13s ease-in-out 2s infinite" }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
        </div>
        <div className="relative px-4 lg:px-8 py-10 lg:py-14">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-4 doc-slide-up">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shrink-0"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <BookOpen size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-indigo-200"
                    style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
                    v6.2.5
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-emerald-200"
                    style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    Updated Jul 2026
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight" style={{ fontFamily: "Lora, serif" }}>
                  Documentation
                </h1>
                <p className="text-white/50 text-sm mt-1.5 max-w-lg">
                  Complete guides for the PP4 Manual Slitter Stock Management System
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6 doc-fade-in" style={{ animationDelay: "0.15s" }}>
              {[
                { label: "FAQ", href: "/faq", icon: <HelpCircle size={13} /> },
                { label: "Help Center", href: "/help", icon: <Sparkles size={13} /> },
                { label: "System Status", href: "/status", icon: <Zap size={13} /> },
              ].map(link => (
                <button key={link.href} onClick={() => navigate(link.href)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {link.icon}
                  {link.label}
                  <ChevronRight size={11} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-4 lg:px-8 pt-6 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-2 p-1.5 rounded-2xl w-fit"
            style={{ background: "rgba(241,245,249,0.8)", border: "1px solid rgba(226,232,240,0.6)" }}>
            {[
              { key: "employee" as Tab, label: "Employee Guide", icon: <FileText size={15} />, gradient: "linear-gradient(135deg, #6366f1, #4f46e5)" },
              { key: "admin" as Tab, label: "Admin Guide", icon: <Shield size={15} />, gradient: "linear-gradient(135deg, #ef4444, #dc2626)" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={activeTab === tab.key ? {
                  background: tab.gradient,
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                } : { color: "#64748b" }}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Download card */}
          <div className="relative rounded-2xl overflow-hidden doc-slide-up"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: `0 8px 32px ${accentGlow}, 0 2px 8px rgba(0,0,0,0.04)`,
            }}>
            <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: accentGradient }} />
            <div className="p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                    style={{ background: accentGradient, boxShadow: `0 8px 24px ${accentGlow}` }}>
                    <FileText size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{guideTitle}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {isEmployee
                        ? "Complete v6.2.5 guide — AI Label Scanner, Manual Entry, Stock, Requests, QR Scanner & more"
                        : "Complete guide for administrators — Management, Roles, Audit & Operations"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-gray-500"
                        style={{ background: "rgba(241,245,249,0.8)" }}>
                        PDF · {isEmployee ? "v6.2.5" : "v3.1.0"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                  <a href={guideURL} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: "rgba(241,245,249,0.8)", color: "#475569", border: "1px solid rgba(226,232,240,0.8)" }}>
                    <Eye size={16} />
                    View PDF
                    <ExternalLink size={13} />
                  </a>
                  <a href={guideURL} download={guideFile} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: accentGradient, boxShadow: `0 4px 16px ${accentGlow}` }}>
                    <Download size={16} />
                    Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Content overview cards */}
          <div>
            <div className="flex items-center gap-2 mb-4 doc-fade-in">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: accentGradient, boxShadow: `0 4px 12px ${accentGlow}` }}>
                <BookOpen size={14} className="text-white" />
              </div>
              <h3 className="text-sm font-black text-gray-900">Contents Overview</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {guideContent.map((section, idx) => (
                <div key={idx}
                  className="relative rounded-2xl overflow-hidden doc-fade-in"
                  style={{
                    animationDelay: `${0.1 + idx * 0.08}s`,
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    boxShadow: `0 4px 20px ${section.glow}, 0 1px 4px rgba(0,0,0,0.04)`,
                  }}>
                  <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: section.gradient }} />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                        style={{ background: section.gradient, boxShadow: `0 4px 12px ${section.glow}` }}>
                        {section.icon}
                      </div>
                      <h4 className="font-black text-gray-900 text-sm">{section.title}</h4>
                    </div>
                    <ul className="space-y-2">
                      {section.sections.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ChevronRight size={13} className="shrink-0 mt-0.5"
                            style={{ color: `rgba(${section.accentRgb},0.7)` }} />
                          <span className="text-xs text-gray-600 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-2xl p-5 doc-fade-in" style={{
            animationDelay: "0.3s",
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(226,232,240,0.6)",
          }}>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Quick Links</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "FAQ", href: "/faq", color: "#8b5cf6" },
                { label: "Help Center", href: "/help", color: "#0891b2" },
                { label: "System Status", href: "/status", color: "#10b981" },
                { label: "Add Stock NPRM", href: "/submit-order", color: "#6366f1" },
                { label: "Stock History", href: "/stock-history", color: "#f59e0b" },
              ].map(link => (
                <button key={link.href} onClick={() => navigate(link.href)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                  style={{ background: `${link.color}15`, color: link.color, border: `1px solid ${link.color}25` }}>
                  {link.label}
                  <ArrowRight size={11} />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
