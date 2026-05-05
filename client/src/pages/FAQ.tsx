import { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

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
        answer: 'Employee login uses your Employee ID and grants access to Stock History, Submit Order, Usage History, and Approval Center based on your user level (1, 1.1, or 2). Admin login uses a separate password and grants access to the Admin Panel for managing employees, orders, deleted logs, and pending requests.',
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
        answer: 'The system has three user levels:\n\n• Level 1 — Can submit orders, request Used Updates, and request deletions. All actions go to the Approval Center as pending requests requiring Level 2 approval.\n\n• Level 1.1 — Same as Level 1, but requests are automatically "Process Approved" (marked as In Process) the moment they are submitted. Level 2 still gives the final Approve or Cancel.\n\n• Level 2 — Can approve or cancel Level 1 / Level 1.1 requests. Also has direct action access: can update usage and delete orders without going through approval.',
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
        answer: 'In Stock History, click the "Request Use" button on any current stock order. Choose either:\n• Job No — Enter an 8-digit job number, Master Card, Board Size (W×L), Scores, and quantity used.\n• Old Stock — Confirm to mark the entire order as used and move it to Out of Stock.\nYour request will be sent to the Approval Center.',
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
        answer: 'Yes. Level 1 and Level 1.1 users can cancel their own pending requests from the Approval Center. Level 2 users can cancel any request. Once a request is approved, it cannot be cancelled.',
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
        question: 'What is the Order ID format?',
        answer: 'The Order ID is a unique identifier for each order (e.g., "ORD001", "A123B456"). The system automatically converts it to uppercase. Order IDs must be unique — the system will warn you if a duplicate is detected in real time.',
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
        question: 'I see a "Duplicate Order ID" warning. What does it mean?',
        answer: 'An order with the same ID already exists. Order IDs must be unique. Please use a different Order ID or verify with your team that you are not duplicating an existing order.',
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
        answer: '• Job No — Enter an 8-digit job number, Master Card, Board Size (W×L mm), Scores, and the quantity used. This logs the usage for tracking in Usage History.\n• Old Stock — Marks the entire order as fully consumed and moves it to Out of Stock. Use this when the remaining stock is being cleared as old/expired material.',
      },
      {
        question: 'What is the Master Card field in Used Update?',
        answer: 'Master Card is a reference identifier for the job (e.g., a production card number). It is recorded in the Usage History for traceability and is also visible in Approval Center request details.',
      },
      {
        question: 'What are Board Size and Scores fields?',
        answer: 'Board Size (W × L in mm) refers to the physical dimensions of the board used in the job. Scores refers to the number of scores/cuts applied. Both are recorded in Usage History and visible in Approval Center request details.',
      },
      {
        question: 'Where can I see past usage records?',
        answer: 'Go to the Usage History page from the Home Dashboard. It shows all logged usage entries including Job No, Used Qty, Order ID, Flute Type, BQ Comment, Master Card, Board Size, and Scores.',
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
        answer: 'Each Used Update request card shows: Order ID, Flute Type, BQ Comment, current quantity, requested used quantity, Job No, Master Card, Board Size (W×L), Scores, purpose (Job No or Old Stock), submitted by, and submission time. If process-approved, it also shows who process-approved it and when.',
      },
      {
        question: 'Can a Level 2 user override the approved quantity?',
        answer: 'Yes. When a Level 2 user clicks Approve, a dialog appears with an optional "Approved Qty" field. If left blank, the originally requested quantity is used. If filled in, the override quantity is applied instead.',
      },
      {
        question: 'What happens when a request is approved?',
        answer: 'For Used Update requests: the order quantity is reduced by the approved quantity, and a usage history record is created.\nFor Delete requests: the order is permanently removed from the stock list and a deletion log is recorded.',
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
        answer: 'In the Admin Panel, go to the Workers tab and click "Add Worker". Enter the Employee ID, Name, Department, and select a User Level (Level 1, Level 1.1, or Level 2). Click Add to save.',
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
        answer: 'The Deleted Logs tab shows a full audit trail of all deleted orders, including: Order ID, Flute Type, Size, Qty, BQ Comment, who deleted it, and when. This helps maintain accountability and traceability.',
      },
      {
        question: 'What is the Pending Requests tab in the Admin Panel?',
        answer: 'The Pending Requests tab gives administrators an overview of all pending, approved, and cancelled requests. Admins can also approve or cancel requests directly from this tab.',
      },
      {
        question: 'How do I export orders to PDF or Excel?',
        answer: 'In the Admin Panel Orders tab, use the "Export PDF" or "Export Excel" buttons to download the current order list. The export includes all visible columns: Order ID, Flute Type, Size, Qty, BQ Comment, Submitted By, and Date.',
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
        answer: 'Ensure you are logged in with a valid Employee ID. If you are a Level 1 or Level 1.1 user, the "Request Use" button should open the Used Update Request dialog. If the dialog does not appear, try refreshing the page and logging in again. If the problem persists, contact your administrator.',
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
        question: 'I see a "Duplicate Order ID" warning. What does it mean?',
        answer: 'An order with the same ID already exists in the system. Order IDs must be unique. Please enter a different Order ID or check with your team to ensure you are not duplicating an existing order.',
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
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {faqData.map((s) => (
            <button
              key={s.category}
              onClick={() => setActiveCategory(activeCategory === s.category ? null : s.category)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeCategory === s.category
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s.icon} {s.category}
            </button>
          ))}
        </div>

        {/* No results */}
        {filteredData.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <HelpCircle size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-base">No questions found for &quot;{searchQuery}&quot;</p>
          </div>
        )}

        {/* FAQ Sections */}
        <div className="space-y-6">
          {filteredData.map((section) => (
            <div key={section.category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <h2 className="text-lg font-bold text-white">{section.category}</h2>
                <span className="ml-auto text-blue-200 text-xs font-medium">{section.questions.length} questions</span>
              </div>
              <div className="divide-y divide-gray-100">
                {section.questions.map((item, index) => {
                  const itemId = `${section.category}-${index}`;
                  const isExpanded = expandedItems.includes(itemId);
                  return (
                    <div key={itemId}>
                      <button
                        onClick={() => toggleExpand(itemId)}
                        className="w-full px-6 py-4 text-left hover:bg-blue-50/50 transition-colors flex items-start justify-between gap-4"
                      >
                        <span className="font-semibold text-gray-900 text-sm leading-relaxed">
                          {item.question}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`text-blue-500 transition-transform flex-shrink-0 mt-0.5 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-5 bg-blue-50/30">
                          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line border-l-2 border-blue-300 pl-4">
                            {item.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-blue-100 text-sm">
            Contact your system administrator for issues not covered here.
          </p>
        </div>
      </div>
    </div>
  );
}
