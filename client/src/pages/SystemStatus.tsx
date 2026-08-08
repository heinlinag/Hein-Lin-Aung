import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import AppLayout from '@/components/AppLayout';
import { Activity, Server, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface SystemInfo {
  uptime: string;
  status: 'operational' | 'degraded' | 'down';
  lastUpdate: string;
  responseTime: number;
}

interface StatusUpdate {
  date: string;
  title: string;
  description: string;
  type: 'maintenance' | 'update' | 'incident' | 'resolved';
}

export default function SystemStatus() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    uptime: 'Loading...',
    status: 'operational',
    lastUpdate: new Date().toLocaleString(),
    responseTime: 0,
  });

  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState<any[]>([]);
  const statusQuery = trpc.system.status.useQuery();

  // Fetch real system status data
  useEffect(() => {
    if (statusQuery.data) {
      setSystemInfo({
        uptime: statusQuery.data.uptime.formatted,
        status: (statusQuery.data.server.status as 'operational' | 'degraded' | 'down'),
        lastUpdate: new Date(statusQuery.data.timestamp).toLocaleString(),
        responseTime: statusQuery.data.server.responseTime,
      });
      setComponents(statusQuery.data.components);
      setLoading(false);
    }
  }, [statusQuery.data]);

  const recentUpdates: StatusUpdate[] = [
    {
      date: 'Jul 13, 2026',
      title: 'Version Updated to v6.2.5',
      description: 'System stabilized at checkpoint b7f2f3fb. All core features intact: Stock History, Approval Center, NPRM Modify Order workflow, Auto-Delete for Out-of-Stock orders, QR Scan History, Chat, Announcements, and Geo-IP access restriction.',
      type: 'update',
    },
    {
      date: 'May 28, 2026',
      title: 'Version Updated to v3.1.0 — UI/UX Next Level Upgrade',
      description: 'Add Stock NPRM page, Purchase Order modals in Stock History, and A4 Label component upgraded to next-level premium design. Add Stock NPRM is now fully compact and responsive across Mobile, Tablet, Laptop, and Desktop. Documentation, FAQ, and System Status pages updated to reflect all current features.',
      type: 'update',
    },
    {
      date: 'May 28, 2026',
      title: 'A4 Label Premium Print Design',
      description: 'A4 Label upgraded to premium black-and-white print layout: corner registration marks, solid black section headers, inverted black QR block, monospace BQ formula, barcode with tracking ID, and verification footer badge.',
      type: 'update',
    },
    {
      date: 'May 28, 2026',
      title: 'Add Stock NPRM — Compact Responsive Layout',
      description: 'Add Stock NPRM page redesigned to be compact across all device sizes. Width and Length inputs now stack vertically on mobile. Spacing, padding, and gaps reduced for a cleaner, more efficient form experience.',
      type: 'update',
    },
    {
      date: 'May 28, 2026',
      title: 'Purchase Order Modals — Premium Gradient Design',
      description: 'All three Purchase Order modal levels (Level 2: Emerald, Level 1.1: Purple/Violet, Level 1: Orange/Amber) upgraded with gradient headers, backdrop-blur overlays, zoom-in animations, and gradient confirm/cancel buttons.',
      type: 'update',
    },
    {
      date: 'May 18, 2026',
      title: 'Level 2 Stock History Updated to Match Level 1/1.1 Design',
      description: 'Level 2 users now see the same comprehensive Purchase Order dialog with full order context, quantity breakdown, and pending requests count. All user levels now have consistent terminology and UI/UX.',
      type: 'update',
    },
    {
      date: 'May 18, 2026',
      title: 'Version Updated to v3.0.0',
      description: 'All version references across Login, Home, and Documentation pages updated to reflect the latest checkpoint with Level 2 Stock History improvements and unified Purchase Order terminology.',
      type: 'update',
    },
    {
      date: 'May 7, 2026',
      title: 'User Profile Dropdown & FAQ Quick Access',
      description: 'Header badge now shows "User Profile" and opens a dropdown with employee info, Admin Panel (Level 2 only with password), Documentation, FAQ, System Status, and Logout. FAQ page added at /faq with 42 Q&A pairs.',
      type: 'update',
    },
    {
      date: 'May 7, 2026',
      title: 'Admin Panel Password Protection',
      description: 'Admin Panel now requires a password dialog from the User Profile dropdown. Level 1 and Level 1.1 users are blocked from /admin entirely. Direct URL access is redirected to Home.',
      type: 'update',
    },
    {
      date: 'May 7, 2026',
      title: 'Login Page Animations',
      description: 'Tab switch (Employee ↔ Admin) now has a slide animation. Employee and Admin login success show a full-screen animated overlay before navigating to the dashboard.',
      type: 'update',
    },
    {
      date: 'May 7, 2026',
      title: 'Action History — Level 1.1 Process Info Always Visible',
      description: 'NPRM Modify Order request cards now always show Level 1.1 process-approved info (name, qty, timestamp) regardless of final status (pending / approved / cancelled).',
      type: 'update',
    },
    {
      date: 'May 7, 2026',
      title: 'Cannot Cancel Processed Request',
      description: 'Level 1 users can no longer cancel a request that has been process-approved by a Level 1.1 user. A dialog with a WhatsApp Contact Administrator button is shown instead.',
      type: 'update',
    },
    {
      date: 'May 6, 2026',
      title: 'Access Restricted — 30s Countdown',
      description: 'Geo-restriction loading screen now shows a 30→0 countdown ring. Ring depletes as time runs out and turns orange at ≤10s. Countdown stops immediately when Geo API responds.',
      type: 'update',
    },
    {
      date: 'May 5, 2026',
      title: 'Level 1.1 User Role Released',
      description: 'New intermediate user role Level 1.1 added. Requests submitted by Level 1.1 users are automatically process-approved (In Process) upon submission. Level 1.1 users can also manually process-approve Level 1 requests from the NPRM Modify Order.',
      type: 'update',
    },
    {
      date: 'May 5, 2026',
      title: 'NPRM Modify Order — Extra Fields Display',
      description: 'Used Update request cards in the NPRM Modify Order now display Master Card, Board Size (W×L mm), and Scores fields for full job traceability.',
      type: 'update',
    },
    {
      date: 'May 3, 2026',
      title: 'Master Card, Board Size & Scores Fields',
      description: 'Used Update dialog now includes Master Card, Board Size (W×L mm), and Scores input fields. These are recorded in Usage History and shown in NPRM Modify Order request cards.',
      type: 'update',
    },
    {
      date: 'May 1, 2026',
      title: 'Process Approve System (Level 1.1)',
      description: 'Level 1.1 users can process-approve Level 1 requests from the NPRM Modify Order. Process Approve dialog supports optional quantity override. Approved quantity is shown on request cards.',
      type: 'update',
    },
    {
      date: 'April 28, 2026',
      title: 'Admin Dashboard Stats & Export',
      description: 'Admin Panel now shows real-time summary statistics. Orders can be exported to PDF or Excel directly from the Orders tab.',
      type: 'update',
    },
    {
      date: 'April 25, 2026',
      title: 'Push Notifications Enabled',
      description: 'Browser push notifications now active for new pending requests (Level 2 users), new order submissions, and admin login events.',
      type: 'update',
    },
    {
      date: 'April 20, 2026',
      title: 'Two-Level Approval Workflow Released',
      description: 'Level 1 & Level 2 approval system fully operational. Level 1 users submit requests; Level 2 users approve or cancel from the NPRM Modify Order.',
      type: 'update',
    },
  ];

  const maintenanceSchedule = [
    {
      date: 'June 2, 2026',
      time: '02:00 - 03:00 UTC',
      description: 'Scheduled database optimization',
    },
    {
      date: 'June 9, 2026',
      time: '03:00 - 04:00 UTC',
      description: 'Server security patches and updates',
    },
  ];

  const statusColor = {
    operational: 'text-green-600',
    degraded: 'text-yellow-600',
    down: 'text-red-600',
  };

  const statusBg = {
    operational: 'bg-green-50 border-green-200',
    degraded: 'bg-yellow-50 border-yellow-200',
    down: 'bg-red-50 border-red-200',
  };

  const statusIcon = {
    operational: <CheckCircle size={24} className="text-green-600" />,
    degraded: <AlertCircle size={24} className="text-yellow-600" />,
    down: <AlertCircle size={24} className="text-red-600" />,
  };

  const updateTypeColor = {
    maintenance: 'bg-blue-100 text-blue-800',
    update: 'bg-green-100 text-green-800',
    incident: 'bg-red-100 text-red-800',
    resolved: 'bg-purple-100 text-purple-800',
  };

  return (
    <AppLayout>
      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #0f172a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
        </div>
        <div className="relative px-4 lg:px-8 py-10 lg:py-14">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shrink-0"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Activity size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full text-emerald-200"
                    style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {systemInfo.status === "operational" ? "All Systems Operational" : systemInfo.status === "degraded" ? "Degraded" : "System Down"}
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight" style={{ fontFamily: "Lora, serif" }}>
                  System Status
                </h1>
                <p className="text-white/50 text-sm mt-1.5">Last updated: {systemInfo.lastUpdate}</p>
              </div>
            </div>
            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: "Uptime", value: systemInfo.uptime },
                { label: "Response", value: `${systemInfo.responseTime}ms` },
                { label: "Version", value: "6.2.5" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <p className="text-white font-black text-lg leading-none">{stat.value}</p>
                  <p className="text-white/40 text-[10px] mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Overall Status Card */}
          <div className="relative rounded-2xl overflow-hidden"
            style={{
              background: systemInfo.status === "operational"
                ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))"
                : systemInfo.status === "degraded"
                ? "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.05))"
                : "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.05))",
              backdropFilter: "blur(20px)",
              border: systemInfo.status === "operational"
                ? "1px solid rgba(16,185,129,0.2)"
                : systemInfo.status === "degraded"
                ? "1px solid rgba(245,158,11,0.2)"
                : "1px solid rgba(239,68,68,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
            }}>
            <div className="absolute top-0 inset-x-0 h-0.5"
              style={{ background: systemInfo.status === "operational" ? "linear-gradient(90deg, #10b981, #059669)" : systemInfo.status === "degraded" ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #ef4444, #dc2626)" }} />
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: systemInfo.status === "operational" ? "rgba(16,185,129,0.15)" : systemInfo.status === "degraded" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)" }}>
                {statusIcon[systemInfo.status]}
              </div>
              <div>
                <p className={`text-lg font-black ${statusColor[systemInfo.status]}`}>
                  System {systemInfo.status.charAt(0).toUpperCase() + systemInfo.status.slice(1)}
                </p>
                <p className="text-gray-500 text-sm">
                  {systemInfo.status === "operational" && "All systems are running normally"}
                  {systemInfo.status === "degraded" && "Some services experiencing issues"}
                  {systemInfo.status === "down" && "System currently unavailable"}
                </p>
              </div>
            </div>
          </div>

          {/* System Components */}
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-4">System Components</h3>
            {components.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {components.map((component, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.9)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}>
                    <div className="absolute top-0 inset-x-0 h-0.5"
                      style={{ background: component.status === "operational" ? "linear-gradient(90deg, #10b981, #059669)" : component.status === "degraded" ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #ef4444, #dc2626)" }} />
                    <div className="p-4 flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm">{component.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{component.responseTime}ms</span>
                        <div className={`w-2 h-2 rounded-full ${component.status === "operational" ? "bg-emerald-500 animate-pulse" : component.status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
                        <span className={`text-xs font-bold ${component.status === "operational" ? "text-emerald-600" : component.status === "degraded" ? "text-amber-600" : "text-red-600"}`}>
                          {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl p-8 text-center"
                style={{ background: "rgba(241,245,249,0.6)", border: "1px solid rgba(226,232,240,0.6)" }}>
                <p className="text-gray-400">Loading system components...</p>
              </div>
            )}
          </div>

          {/* Recent Updates */}
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-4">Recent Updates</h3>
            <div className="space-y-3">
              {recentUpdates.map((update, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}>
                  <div className="absolute top-0 inset-x-0 h-0.5"
                    style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${updateTypeColor[update.type]}`}>
                        {update.type.charAt(0).toUpperCase() + update.type.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400">{update.date}</span>
                    </div>
                    <h4 className="font-black text-gray-900 text-sm mb-1">{update.title}</h4>
                    <p className="text-gray-600 text-xs leading-relaxed">{update.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-4">Scheduled Maintenance</h3>
            <div className="relative rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.9)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
              <div className="absolute top-0 inset-x-0 h-0.5"
                style={{ background: "linear-gradient(90deg, #0891b2, #0e7490)" }} />
              <div className="p-5">
                <p className="text-gray-500 text-sm mb-4">
                  Regular maintenance windows for optimal performance and security.
                </p>
                <div className="space-y-3">
                  {maintenanceSchedule.map((m, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4 p-3 rounded-xl"
                      style={{ background: "rgba(241,245,249,0.6)" }}>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{m.date}</p>
                        <p className="text-xs text-gray-400">{m.time}</p>
                      </div>
                      <p className="text-xs text-gray-600 text-right">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Support CTA */}
          <div className="relative rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(99,102,241,0.15)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.08)",
            }}>
            <div className="absolute top-0 inset-x-0 h-0.5"
              style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
            <div className="p-6">
              <h3 className="font-black text-gray-900 mb-2">Having Issues?</h3>
              <p className="text-gray-500 text-sm mb-4">
                Contact your system administrator or check the FAQ page for troubleshooting steps.
              </p>
              <div className="flex gap-3">
                <a href="/docs"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
                  Documentation
                </a>
                <a href="/faq"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: "rgba(241,245,249,0.8)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>
                  View FAQ
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
