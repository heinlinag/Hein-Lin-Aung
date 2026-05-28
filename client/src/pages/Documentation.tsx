import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { FileText, Download, BookOpen, Shield, HelpCircle } from "lucide-react";

const EMPLOYEE_GUIDE_URL = "/manus-storage/Employee_User_Guide_v3.1.0_995f26df.pdf";
const ADMIN_GUIDE_URL = "/manus-storage/Admin_Documentation_v3.1.0_4b46e34e.pdf";

type Tab = "employee" | "admin";

export default function Documentation() {
  const [activeTab, setActiveTab] = useState<Tab>("employee");
  const [, navigate] = useLocation();

  const employeeGuideContent = [
    {
      title: "Getting Started",
      sections: [
        "System Requirements",
        "Accessing the System",
        "Login Access — Employee Login (Level 1, 1.1 & 2)",
        "1-Hour Session & Re-login",
        "User Profile Dropdown",
        "Geo-Restriction (Malaysia & Myanmar only)",
      ],
    },
    {
      title: "Core Features",
      sections: [
        "Home Dashboard & Welcome Toast",
        "Submit Order — compact responsive layout (Mobile / Tablet / Desktop)",
        "Stock History — Low-Stock Alerts & Purchase Order Modals",
        "Usage History — Master Card, Board Size, Scores",
        "Approval Center — Pending / In Process / Approved / Cancelled",
        "Process Approve Workflow (Level 1.1)",
        "QR Scanner — Tracking ID Verification & Balance Update",
        "A4 Label Print — Premium B&W print with QR & Barcode",
      ],
    },
    {
      title: "Support & Navigation",
      sections: [
        "FAQ — 42+ Q&A across 8 categories",
        "System Status Page — Real-time monitoring",
        "Notifications — Browser Push Alerts",
        "Help Center — Guides, Troubleshooting & Contact",
        "Troubleshooting & Contact Administrator",
      ],
    },
  ];

  const adminGuideContent = [
    {
      title: "Admin Access",
      sections: [
        "Admin Login via Login Page or User Profile",
        "Password-Protected Admin Panel",
        "Admin Panel Dashboard & Summary Stats",
        "Level 1 / 1.1 / 2 Role Management",
        "Role-Based Feature Access Control",
      ],
    },
    {
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

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={32} />
              <h1 className="text-3xl md:text-4xl font-bold">Documentation</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Complete guides for using the PP4 Manual Slitter Stock Management System
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("employee")}
              className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "employee"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText size={20} />
              Employee Guide
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "admin"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Shield size={20} />
              Admin Guide
            </button>
            <button
              onClick={() => navigate("/faq")}
              className="flex items-center gap-2 px-6 py-3 font-semibold border-b-2 border-transparent text-gray-600 hover:text-purple-600 hover:border-purple-600 transition-colors whitespace-nowrap"
            >
              <HelpCircle size={20} />
              FAQ
            </button>
          </div>

          {/* Employee Guide Tab */}
          {activeTab === "employee" && (
            <div className="space-y-8">
              {/* Download Card */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee User Guide</h2>
                    <p className="text-gray-600">
                      Complete guide for employees to use the Stock Management System
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={EMPLOYEE_GUIDE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap"
                    >
                      <FileText size={20} />
                      View PDF
                    </a>
                    <a
                      href={EMPLOYEE_GUIDE_URL}
                      download="Employee_User_Guide_v3.1.0.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      <Download size={20} />
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>

              {/* Content Overview */}
              <div className="grid md:grid-cols-3 gap-6">
                {employeeGuideContent.map((section, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{section.title}</h3>
                    <ul className="space-y-2">
                      {section.sections.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2 text-gray-700">
                          <span className="text-blue-600 font-bold mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Key Features */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features Covered</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Employee Login with 1-hour sessions (Level 1, 1.1 & 2)",
                    "Submit new orders — compact responsive layout across all devices",
                    "Real-time duplicate Production Order checking with auto-uppercase",
                    "Stock History with low-stock alerts & premium Purchase Order modals",
                    "Usage History — Master Card, Board Size, Scores",
                    "Approval Center — Pending / In Process / Approved / Cancelled",
                    "Process Approve workflow for Level 1.1 users",
                    "Action History — full request trail per card",
                    "QR Scanner — Tracking ID verification & balance update",
                    "A4 Label Print — premium B&W layout with QR code & barcode",
                    "User Profile dropdown with FAQ, Docs & Status links",
                    "Browser push notifications for approvals",
                    "BQ Comment shortcuts (LR, MP, KL, LP, KC, WT)",
                    "Mobile, tablet, laptop, and desktop responsive design",
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold text-lg">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Admin Guide Tab */}
          {activeTab === "admin" && (
            <div className="space-y-8">
              {/* Download Card */}
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Administrator Documentation</h2>
                    <p className="text-gray-600">
                      Complete guide for administrators to manage the Stock Management System
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={ADMIN_GUIDE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-green-600 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors whitespace-nowrap"
                    >
                      <FileText size={20} />
                      View PDF
                    </a>
                    <a
                      href={ADMIN_GUIDE_URL}
                      download="Admin_Documentation_v3.1.0.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      <Download size={20} />
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>

              {/* Content Overview */}
              <div className="grid md:grid-cols-3 gap-6">
                {adminGuideContent.map((section, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{section.title}</h3>
                    <ul className="space-y-2">
                      {section.sections.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2 text-gray-700">
                          <span className="text-green-600 font-bold mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Admin Features */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Admin Capabilities</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Password-protected admin access (User Profile or Login page)",
                    "Employee management — add / edit / delete workers",
                    "User Level assignment (Level 1, 1.1 & 2)",
                    "Complete order management with search & filter",
                    "Approval workflow — approve / cancel / process-approve",
                    "Deleted logs & full audit trail",
                    "Real-time system statistics dashboard",
                    "Export orders to Excel / PDF",
                    "Push notification subscription management",
                    "QR scan history & verification log management",
                    "A4 Label print management per order",
                    "Geo-restriction enforcement (MY & MM only)",
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-12 bg-gray-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href={EMPLOYEE_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <FileText className="text-blue-600" size={24} />
                <div>
                  <div className="font-semibold text-gray-900">Employee User Guide</div>
                  <div className="text-sm text-gray-500">View / Download PDF — v3.1.0</div>
                </div>
              </a>
              <a
                href={ADMIN_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <Shield className="text-green-600" size={24} />
                <div>
                  <div className="font-semibold text-gray-900">Admin Documentation</div>
                  <div className="text-sm text-gray-500">View / Download PDF — v3.1.0</div>
                </div>
              </a>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center text-gray-600">
            <p className="mb-2">
              <strong>Version:</strong> v3.1.0 | <strong>Last Updated:</strong> May 28, 2026
            </p>
            <p>
              For additional support, contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
