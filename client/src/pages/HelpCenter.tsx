import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ChevronDown, Mail, Phone, MessageCircle, Search, Send, AlertCircle, BookOpen, Wrench, ExternalLink } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

type TabType = "faq" | "guides" | "troubleshooting" | "contact";

const FAQData = [
  {
    question: "How do I submit a new order?",
    answer: "Go to the Add Stock NPRM page, fill in the Flute Type, Size (Width x Length), Quantity, and BQ comment. Click Submit to create the order. You'll receive a confirmation with the Tracking ID."
  },
  {
    question: "What is a Tracking ID?",
    answer: "A Tracking ID is a unique identifier generated when you submit an order or perform an update. It combines the Job No and timestamp, making it easy to track your requests through the system."
  },
  {
    question: "How do I check my stock?",
    answer: "Visit the Stock History page to view all current stock items. You can filter by BQ comment and see available quantities. The available quantity is calculated as: Stock - Pending = Available."
  },
  {
    question: "What's the difference between 'Request Use' and 'Used Update'?",
    answer: "Request Use is for submitting a new usage request that requires approval. Used Update is for updating the quantity used for an existing order. Both generate a Tracking ID for tracking purposes."
  },
  {
    question: "How long does approval take?",
    answer: "Approval times depend on your administrator's availability. You can check the status of your requests in the Approval Center. Pending requests are listed there with their current status."
  },
  {
    question: "Can I cancel a pending request?",
    answer: "Yes, if you submitted the request, you can cancel it before it's approved. Once approved, the action is finalized. Contact your administrator if you need to revert an approved action."
  },
  {
    question: "How do I use the QR Scanner?",
    answer: "Open the QR Scanner page and point your camera at the QR code on the stock label. The system will automatically verify the order and display its details. You can also manually enter the Tracking ID."
  },
  {
    question: "What should I do if I get an 'Access Denied' error?",
    answer: "This means you don't have permission for that feature. Contact your administrator using the contact information in the Help Center. They can adjust your access level if needed."
  }
];

const GuidesData = [
  {
    title: "Getting Started",
    steps: [
      "Log in with your Employee ID",
      "Review the available features on the Home page",
      "Start with Add Stock NPRM to create your first order",
      "Check Stock History to view your orders"
    ]
  },
  {
    title: "Submitting an Order",
    steps: [
      "Navigate to Add Stock NPRM page",
      "Select Flute Type (Single, Double, Triple, etc.)",
      "Enter Size: Width (W) and Length (L) in mm",
      "Enter Quantity in pieces",
      "Add BQ comment if needed",
      "Click Submit and note your Tracking ID"
    ]
  },
  {
    title: "Tracking Your Request",
    steps: [
      "Save your Tracking ID from the submission confirmation",
      "Visit Usage History to see your request status",
      "For pending approvals, check Approval Center",
      "Use QR Scanner to quickly look up orders by scanning"
    ]
  },
  {
    title: "Using QR Scanner",
    steps: [
      "Open QR Scanner from the Home page",
      "Allow camera access when prompted",
      "Point camera at the QR code on the label",
      "System will automatically verify the order",
      "Update balance if needed using the dialog"
    ]
  }
];

const TroubleshootingData = [
  {
    problem: "QR Scanner not working",
    solution: "Ensure your browser has camera permission. Check if the QR code is clearly visible and not damaged. Try manually entering the Tracking ID instead."
  },
  {
    problem: "Can't submit an order",
    solution: "Check that all required fields are filled (Flute Type, Size, Quantity). Ensure your session is still active. Try refreshing the page and logging in again."
  },
  {
    problem: "Order not appearing in Stock History",
    solution: "Wait a few seconds for the system to update. Try refreshing the page. If still missing, check if you're viewing the correct filter or BQ comment."
  },
  {
    problem: "Approval taking too long",
    solution: "Contact your administrator using the contact form. They may need to review pending requests. Check the Approval Center to see the current status of your request."
  },
  {
    problem: "Getting 'Access Denied' error",
    solution: "This feature requires a higher access level. Contact your administrator to request access. They can adjust your user level if appropriate."
  },
  {
    problem: "Session expired",
    solution: "Your session expires after 1 hour of inactivity. Log in again to continue. Your submitted orders are saved and won't be lost."
  }
];

function FAQSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {FAQData.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900 text-left">{item.question}</span>
            <ChevronDown
              size={20}
              className={`text-gray-500 shrink-0 transition-transform ${
                expandedIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedIndex === index && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-700">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GuidesSection() {
  return (
    <div className="space-y-4">
      {GuidesData.map((guide, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{guide.title}</h3>
          </div>
          <ol className="space-y-2">
            {guide.steps.map((step, stepIndex) => (
              <li key={stepIndex} className="flex gap-3 text-sm text-gray-700">
                <span className="font-semibold text-blue-600 shrink-0">{stepIndex + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function TroubleshootingSection() {
  return (
    <div className="space-y-3">
      {TroubleshootingData.map((item, index) => (
        <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">{item.problem}</h4>
              <p className="text-sm text-gray-700">{item.solution}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const submitMessage = trpc.system.submitContactMessage.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully! Administrator will contact you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }
    await submitMessage.mutateAsync(formData);
  };

  return (
    <div className="space-y-6">
      {/* ── WhatsApp CTA ─────────────────────────────────────── */}
      {(() => {
        const rawNum = import.meta.env.VITE_ADMIN_WHATSAPP || "";
        const digits = rawNum.replace(/\D/g, "");
        const waUrl = digits ? `https://wa.me/${digits}` : null;
        return waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-2xl p-5 transition-all group"
            style={{
              background: "linear-gradient(135deg, rgba(37,211,102,0.15) 0%, rgba(18,140,78,0.10) 100%)",
              border: "1px solid rgba(37,211,102,0.35)",
              boxShadow: "0 4px 20px rgba(37,211,102,0.12)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(37,211,102,0.25)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(37,211,102,0.55)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(37,211,102,0.12)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(37,211,102,0.35)";
            }}
          >
            <div className="flex items-center gap-4">
              {/* WhatsApp icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                style={{ background: "linear-gradient(135deg, #25d366, #128c4e)" }}
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(34,197,94,0.9)" }}>Fastest Response</p>
                <p className="text-base font-bold" style={{ color: "#1a2e1a" }}>Contact Admin on WhatsApp</p>
                <p className="text-sm mt-0.5" style={{ color: "rgba(22,101,52,0.8)" }}>
                  {rawNum}
                </p>
              </div>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-1"
              style={{ background: "rgba(37,211,102,0.2)", border: "1px solid rgba(37,211,102,0.3)" }}
            >
              <ExternalLink size={16} style={{ color: "#16a34a" }} />
            </div>
          </a>
        ) : null;
      })()}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Administrator Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600">Email</p>
              <a href={`mailto:${import.meta.env.VITE_ADMIN_EMAIL || "admin@gspp.com"}`} className="font-medium text-blue-600 hover:underline break-all">{import.meta.env.VITE_ADMIN_EMAIL || "admin@gspp.com"}</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600">WhatsApp</p>
              <a href={`https://wa.me/${(import.meta.env.VITE_ADMIN_WHATSAPP || "+95 9 XXX XXX XXX").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="font-medium text-green-600 hover:underline">{import.meta.env.VITE_ADMIN_WHATSAPP || "+95 9 XXX XXX XXX"}</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <Phone size={18} className="text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{import.meta.env.VITE_ADMIN_NAME || "Administrator"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Send us a Message</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="What is this about?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe your issue or question..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitMessage.isPending}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {submitMessage.isPending ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState<TabType>("faq");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "faq", label: "FAQ", icon: <MessageCircle size={18} /> },
    { id: "guides", label: "How-to Guides", icon: <BookOpen size={18} /> },
    { id: "troubleshooting", label: "Troubleshooting", icon: <Wrench size={18} /> },
    { id: "contact", label: "Contact", icon: <Mail size={18} /> }
  ];

  return (
    <AppLayout>
      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #0c4a6e 50%, #1e3a5f 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #0891b2, transparent)" }} />
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
                <BookOpen size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-cyan-200"
                    style={{ background: "rgba(8,145,178,0.2)", border: "1px solid rgba(8,145,178,0.3)" }}>
                    Support
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight" style={{ fontFamily: "Lora, serif" }}>
                  Help Center
                </h1>
                <p className="text-white/50 text-sm mt-1.5">Find answers, guides, and contact support</p>
              </div>
            </div>
            {/* Search */}
            <div className="relative mt-6">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }} />
              <input
                type="text"
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="px-4 lg:px-8 py-4 sticky top-0 z-10"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(226,232,240,0.6)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                style={activeTab === tab.id ? {
                  background: "linear-gradient(135deg, #0891b2, #0e7490)",
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(8,145,178,0.3)",
                } : {
                  background: "rgba(241,245,249,0.8)",
                  color: "#64748b",
                  border: "1px solid rgba(226,232,240,0.6)",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 32px rgba(8,145,178,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            }}>
            <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: "linear-gradient(90deg, #0891b2, #6366f1)" }} />
            <div className="p-6">
              {activeTab === "faq" && <FAQSection />}
              {activeTab === "guides" && <GuidesSection />}
              {activeTab === "troubleshooting" && <TroubleshootingSection />}
              {activeTab === "contact" && <ContactSection />}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
