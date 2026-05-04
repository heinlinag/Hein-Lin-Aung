import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  category: string;
  questions: {
    question: string;
    answer: string;
  }[];
}

const faqData: FAQItem[] = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'What is my Employee ID?',
        answer:
          'Your Employee ID is a unique identifier assigned by your administrator. It is typically a numeric or alphanumeric code (e.g., "EMP001" or "12345"). If you do not know your Employee ID, please contact your administrator.',
      },
      {
        question: 'How long is my login session valid?',
        answer:
          'Employee login sessions are valid for 1 hour from the time of login. After 1 hour, you will need to log in again. Admin sessions are one-time only and expire when you close the browser or refresh the page.',
      },
      {
        question: 'What is the difference between Employee and Admin login?',
        answer:
          'Employee login uses your Employee ID and provides access to order submission, stock history, and approval features based on your user level. Admin login uses a password and provides access to the Admin Panel for managing employees, orders, and system settings.',
      },
    ],
  },
  {
    category: 'Submitting Orders',
    questions: [
      {
        question: 'What is the Order ID format?',
        answer:
          'The Order ID is a unique identifier for each order. It can be any alphanumeric code (e.g., "ORD001", "A123B456"). The system will automatically convert it to uppercase, so you can type it in any case.',
      },
      {
        question: 'What are BQ Comments and how should I use them?',
        answer:
          'BQ Comments are brief notes about the order. Common examples include: LR (Left-Right), MP (Middle-Piece), KL (Key-Left), LP (Left-Piece), KC (Key-Center), WT (Weight). You can type these in any case, and the system will automatically convert them to uppercase. You can also add custom comments as needed.',
      },
      {
        question: 'What does "Flute Type" mean?',
        answer:
          'Flute Type refers to the type of corrugated board used in the order. Common types include: BA, BC, BE, and Manual (for custom types). Select the appropriate type from the dropdown, or choose "Manual" to enter a custom flute type.',
      },
      {
        question: 'Can I edit an order after submitting it?',
        answer:
          'No, orders cannot be edited after submission. If you need to make changes, you must delete the order and submit a new one. Deletions may require approval depending on your user level.',
      },
    ],
  },
  {
    category: 'User Levels & Approval Workflow',
    questions: [
      {
        question: 'What is the difference between Level 1 and Level 2 users?',
        answer:
          'Level 1 users can submit orders and request deletions or stock updates, but these actions require approval from a Level 2 user. Level 2 users can approve or reject these requests and have direct access to modify orders without approval.',
      },
      {
        question: 'How do I submit a deletion request as a Level 1 user?',
        answer:
          'In the Stock History page, click the "Delete" button on an order. Your deletion request will be sent to the Approval Center for Level 2 users to review. You can view the status of your request in the Approval Center and cancel it if needed.',
      },
      {
        question: 'How do I approve or reject a pending request as a Level 2 user?',
        answer:
          'Go to the Approval Center page to see all pending requests. Review each request and click "Approve" to accept it or "Cancel" to reject it. You can also view the request details to make an informed decision.',
      },
      {
        question: 'Can I cancel my own pending request?',
        answer:
          'Yes, Level 1 users can cancel their own pending requests from the Approval Center. Level 2 users can cancel any pending request. Once a request is approved, it cannot be cancelled.',
      },
    ],
  },
  {
    category: 'Stock Management',
    questions: [
      {
        question: 'What does "Low Stock" mean?',
        answer:
          'Low Stock refers to orders with a quantity of 50 pieces or less. These orders are highlighted in orange in the Stock History page to alert you that stock levels are running low and may need to be replenished soon.',
      },
      {
        question: 'How do I update the quantity used from an order?',
        answer:
          'In the Stock History page, click the "Used Update" button on an order. You can then enter the Job Number and quantity used, or select "Old Stock" to mark the entire order as used. The available quantity shown accounts for pending requests.',
      },
      {
        question: 'What is the difference between "Job No" and "Old Stock" in the Used Update dialog?',
        answer:
          'Job No: Enter an 8-digit job number and the quantity used. This logs the usage for tracking purposes. Old Stock: Mark the entire order as used and move it to the "Out of Stock" section. Use this when the order is completely consumed.',
      },
      {
        question: 'What is "Available Qty" in the Used Update dialog?',
        answer:
          'Available Qty is the current quantity minus any pending used quantity from other approval requests. This shows the actual amount available for use right now.',
      },
    ],
  },
  {
    category: 'Admin Panel',
    questions: [
      {
        question: 'How do I add a new employee?',
        answer:
          'In the Admin Panel, go to the "Employees" tab and click "Add Employee". Fill in the Employee ID, Name, Department, and User Level (1 or 2), then click "Add".',
      },
      {
        question: 'How do I delete an employee?',
        answer:
          'In the Admin Panel, go to the "Employees" tab, find the employee you want to delete, and click the delete icon. Confirm the deletion in the dialog that appears.',
      },
      {
        question: 'How do I view the order history?',
        answer:
          'In the Admin Panel, go to the "Orders" tab to see all submitted orders. You can search by Order ID, filter by status, and export the data to PDF or Excel format.',
      },
      {
        question: 'What is the "Deleted Logs" tab?',
        answer:
          'The "Deleted Logs" tab shows an audit trail of all deleted orders, including who deleted them, when they were deleted, and the order details. This helps track order history and maintain accountability.',
      },
      {
        question: 'How do I approve or reject pending requests in the Admin Panel?',
        answer:
          'In the Admin Panel, go to the "Pending Requests" tab. You can see all pending requests and click "Approve" or "Cancel" to process them. This gives admins an overview of all pending approvals.',
      },
    ],
  },
  {
    category: 'Troubleshooting',
    questions: [
      {
        question: 'I forgot my Employee ID. What should I do?',
        answer:
          'Contact your administrator to retrieve your Employee ID. They can look it up in the Admin Panel or provide it directly.',
      },
      {
        question: 'My session expired. Do I need to log in again?',
        answer:
          'Yes, if your session expires (after 1 hour for employees or when closing the browser for admins), you will need to log in again. This is a security measure to protect your account.',
      },
      {
        question: 'I see a "Duplicate Order ID" warning. What does it mean?',
        answer:
          'This means an order with the same ID already exists in the system. Order IDs must be unique. Please enter a different Order ID or check with your team to ensure you are not duplicating an existing order.',
      },
      {
        question: 'I cannot see the Approval Center. Why?',
        answer:
          'The Approval Center is only visible to Level 2 users. If you are a Level 1 user, you can view your pending requests but cannot approve others. Contact your administrator if you believe you should have Level 2 access.',
      },
      {
        question: 'How do I contact support?',
        answer:
          'For technical issues or questions not covered in this FAQ, please contact your administrator or the system support team. They can help resolve your issue or escalate it if needed.',
      },
    ],
  },
];

export default function FAQ() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about the Stock Management System
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqData.map((section) => (
            <div key={section.category} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">{section.category}</h2>
              </div>

              {/* Questions */}
              <div className="divide-y divide-gray-200">
                {section.questions.map((item, index) => {
                  const itemId = `${section.category}-${index}`;
                  const isExpanded = expandedItems.includes(itemId);

                  return (
                    <div key={itemId} className="border-b last:border-b-0">
                      <button
                        onClick={() => toggleExpand(itemId)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-gray-900 text-base">
                          {item.question}
                        </span>
                        <ChevronDown
                          size={20}
                          className={`text-blue-600 transition-transform flex-shrink-0 ml-4 ${
                            isExpanded ? 'transform rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Answer */}
                      {isExpanded && (
                        <div className="px-6 py-4 bg-gray-50 text-gray-700 leading-relaxed">
                          {item.answer}
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
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-700">
            If you cannot find the answer you are looking for, please contact your administrator or
            the system support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
