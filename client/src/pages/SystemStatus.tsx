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
      date: 'May 18, 2026',
      title: 'Level 2 Stock History Updated to Match Level 1/1.1 Design',
      description: 'Level 2 users now see the same comprehensive Purchase Order dialog with full order context, quantity breakdown, and pending requests count. All user levels now have consistent terminology and UI/UX.',
      type: 'update',
    },
    {
      date: 'May 18, 2026',
      title: 'Version Updated to v9030889b',
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
      description: 'Approval Center request cards now always show Level 1.1 process-approved info (name, qty, timestamp) regardless of final status (pending / approved / cancelled).',
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
      description: 'New intermediate user role Level 1.1 added. Requests submitted by Level 1.1 users are automatically process-approved (In Process) upon submission. Level 1.1 users can also manually process-approve Level 1 requests from the Approval Center.',
      type: 'update',
    },
    {
      date: 'May 5, 2026',
      title: 'Approval Center — Extra Fields Display',
      description: 'Used Update request cards in the Approval Center now display Master Card, Board Size (W×L mm), and Scores fields for full job traceability.',
      type: 'update',
    },
    {
      date: 'May 3, 2026',
      title: 'Master Card, Board Size & Scores Fields',
      description: 'Used Update dialog now includes Master Card, Board Size (W×L mm), and Scores input fields. These are recorded in Usage History and shown in Approval Center request cards.',
      type: 'update',
    },
    {
      date: 'May 1, 2026',
      title: 'Process Approve System (Level 1.1)',
      description: 'Level 1.1 users can process-approve Level 1 requests from the Approval Center. Process Approve dialog supports optional quantity override. Approved quantity is shown on request cards.',
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
      description: 'Level 1 & Level 2 approval system fully operational. Level 1 users submit requests; Level 2 users approve or cancel from the Approval Center.',
      type: 'update',
    },
  ];

  const maintenanceSchedule = [
    {
      date: 'May 12, 2026',
      time: '02:00 - 03:00 UTC',
      description: 'Scheduled database optimization',
    },
    {
      date: 'May 19, 2026',
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-12 md:py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Activity size={32} />
              <h1 className="text-3xl md:text-4xl font-bold">System Status</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Real-time monitoring and updates for the PP4 Manual Slitter Stock Management System
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Current Status Card */}
          <div className={`border-2 rounded-2xl p-8 mb-12 ${statusBg[systemInfo.status]}`}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {statusIcon[systemInfo.status]}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">
                    System {systemInfo.status}
                  </h2>
                  <p className={`text-sm font-semibold ${statusColor[systemInfo.status]}`}>
                    {systemInfo.status === 'operational' && 'All systems operational'}
                    {systemInfo.status === 'degraded' && 'Some services experiencing issues'}
                    {systemInfo.status === 'down' && 'System currently unavailable'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { const btn = document.getElementById('sys-refresh-icon'); if (btn) { btn.classList.add('animate-spin'); setTimeout(() => btn.classList.remove('animate-spin'), 700); } window.location.reload(); }}
                className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg hover:shadow-md transition-shadow"
              >
                Refresh
              </button>
            </div>

            {/* Status Metrics */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Server size={18} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-600">Uptime</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{systemInfo.uptime}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-green-600" />
                  <span className="text-sm font-semibold text-gray-600">Response Time</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{systemInfo.responseTime}ms</p>
                <p className="text-xs text-gray-500">Average</p>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={18} className="text-purple-600" />
                  <span className="text-sm font-semibold text-gray-600">Last Updated</span>
                </div>
                <p className="text-sm font-bold text-gray-900">Just now</p>
                <p className="text-xs text-gray-500">{systemInfo.lastUpdate}</p>
              </div>
            </div>
          </div>

          {/* Recent Updates */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Updates</h3>
            <div className="space-y-4">
              {recentUpdates.map((update, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${updateTypeColor[update.type]}`}>
                        {update.type.charAt(0).toUpperCase() + update.type.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">{update.date}</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{update.title}</h4>
                  <p className="text-gray-700">{update.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Scheduled Maintenance</h3>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
              <p className="text-gray-700 mb-6">
                We perform regular maintenance to ensure optimal system performance and security. During maintenance windows, the system may be temporarily unavailable.
              </p>
              <div className="space-y-4">
                {maintenanceSchedule.map((maintenance, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{maintenance.date}</p>
                        <p className="text-sm text-gray-600">{maintenance.time}</p>
                      </div>
                      <p className="text-sm text-gray-700">{maintenance.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Components */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">System Components</h3>
            {components.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {components.map((component, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{component.name}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${component.status === 'operational' ? 'bg-green-600' : component.status === 'degraded' ? 'bg-yellow-600' : 'bg-red-600'}`}></div>
                        <span className={`text-sm font-semibold ${component.status === 'operational' ? 'text-green-600' : component.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Response: {component.responseTime}ms</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">Loading system components...</p>
              </div>
            )}
          </div>

          {/* Support Section */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Having Issues?</h3>
            <p className="text-gray-700 mb-6">
              If you are experiencing any issues not listed above, please contact your system administrator or check the FAQ page for troubleshooting steps.
            </p>
            <div className="flex gap-4">
              <a
                href="/docs"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Documentation
              </a>
              <a
                href="/faq"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                View FAQ
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
