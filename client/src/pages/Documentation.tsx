import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { FileText, Download, BookOpen, Shield, HelpCircle, Play } from "lucide-react";
import FAQ from "./FAQ";
import VideoTutorials from "@/components/VideoTutorials";

const EMPLOYEE_GUIDE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663608581478/AzwFmHviKQDRtTtP.pdf";
const ADMIN_GUIDE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663608581478/rJZMrLLFokwcBZDz.pdf";

type Tab = "employee" | "admin" | "faq" | "videos";

export default function Documentation() {
  const [activeTab, setActiveTab] = useState<Tab>("employee");

  const employeeGuideContent = [
    {
      title: "Getting Started",
      sections: [
        "System Requirements",
        "Accessing the System",
        "Login Access - Employee Login (Level 1 & Level 2)",
      ],
    },
    {
      title: "Core Features",
      sections: [
        "Home Dashboard",
        "Submit Order",
        "Stock History",
        "Usage History",
        "Approval Center",
      ],
    },
    {
      title: "Support",
      sections: [
        "Troubleshooting",
        "Glossary",
        "Contact Support",
      ],
    },
  ];

  const adminGuideContent = [
    {
      title: "Admin Access",
      sections: [
        "Admin Login",
        "Admin Panel Dashboard",
        "Summary Statistics",
      ],
    },
    {
      title: "Management",
      sections: [
        "Employee Management",
        "Orders Management",
        "Approval Workflow",
        "Deleted Logs & Audit Trail",
      ],
    },
    {
      title: "Operations",
      sections: [
        "System Statistics",
        "Best Practices",
        "System Maintenance",
        "Troubleshooting",
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
              onClick={() => setActiveTab("faq")}
              className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "faq"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <HelpCircle size={20} />
              FAQ
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "videos"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Play size={20} />
              Video Tutorials
            </button>
          </div>

          {/* FAQ Tab */}
          {activeTab === "faq" && (
            <div className="-mx-4 -my-12">
              <FAQ />
            </div>
          )}

          {/* Video Tutorials Tab */}
          {activeTab === "videos" && (
            <div className="space-y-8">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Tutorials</h2>
                <p className="text-gray-600">
                  Watch step-by-step video tutorials to learn how to use all features of the Stock Management System. Click on any video to watch it in full screen.
                </p>
              </div>
              <VideoTutorials />
            </div>
          )}

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
                  <a
                    href={EMPLOYEE_GUIDE_URL}
                    download="Employee_User_Guide.pdf"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <Download size={20} />
                    Download PDF
                  </a>
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
                    "Employee Login with 1-hour sessions",
                    "Submit new orders with auto-uppercase Order ID",
                    "Real-time duplicate Order ID checking",
                    "Stock History with low-stock alerts",
                    "Usage tracking and history",
                    "Approval Center for Level 1 & 2 users",
                    "BQ Comment shortcuts (LR, MP, KL, LP, KC, WT)",
                    "Mobile and desktop responsive design",
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
                  <a
                    href={ADMIN_GUIDE_URL}
                    download="Admin_Documentation.pdf"
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    <Download size={20} />
                    Download PDF
                  </a>
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
                    "One-time admin password authentication",
                    "Employee management (add/delete/view)",
                    "User Level assignment (Level 1 & 2)",
                    "Complete order management",
                    "Approval workflow control",
                    "Deleted logs & audit trail",
                    "Real-time system statistics",
                    "Export orders to Excel/PDF",
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
                className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <FileText className="text-blue-600" size={24} />
                <div>
                  <div className="font-semibold text-gray-900">Employee User Guide</div>
                  <div className="text-sm text-gray-500">PDF Download</div>
                </div>
              </a>
              <a
                href={ADMIN_GUIDE_URL}
                className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <Shield className="text-green-600" size={24} />
                <div>
                  <div className="font-semibold text-gray-900">Admin Documentation</div>
                  <div className="text-sm text-gray-500">PDF Download</div>
                </div>
              </a>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center text-gray-600">
            <p className="mb-2">
              <strong>Version:</strong> 1.0 | <strong>Last Updated:</strong> May 2026
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
