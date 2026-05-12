import { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

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
        answer: 'Employee login uses your Employee ID and grants access to Stock History, Submit Order, Usage History, Approval Center, and QR Scanner based on your user level (1, 1.1, or 2). Admin login uses a separate password and grants access to the Admin Panel for managing employees, orders, deleted logs, and pending requests.',
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
        answer: 'The system has three user levels:\n\n• Level 1 — Can submit orders, request Used Updates, and request deletions. All actions go to the Approval Center as pending requests requiring Level 2 approval. Can request any quantity regardless of available stock.\n\n• Level 1.1 — Same as Level 1, but requests are automatically "Process Approved" (marked as In Process) the moment they are submitted. Level 2 still gives the final Approve or Cancel. Can also process-approve Level 1 requests in Approval Center.\n\n• Level 2 — Can approve or cancel Level 1 / Level 1.1 requests. Also has direct action access: can update usage and delete orders without going through approval.',
      },
      {
        question: 'What does "Level 1.1" mean and how is it different from Level 1?',
        answer: 'Level 1.1 is an intermediate role between Level 1 and Level 2. A Level 1.1 user has the same submission rights as Level 1 (submit orders, request Used Updates, request deletions), but their requests are automatically marked as "In Process" (process-approved) the moment they submit. This signals to Level 2 that the request is already being actively worked on. Level 2 still makes the final decision to Approve or Cancel.',
      },
      {
        question: 'How does the approval workflow work step by step?',
        answer: 'For Level 1 users:\n1. Level 1 submits a Used Update or Delete request from Stock History.\n2. Request appears in Approval Center with "Pending" status.\n3. Level 2 reviews and clicks Approve or Cancel.\n4. If approved, the action is executed (qty updated or order deleted).\n\nFor Level 1.1 users:\n1. Level 1.1 submits a request — it is instantly marked "In Process" (process-approved by themselves).\n2. Request appears in Approval Center with "In Process" badge.\n3. Level 2 reviews and gives final Approve or Cancel.\n\nLevel 1.1 can also manually process-approve Level 1 requests from the Approval Center.',
      },
      {
        question: 'How do I submit a Used Update request as a Level 1 or Level 1.1 user?',
        answer: 'In Stock History, click the "Used Update" button on any current stock order. Choose either:\n• Job No — Enter an 8-digit job number, BQ, Board Size (W×L), Flute Type, and quantity used.\n• Old Stock — Confirm to mark the entire order as used and move it to Out of Stock.\nYour request will be sent to the Approval Center.',
      },
      {
        question: 'How do I approve or cancel a pending request as a Level 2 user?',
        answer: 'Go to the Approval Center page. You will see all pending and in-process requests. Click "Approve" to accept (you can optionally override the approved quantity) or "Cancel" to reject the request. Approved requests are immediately executed.',
      },
      {
        question: 'What is "Process Approve" in the Approval Center?',
        answer: 'Process Approve is an action available to Level 1.1 users in the Approval Center. It marks a Level 1 request as "In Process" — meaning it is actively being worked on. When you click Process Approve, a dialog appears showing the requested quantity and an optional field to adjust the approved quantity. This does not finalize the request; Level 2 must still give the final Approve or Cancel.',
      },
      {
        question: 'Can I cancel my own pending request?',
        answer: 'Yes. Level 1 users can cancel their own pending requests from the Approval Center. Level 1.1 users can cancel their own requests, but cannot cancel other users\' requests that have been process-approved. Level 2 users can cancel any request. Once a request is approved, it cannot be cancelled.',
      },
      {
        question: 'I cannot see the Approval Center or certain buttons. Why?',
        answer: 'Access to features depends on your user level. Level 1 users see the Approval Center to view and cancel their own requests. Level 1.1 users can also process-approve Level 1 requests. Level 2 users can approve or cancel all requests. If you believe your access level is incorrect, contact your administrator.',
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
        answer: 'BQ is a reference identifier for the job (e.g., a production card number). It is recorded in the Usage History for traceability and is also visible in Approval Center request details.',
      },
      {
        question: 'What are Board Size and Flute Type fields?',
        answer: 'Board Size (W × L in mm) refers to the physical dimensions of the board used in the job. Flute Type refers to the corrugated board type (BA, BC, BE, etc.). Both are recorded in Usage History and visible in Approval Center request details.',
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
    category: 'Approval Center',
    icon: '✅',
    questions: [
      {
        question: 'Who can see the Approval Center?',
        answer: 'All users (Level 1, Level 1.1, and Level 2) can access the Approval Center. Level 1 users can view and cancel their own requests. Level 1.1 users can also process-approve Level 1 requests. Level 2 users can approve or cancel all requests.',
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
        answer: '• Level 1 — Actions require Level 2 approval.\n• Level 1.1 — Requests are auto process-approved; Level 2 gives final approval. Can also process-approve other Level 1 requests in Approval Center.\n• Level 2 — Can approve/cancel Level 1 and Level 1.1 requests. Has direct action access.',
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
        answer: 'If you submitted the request after the Level 1.1 feature was enabled, it should automatically show "In Process". If it shows "Pending", it may have been submitted before the feature was active. You can manually process-approve it from the Approval Center.',
      },
      {
        question: 'I cannot see the "Process" button in the Approval Center. Why?',
        answer: 'The "Process" button is only available to Level 1.1 users. If you are Level 1 or Level 2, you will not see this button. Contact your administrator if you believe your level should be 1.1.',
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <HelpCircle size={14} /> Help Center
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-500 text-base">
            {totalQuestions} answers covering all features of PP4 Manual Slitter Stock Management System
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeCategory === null
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            All Categories
          </button>
          {faqData.map((section) => (
            <button
              key={section.category}
              onClick={() => setActiveCategory(section.category)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeCategory === section.category
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              {section.icon} {section.category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {filteredData.map((section) => (
            <div key={section.category} className="space-y-3">
              {section.questions.map((item, idx) => {
                const itemId = `${section.category}-${idx}`;
                const isExpanded = expandedItems.includes(itemId);

                return (
                  <div
                    key={itemId}
                    className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpand(itemId)}
                      className="w-full px-5 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-left font-semibold text-gray-900 text-sm">{item.question}</span>
                      <ChevronDown
                        size={18}
                        className={`flex-shrink-0 text-gray-400 transition-transform ml-3 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No questions found. Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
