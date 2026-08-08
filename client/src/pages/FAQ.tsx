import { useState, useEffect, useRef } from 'react';
import { ChevronDown, HelpCircle, Search, Sparkles } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useLocation } from 'wouter';

const FAQ_ANIM = `
@keyframes faqSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes faqFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes faqFloatOrb {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}
.faq-slide-up { animation: faqSlideUp 0.55s cubic-bezier(0.22,0.61,0.36,1) both; }
.faq-fade-in  { animation: faqFadeIn 0.5s cubic-bezier(0.22,0.61,0.36,1) both; }
`;

const faqData = [
  {
    category: 'Login & Authentication',
    icon: '🔐',
    questions: [
      {
        question: 'What is my Employee ID?',
        answer: 'Your Employee ID is a unique identifier assigned by your administrator (e.g., "DN156", "EMP001"). It is used to log in to the system. If you do not know your Employee ID, contact your administrator to look it up in the Admin Panel.',
      },
      {
        question: 'How long is my login session valid?',
        answer: 'Employee login sessions are valid for 1 hour from the time of login. After 1 hour, you will need to log in again with your Employee ID. Admin sessions are one-time only and expire when you close the browser or refresh the page — you must re-enter the admin password each time.',
      },
      {
        question: 'What is the difference between Employee login and Admin login?',
        answer: 'Employee login uses your Employee ID and grants access to Stock History, Add Stock NPRM, Usage History, NPRM Modify Order, and QR Scanner based on your user level (1, 1.1, or 2). Admin login uses a separate password and grants access to the Admin Panel for managing employees, orders, deleted logs, and pending requests.',
      },
      {
        question: 'I forgot my Employee ID. What should I do?',
        answer: 'Contact your administrator. They can look up your Employee ID in the Admin Panel under the Workers list.',
      },
      {
        question: 'My session expired. Do I need to log in again?',
        answer: 'Yes. Employee sessions expire after 1 hour as a security measure. Simply enter your Employee ID again on the Login page to continue.',
      },
    ],
  },
  {
    category: 'User Levels & Approval Workflow',
    icon: '👥',
    questions: [
      {
        question: 'What are the different User Levels in the system?',
        answer: 'The system has three user levels:\n\n• Level 1 — Can submit orders, request Used Updates, and request deletions. All actions go to the NPRM Modify Order as pending requests requiring Level 2 approval. Can request any quantity regardless of available stock.\n\n• Level 1.1 — Same as Level 1, but requests are automatically "Process Approved" (marked as In Process) the moment they are submitted. Level 2 still gives the final Approve or Cancel. Can also process-approve Level 1 requests in NPRM Modify Order.\n\n• Level 2 — Can approve or cancel Level 1 / Level 1.1 requests. Also has direct action access: can update usage and delete orders without going through approval.',
      },
      {
        question: 'What does "Level 1.1" mean and how is it different from Level 1?',
        answer: 'Level 1.1 is an intermediate role between Level 1 and Level 2. A Level 1.1 user has the same submission rights as Level 1 (submit orders, request Used Updates, request deletions), but their requests are automatically marked as "In Process" (process-approved) the moment they submit. This signals to Level 2 that the request is already being actively worked on. Level 2 still makes the final decision to Approve or Cancel.',
      },
      {
        question: 'How does the approval workflow work step by step?',
        answer: 'For Level 1 users:\n1. Level 1 submits a Used Update or Delete request from Stock History.\n2. Request appears in NPRM Modify Order with "Pending" status.\n3. Level 2 reviews and clicks Approve or Cancel.\n4. If approved, the action is executed (qty updated or order deleted).\n\nFor Level 1.1 users:\n1. Level 1.1 submits a request — it is instantly marked "In Process" (process-approved by themselves).\n2. Request appears in NPRM Modify Order with "In Process" badge.\n3. Level 2 reviews and gives final Approve or Cancel.\n\nLevel 1.1 can also manually process-approve Level 1 requests from the NPRM Modify Order.'
      },
      {
        question: 'How do I submit a Used Update request as a Level 1 or Level 1.1 user?',
        answer: 'In Stock History, click the "Used Update" button on any current stock order. Choose either:\n• Job No — Enter an 8-digit job number, BQ, Board Size (W×L), Flute Type, and quantity used.\n• Old Stock — Confirm to mark the entire order as used and move it to Out of Stock.\nYour request will be sent to the NPRM Modify Order.'
      },
      {
        question: 'How do I approve or cancel a pending request as a Level 2 user?',
        answer: 'Go to the NPRM Modify Order page. You will see all pending and in-process requests. Click "Approve" to accept (you can optionally override the approved quantity) or "Cancel" to reject the request. Approved requests are immediately executed.',
      },
      {
        question: 'What is "Process Approve" in the NPRM Modify Order?',
        answer: 'Process Approve is an action available to Level 1.1 users in the NPRM Modify Order. It marks a Level 1 request as "In Process" — meaning it is actively being worked on. When you click Process Approve, a dialog appears showing the requested quantity and an optional field to adjust the approved quantity. This does not finalize the request; Level 2 must still give the final Approve or Cancel.'
      },
      {
        question: 'Can I cancel my own pending request?',
        answer: 'Yes. Level 1 users can cancel their own pending requests from the NPRM Modify Order. Level 1.1 users can cancel their own requests, but cannot cancel other users\' requests that have been process-approved. Level 2 users can cancel any request. Once a request is approved, it cannot be cancelled.'
      },
      {
        question: 'I cannot see the NPRM Modify Order or certain buttons. Why?',
        answer: 'Access to features depends on your user level. Level 1 users see the NPRM Modify Order to view and cancel their own requests. Level 1.1 users can also process-approve Level 1 requests. Level 2 users can approve or cancel all requests. If you believe your access level is incorrect, contact your administrator.'
      },
    ],
  },
  {
    category: 'Submitting Orders',
    icon: '📦',
    questions: [
      {
        question: 'What is the Production Order format?',
        answer: 'The Production Order is a unique identifier for each order (e.g., "ORD001", "A123B456"). The system automatically converts it to uppercase. Production Orders must be unique — the system will warn you if a duplicate is detected in real time.',
      },
      {
        question: 'What are BQ Comments and how should I use them?',
        answer: 'BQ Comments are brief notes about the order. Common shortcut buttons available: LR, MP, KL, LP, KC, WT. You can click these buttons to quickly add them, or type any custom comment. The system automatically converts to uppercase.',
      },
      {
        question: 'What does "Flute Type" mean?',
        answer: 'Flute Type refers to the corrugated board type. Available options: BA, BC, BE, and Manual (for custom types). Select from the dropdown or choose "Manual" to enter a custom flute type.',
      },
      {
        question: 'I see a "Duplicate Production Order" warning. What does it mean?',
        answer: 'An order with the same ID already exists. Production Orders must be unique. Please use a different Production Order or verify with your team that you are not duplicating an existing order.',
      },
      {
        question: 'Can I edit an order after submitting it?',
        answer: 'No, orders cannot be edited after submission. If changes are needed, the order must be deleted and resubmitted. Deletions may require Level 2 approval depending on your user level.',
      },
    ],
  },
  {
    category: 'Stock History & Usage',
    icon: '📊',
    questions: [
      {
        question: 'What is the difference between "Current Stock" and "Out of Stock" tabs?',
        answer: 'Current Stock shows orders that still have available quantity. Out of Stock shows orders where the quantity has reached zero (fully consumed). Orders move to Out of Stock automatically when their quantity is set to 0 via a Used Update.',
      },
      {
        question: 'What does "Low Stock" mean?',
        answer: 'Orders with fewer than 50 pieces are highlighted in orange with a "⚠ Low Stock" warning. This alerts you that stock is running low and may need replenishment.',
      },
      {
        question: 'What is the "Available Qty" shown in the Used Update dialog?',
        answer: 'Available Qty = Current stock quantity minus the total quantity already reserved by pending Used Update requests. This ensures you do not over-request stock that is already being processed.',
      },
      {
        question: 'What is the difference between "Job No" and "Old Stock" in Used Update?',
        answer: '• Job No — Enter an 8-digit job number, BQ, Board Size (W×L mm), Flute Type, and the quantity used. This logs the usage for tracking in Usage History.\n• Old Stock — Marks the entire order as fully consumed and moves it to Out of Stock. Use this when the remaining stock is being cleared as old/expired material.',
      },
      {
        question: 'What is the BQ field in Used Update?',
        answer: 'BQ is a reference identifier for the job (e.g., a production card number). It is recorded in the Usage History for traceability and is also visible in NPRM Modify Order request details.'
      },
      {
        question: 'What are Board Size and Flute Type fields?',
        answer: 'Board Size (W × L in mm) refers to the physical dimensions of the board used in the job. Flute Type refers to the corrugated board type (BA, BC, BE, etc.). Both are recorded in Usage History and visible in NPRM Modify Order request details.'
      },
      {
        question: 'Where can I see past usage records?',
        answer: 'Go to the Usage History page from the Home Dashboard. It shows all logged usage entries including Job No, Used Qty, Production Order, Flute Type, BQ, Board Size, and other details.',
      },
      {
        question: 'How do I print an A4 label for an order?',
        answer: 'In Stock History, click the printer icon 🖨️ next to any order. A professional A4 label will open with: Production Order, Quantity, Product Details (Board Size, Flute Type, BQ), and a QR code. You can then print it directly from your browser.',
      },
      {
        question: 'What information is encoded in the QR code on the label?',
        answer: 'The QR code contains: Production Order, Quantity, BQ, Board Size, Flute Type, and the timestamp when the label was generated. This allows the QR Scanner to verify order details when the label is scanned.',
      },
    ],
  },
  {
    category: 'QR Scanner & Label Verification',
    icon: '📱',
    questions: [
      {
        question: 'What is the QR Scanner and how do I use it?',
        answer: 'The QR Scanner is a verification tool accessible from the Home Dashboard. You can use it to:\n1. Scan QR codes from printed A4 labels using your device camera, or\n2. Manually enter an Production Order to verify it against Stock History records.\nAfter scanning, the system shows whether the order exists and displays its current details.',
      },
      {
        question: 'How do I access the QR Scanner?',
        answer: 'From the Home Dashboard, click the "QR Scanner" card. You can then either:\n• Click "Start Camera" to scan a QR code from a label using your device camera, or\n• Enter an Production Order manually and click "Verify".',
      },
      {
        question: 'What happens after I scan a QR code?',
        answer: 'The system verifies the scanned Production Order against Stock History. If found, it displays:\n• Production Order, Current Quantity, Board Size, Flute Type, BQ\n• A "Match ✓" status if the order exists\n• An option to update the balance if needed (requires Employee ID verification)\n\nIf the order is not found, it shows "Not Found ✗" status.',
      },
      {
        question: 'Can I update the balance after scanning?',
        answer: 'Yes. After a successful scan, you can click "Update Balance" to change the quantity. You must enter:\n• New Quantity (the updated qty)\n• Your Employee ID (for verification)\nThe system will record this update in the Scanned History with your name, the time, and the qty change.',
      },
      {
        question: 'What is the "Scanned History" tab?',
        answer: 'The Scanned History tab shows all scan events and balance updates. Each entry displays:\n• Production Order that was scanned\n• Employee name and ID who performed the action\n• Action type (Scanned or Balance Updated)\n• Old qty → New qty (for balance updates)\n• Date and time of the event\nThis provides a complete audit trail of all scanning and verification activities.',
      },
      {
        question: 'Can I see who scanned which order and when?',
        answer: 'Yes. The Scanned History tab shows a complete log of all scanning activities, including: who scanned the order (Employee name and ID), which Production Order was scanned, the action performed, and the exact date/time. This helps track inventory verification and balance updates.',
      },
      {
        question: 'What if the QR code on the label does not match the current stock?',
        answer: 'If the label qty differs from the current system qty, the scanner will show a "Balance Mismatch" alert. You can then update the balance to the correct quantity using the "Update Balance" button. This ensures the physical stock matches the system records.',
      },
    ],
  },
  {
    category: 'NPRM Modify Order',
    icon: '✅',
    questions: [
      {
        question: 'Who can see the NPRM Modify Order?',
        answer: 'All users (Level 1, Level 1.1, and Level 2) can access the NPRM Modify Order. Level 1 users can view and cancel their own requests. Level 1.1 users can also process-approve Level 1 requests. Level 2 users can approve or cancel all requests.'
      },
      {
        question: 'What does the "In Process" badge mean on a request card?',
        answer: '"In Process" means a Level 1.1 user has process-approved the request, indicating it is actively being worked on. The request still requires final Approve or Cancel from a Level 2 user.',
      },
      {
        question: 'What information is shown on a Used Update request card?',
        answer: 'Each Used Update request card shows: Production Order, Flute Type, BQ, current quantity, requested used quantity, Job No, Board Size (W×L), purpose (Job No or Old Stock), submitted by, and submission time. If process-approved, it also shows who process-approved it and when.',
      },
      {
        question: 'Can a Level 2 user override the approved quantity?',
        answer: 'Yes. When a Level 2 user clicks Approve, a dialog appears with an optional "Approved Qty" field. If left blank, the originally requested quantity is used. If filled in, the override quantity is applied instead.',
      },
      {
        question: 'What happens when a request is approved?',
        answer: 'For Used Update requests: the order quantity is reduced by the approved quantity, and a usage history record is created.\nFor Delete requests: the order is permanently removed from the stock list and a deletion log is recorded.',
      },
      {
        question: 'What is the difference between "Pending" and "In Process" requests?',
        answer: '"Pending" means a Level 1 user submitted the request and it is waiting for Level 2 approval.\n"In Process" means a Level 1.1 user submitted the request (auto process-approved) or a Level 1.1 user manually process-approved a Level 1 request. It is still awaiting final Level 2 approval.',
      },
    ],
  },

  {
    category: 'Admin Panel',
    icon: '⚙️',
    questions: [
      {
        question: 'How do I access the Admin Panel?',
        answer: 'Click "Admin Panel" from the Home Dashboard and enter the admin password when prompted. The admin session is one-time only and expires when you close or refresh the browser.',
      },
      {
        question: 'How do I add a new employee?',
        answer: 'In the Admin Panel, go to the Workers tab and click "Add Worker". Enter the Employee ID, Name, Department, and select the User Level (1, 1.1, or 2). Click Save to add the worker.',
      },
      {
        question: 'What are the User Levels I can assign to a worker?',
        answer: '• Level 1 — Actions require Level 2 approval.\n• Level 1.1 — Requests are auto process-approved; Level 2 gives final approval. Can also process-approve other Level 1 requests in NPRM Modify Order.\n• Level 2 — Can approve/cancel Level 1 and Level 1.1 requests. Has direct action access.'
      },
      {
        question: 'How do I delete an order from the Admin Panel?',
        answer: 'In the Admin Panel, go to the Orders tab. Find the order and click the Delete button. You will be asked to confirm with the Employee ID of the person requesting the deletion. This is logged in the Deleted Logs tab.',
      },
      {
        question: 'What is the Deleted Logs tab?',
        answer: 'The Deleted Logs tab shows a full audit trail of all deleted orders, including: Production Order, Flute Type, Size, Qty, BQ, who deleted it, and when. This helps maintain accountability and traceability.',
      },
      {
        question: 'What is the Pending Requests tab in the Admin Panel?',
        answer: 'The Pending Requests tab gives administrators an overview of all pending, approved, and cancelled requests. Admins can also approve or cancel requests directly from this tab.',
      },
      {
        question: 'How do I export orders to PDF or Excel?',
        answer: 'In the Admin Panel Orders tab, use the "Export PDF" or "Export Excel" buttons to download the current order list. The export includes all visible columns: Production Order, Flute Type, Size, Qty, BQ, Submitted By, and Date.',
      },
    ],
  },
  {
    category: 'Notifications',
    icon: '🔔',
    questions: [
      {
        question: 'How do push notifications work?',
        answer: 'The system supports browser push notifications. When enabled, you will receive notifications for: new pending requests (Level 2 users), new order submissions, and admin login events. You must grant notification permission in your browser when prompted.',
      },
      {
        question: 'I am not receiving push notifications. What should I do?',
        answer: 'Check that your browser has notification permissions enabled for this site. Go to your browser settings → Site Settings → Notifications and ensure this site is set to "Allow". Also make sure you are not in a private/incognito window.',
      },
      {
        question: 'What is the notification bell icon on the Home page?',
        answer: 'The bell icon in the Home page hero section shows the count of pending requests awaiting approval. It is visible to all users and updates in real time.',
      },
    ],
  },
  {
    category: 'Troubleshooting',
    icon: '🔧',
    questions: [
      {
        question: 'The Used Update or Delete button does not open a dialog. What should I do?',
        answer: 'Ensure you are logged in with a valid Employee ID. If you are a Level 1 or Level 1.1 user, the "Used Update" button should open the Used Update Request dialog. If the dialog does not appear, try refreshing the page and logging in again. If the problem persists, contact your administrator.',
      },
      {
        question: 'My request shows "Pending" but I am a Level 1.1 user. Should it not be "In Process"?',
        answer: 'If you submitted the request after the Level 1.1 feature was enabled, it should automatically show "In Process". If it shows "Pending", it may have been submitted before the feature was active. You can manually process-approve it from the NPRM Modify Order.'
      },
      {
        question: 'I cannot see the "Process" button in the NPRM Modify Order. Why?',
        answer: 'The "Process" button is only available to Level 1.1 users. If you are Level 1 or Level 2, you will not see this button. Contact your administrator if you believe your level should be 1.1.'
      },
      {
        question: 'The available quantity in Used Update seems lower than expected. Why?',
        answer: 'The Available Qty accounts for pending Used Update requests. If other users have submitted pending requests for the same order, their requested quantities are subtracted from the current stock to prevent over-allocation.',
      },
      {
        question: 'I see a "Duplicate Production Order" warning. What does it mean?',
        answer: 'An order with the same ID already exists in the system. Production Orders must be unique. Please enter a different Production Order or check with your team to ensure you are not duplicating an existing order.',
      },
      {
        question: 'The QR Scanner camera is not working. What should I do?',
        answer: 'Ensure your browser has camera permission enabled for this site. Go to your browser settings → Site Settings → Camera and ensure this site is set to "Allow". Also check that no other app is using the camera. If the problem persists, try using the manual Production Order input instead.',
      },
      {
        question: 'The QR code on the printed label does not scan. What should I do?',
        answer: 'Ensure the label is printed clearly and not damaged. Try scanning it with the QR Scanner camera or use the manual Production Order input field. If the QR code is damaged, print a new label using the printer icon in Stock History.',
      },
      {
        question: 'How do I contact support?',
        answer: 'For technical issues not covered in this FAQ, contact your system administrator. They can access the Admin Panel to investigate order and request history, or escalate to the system support team if needed.',
      },
    ],
  },
];

