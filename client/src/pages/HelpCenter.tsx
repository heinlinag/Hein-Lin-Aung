import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ChevronDown, Mail, Phone, MessageCircle, Search, Send, AlertCircle, BookOpen, Wrench } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

type TabType = "faq" | "guides" | "troubleshooting" | "contact";

const FAQData = [
  {
    question: "How do I submit a new order?",
    answer: "Go to the Submit Order page, fill in the Flute Type, Size (Width x Length), Quantity, and BQ comment. Click Submit to create the order. You'll receive a confirmation with the Tracking ID."
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
      "Start with Submit Order to create your first order",
      "Check Stock History to view your orders"
    ]
  },
  {
    title: "Submitting an Order",
    steps: [
      "Navigate to Submit Order page",
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Administrator Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600">Email</p>
              <p className="font-medium text-gray-900 break-all">{import.meta.env.VITE_ADMIN_EMAIL || "admin@gspp.com"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600">WhatsApp</p>
              <p className="font-medium text-gray-900">{import.meta.env.VITE_ADMIN_WHATSAPP || "+95 9 XXX XXX XXX"}</p>
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
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
            <p className="text-gray-600">Find answers to your questions and get support</p>
          </div>

          <div className="mb-6 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            {activeTab === "faq" && <FAQSection />}
            {activeTab === "guides" && <GuidesSection />}
            {activeTab === "troubleshooting" && <TroubleshootingSection />}
            {activeTab === "contact" && <ContactSection />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
