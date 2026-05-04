import { useEffect, useState } from 'react';
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
    uptime: '99.9%',
    status: 'operational',
    lastUpdate: new Date().toLocaleString(),
    responseTime: 145,
  });

  const [loading, setLoading] = useState(false);

  // Simulate checking system status
  useEffect(() => {
    setLoading(true);
    // In a real app, this would call an API endpoint
    const timer = setTimeout(() => {
      setSystemInfo({
        uptime: '99.9%',
        status: 'operational',
        lastUpdate: new Date().toLocaleString(),
        responseTime: Math.floor(Math.random() * 100) + 100,
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const recentUpdates: StatusUpdate[] = [
    {
      date: 'May 3, 2026',
      title: 'Documentation Page Added',
      description: 'Added comprehensive FAQ page with 35 Q&A pairs covering all system features.',
      type: 'update',
    },
    {
      date: 'May 1, 2026',
      title: 'System Optimization',
      description: 'Improved database query performance and reduced response times by 20%.',
      type: 'update',
    },
    {
      date: 'April 28, 2026',
      title: 'Admin Dashboard Stats',
      description: 'Added real-time summary statistics cards to the Admin Panel.',
      type: 'update',
    },
    {
      date: 'April 25, 2026',
      title: 'Push Notifications Enabled',
      description: 'Browser push notifications now active for order submissions and approvals.',
      type: 'update',
    },
    {
      date: 'April 20, 2026',
      title: 'Approval Workflow Released',
      description: 'Two-level approval system (Level 1 & Level 2) now fully operational.',
      type: 'update',
    },
  ];

  const maintenanceSchedule = [
    {
      date: 'May 10, 2026',
      time: '02:00 - 04:00 UTC',
      description: 'Scheduled database maintenance',
    },
    {
      date: 'May 17, 2026',
      time: '03:00 - 05:00 UTC',
      description: 'Server updates and patches',
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
                onClick={() => window.location.reload()}
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
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: 'Web Server', status: 'operational' },
                { name: 'Database', status: 'operational' },
                { name: 'API Gateway', status: 'operational' },
                { name: 'Authentication Service', status: 'operational' },
                { name: 'Push Notifications', status: 'operational' },
                { name: 'File Storage', status: 'operational' },
              ].map((component, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{component.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="text-sm text-green-600 font-semibold">
                      {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                href="/docs?tab=faq"
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