export default function FAQ() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const styleInjected = useRef(false);
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement('style');
    el.textContent = FAQ_ANIM;
    document.head.appendChild(el);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredData = faqData
    .map((section) => ({
      ...section,
      questions: section.questions.filter(
        (q) =>
          (!activeCategory || section.category === activeCategory) &&
          (!searchQuery ||
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((section) => section.questions.length > 0);

  const totalQuestions = faqData.reduce((sum, s) => sum + s.questions.length, 0);

  return (
    <AppLayout>
      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #1e3a5f 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", animation: "faqFloatOrb 9s ease-in-out infinite" }} />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)", animation: "faqFloatOrb 13s ease-in-out 2s infinite" }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
        </div>
        <div className="relative px-4 lg:px-8 py-10 lg:py-14">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4 faq-slide-up">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shrink-0"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <HelpCircle size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-violet-200"
                    style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}>
                    {totalQuestions}+ Answers
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-blue-200"
                    style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
                    8 Categories
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight" style={{ fontFamily: "Lora, serif" }}>
                  Frequently Asked Questions
                </h1>
                <p className="text-white/50 text-sm mt-1.5">
                  Answers covering all features of PP4 Manual Slitter Stock Management System
                </p>
              </div>
            </div>
            {/* Search bar in hero */}
            <div className="relative mt-6 faq-fade-in" style={{ animationDelay: "0.15s" }}>
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }} />
              <input
                type="text"
                placeholder="Search questions..."
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

      {/* Category Filter */}
      <div className="px-4 lg:px-8 py-4 sticky top-0 z-10"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(226,232,240,0.6)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={activeCategory === null ? {
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
              } : {
                background: "rgba(241,245,249,0.8)",
                color: "#64748b",
                border: "1px solid rgba(226,232,240,0.6)",
              }}
            >
              All
            </button>
            {faqData.map((section) => (
              <button
                key={section.category}
                onClick={() => setActiveCategory(section.category)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                style={activeCategory === section.category ? {
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
                } : {
                  background: "rgba(241,245,249,0.8)",
                  color: "#64748b",
                  border: "1px solid rgba(226,232,240,0.6)",
                }}
              >
                {section.icon} {section.category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto space-y-3">
          {filteredData.map((section) => (
            <div key={section.category} className="space-y-3">
              {section.questions.map((item, idx) => {
                const itemId = `${section.category}-${idx}`;
                const isExpanded = expandedItems.includes(itemId);
                return (
                  <div
                    key={itemId}
                    className="relative rounded-2xl overflow-hidden faq-fade-in"
                    style={{
                      animationDelay: `${idx * 0.04}s`,
                      background: isExpanded ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(16px)",
                      border: isExpanded ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(255,255,255,0.9)",
                      boxShadow: isExpanded
                        ? "0 8px 32px rgba(139,92,246,0.12), 0 2px 8px rgba(0,0,0,0.04)"
                        : "0 2px 8px rgba(0,0,0,0.04)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isExpanded && <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: "linear-gradient(90deg, #8b5cf6, #6366f1)" }} />}
                    <button
                      onClick={() => toggleExpand(itemId)}
                      className="w-full px-5 py-4 flex items-start justify-between transition-colors"
                    >
                      <span className="text-left font-bold text-gray-900 text-sm leading-relaxed">{item.question}</span>
                      <div className="shrink-0 ml-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={isExpanded ? {
                          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                          boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
                        } : {
                          background: "rgba(241,245,249,0.8)",
                        }}>
                        <ChevronDown
                          size={15}
                          className={`transition-transform ${isExpanded ? "rotate-180 text-white" : "text-gray-400"}`}
                        />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5">
                        <div className="rounded-xl p-4" style={{ background: "rgba(241,245,249,0.6)" }}>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(241,245,249,0.8)" }}>
                <Sparkles size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">No questions found.</p>
              <p className="text-gray-300 text-sm mt-1">Try a different search or category.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
