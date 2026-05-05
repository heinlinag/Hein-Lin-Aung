# Stock Management System TODO

## Database
- [x] Orders table: orderID, fluteType, sizeW, sizeL, qty, bqComment, status, submittedBy, createdAt
- [x] Workers table: workerID, name, department
- [x] Generate and apply migration SQL

## Backend (tRPC)
- [x] Worker login procedure (authenticate by workerID)
- [x] Submit order procedure (protected: requires worker session)
- [x] List orders procedure (with status filter: current / out-of-stock)
- [x] Update order status procedure (admin)
- [x] Delete order procedure (requires workerID confirmation)
- [x] Admin login procedure (password: Qwer@7090heinann)
- [x] List workers procedure (admin)
- [x] Add worker procedure (admin)
- [x] Delete worker procedure (admin)

## Frontend
- [x] Global design: cream background, Didone serif typography, editorial aesthetic
- [x] DashboardLayout with sidebar (Submit Order, Stock History, Admin)
- [x] Worker Login modal/page (Worker ID authentication)
- [x] Submit Order page with all fields (Order ID, Flute Type, Size W×L, Qty, BQ Comment)
- [x] Flute Type dropdown with Manual option revealing free-text input
- [x] Stock History page with two tabs: Current Stock and Out of Stock
- [x] Stock History table columns: Order ID, Flute Type, Size (W×L), Qty, BQ
- [x] Admin Panel page (password-protected: Qwer@7090heinann)
- [x] Admin: worker list, add worker form, delete worker
- [x] Admin: delete order with Worker ID confirmation dialog

## Tests
- [x] Order submission procedure test
- [x] Worker authentication test
- [x] Admin authentication test


## Lagom Style Redesign (Responsive Mobile + Desktop)
- [x] Update CSS: Lagom palette (soft grays, whites, minimal accents), responsive typography
- [x] Redesign DashboardLayout: mobile-first collapsible sidebar, hamburger menu on mobile
- [x] Refactor Submit Order page: mobile-optimized form layout, larger touch targets
- [x] Refactor Stock History page: responsive table (card view on mobile), better readability
- [x] Refactor Admin Panel: mobile-friendly worker/order management UI
- [x] Test on mobile (375px+) and desktop (1024px+), verify all interactions work
- [x] Add mobile card/list views for Admin workers and orders management
- [x] Verify responsive layouts work on actual mobile devices (375px+) and desktop (1024px+)


## Change Requests (User Feedback)
- [x] Change Flute Type "AB" to "BA" in all dropdowns and database
- [x] Remove sidebar navigation and add Home Dashboard as landing page
- [x] Display current logged-in user in Admin Panel header
- [x] Display "Submitted By" worker name in All Orders table


## New Design & Feature Requests
- [x] Update Home Dashboard design: use colored feature cards (blue, green, red) like Leave Board mockup
- [x] Change "Corrugated" text to "Manual Slitter" throughout app
- [x] Change title: "Stock Management" → "PP4 Manual Slitter Stock Management"
- [x] Add order date/time column to Stock History and Admin Orders
- [x] Add bulk status update: checkbox select multiple orders, toggle status in batch
- [x] Add order search/filter: quick search by Order ID or Flute Type in Stock History


## GSPP Logo + Theme + Usage History (Phase 2)
- [x] Upload GSPP logo to static assets and use in app header
- [x] Update theme: white background, GSPP blue (#1a7fd4) + green (#1db87e) accent colors
- [x] Update Home Dashboard with GSPP logo and new color scheme
- [x] Add usageHistory table to database schema and migrate
- [x] Add logUsageHistory and getUsageHistory helpers to server/db.ts
- [x] Add logUsage and getUsage tRPC procedures to server/routers.ts
- [x] Add "Used Update" button to Stock History Current Stock tab
- [x] Build UsedUpdateDialog: show available qty, Job No vs Old Stock choice
- [x] Job No flow: 8-digit validation, qty deduction, show remaining qty
- [x] Old Stock flow: confirmation dialog, set qty=0, move to Out of Stock
- [x] Add Usage History page at /usage-history
- [x] Usage History shows: Job No, Used Qty, Order ID, Flute, BQ
- [x] Stock History Flute display: "Flute : B" format
- [x] Stock History BQ: yellow highlight

## Login Access System
- [x] Create LoginGate context (AuthContext) with worker session (1hr) and admin session (one-time)
- [x] Create Login page: Worker ID input + Admin password input, GSPP theme
- [x] Worker login: validate Worker ID against database, store session in localStorage with 1hr expiry
- [x] Admin login: validate password (Qwer@7090heinann), store one-time flag in sessionStorage (cleared on page close/refresh)
- [x] Wrap all pages with LoginGate - redirect to login if not authenticated
- [x] Admin Panel: require admin password every time (sessionStorage, not localStorage)
- [x] Show logged-in worker name in header after login
- [x] Add logout button to header
- [x] Fix AdminPanel.tsx: remove internal AdminLoginGate conflicting with app-level LoginGate
- [x] Fix main.tsx: disable OAuth redirect logic (redirectToLoginIfUnauthorized → Manus OAuth)
- [x] Fix AdminPanel.tsx: remove internal AdminLoginGate conflicting with app-level LoginGate
- [x] Fix main.tsx: disable OAuth redirect logic (redirectToLoginIfUnauthorized → Manus OAuth)

## New Feature Requests (Round 3)
- [x] Move all toast notifications to top of screen (top-center position)
- [x] Low-stock alert: highlight orders with qty < 50 pcs in Stock History (yellow/orange warning)
- [x] Admin Panel: add Deleted Logs History tab showing audit trail (who deleted, when, order details)
- [x] Deleted Logs tab: show deletedLogs table data via tRPC procedure

## User Level System (Approval Workflow)
- [x] Schema: add userLevel (1|2) column to workers table
- [x] Schema: create pendingRequests table (id, type, orderId, orderSnapshot, requestedBy, workerName, status, createdAt)
- [x] DB helpers: createPendingRequest, getPendingRequests, updatePendingRequestStatus
- [x] Router: pendingRequests.submit, pendingRequests.list, pendingRequests.approve, pendingRequests.cancel
- [x] Admin Panel: add User Level (1/2) selector to Add Worker form
- [x] Auth: expose userLevel in worker session (localStorage)
- [x] StockHistory: Level 1 workers - delete sends pending request instead of direct delete
- [x] StockHistory: Level 1 workers - Used Update sends pending request instead of direct update
- [x] StockHistory: Level 2 workers - keep current direct action behavior
- [x] Approval Center page: Level 2 workers can see pending requests and approve/cancel
- [x] Home page: show Approval Center link for Level 2 workers

## Approval Center & Notification Badge Updates
- [x] Show Approval Center card for both Level 1 and Level 2 users on Home page
- [x] Add bell icon with pending request count badge in Home hero section (top-right)
- [x] Level 1 users in Approval Center: can view and cancel their own requests only (no Approve button)
- [x] Level 2 users in Approval Center: can both Approve and Cancel all requests

## Advanced Approval & Notification Features
- [x] Server: add pendingRequests.getPendingUsedQty procedure (returns total pending used qty for a given orderId)
- [x] StockHistory: Used Update dialog shows "Available Qty" = current qty minus pending used qty
- [x] StockHistory: warn if requested used qty exceeds available qty
- [x] Server: pendingRequests.cancel - restrict Level 1 users to cancel own requests only
- [x] ApprovalCenter: Level 1 users see Cancel button only on their own requests
- [x] Admin Panel: add Pending Requests tab (list all pending/approved/cancelled, approve/cancel actions)
- [x] Push Notifications: implement Web Push API (VAPID keys, service worker, subscription storage)
- [x] Push Notifications: notify Level 2 users when Level 1 submits a new pending request
- [x] Push Notifications: notify all users when a new order is submitted
- [x] Push Notifications: notify admin when a user logs in

## Advanced Approval & Notification Features
- [x] Server: add pendingRequests.getPendingUsedQty procedure
- [x] StockHistory: Used Update dialog shows Available Qty = current qty minus pending used qty
- [x] StockHistory: warn if requested used qty exceeds available qty
- [x] Server: pendingRequests.cancel - restrict Level 1 to cancel own requests only
- [x] ApprovalCenter: Level 1 users see Cancel button only on their own requests
- [x] Admin Panel: add Pending Requests tab
- [x] Push Notifications: Web Push API with VAPID keys and service worker
- [x] Push Notifications: notify Level 2 users on new pending request
- [x] Push Notifications: notify all users on new order submitted
- [x] Push Notifications: notify admin on user login

## UX & Desktop Improvements (Round 4)
- [x] SubmitOrder: Order ID field auto-uppercase
- [x] SubmitOrder: BQ Comment shortcut buttons (LR, MP, KL, LP, KC, WT)
- [x] Admin Panel: Export Orders to PDF and Excel
- [x] Desktop responsive redesign: sidebar navigation, wider layout, proper spacing

## Order ID Duplicate Check
- [x] Server: add checkOrderId procedure to orders router
- [x] SubmitOrder: real-time duplicate warning with debounce

## Approval Center Notification Sound
- [x] Create useNotificationSound hook using Web Audio API
- [x] Wire sound to new pending request detection in ApprovalCenter.tsx

## Admin Dashboard Summary Stats
- [x] Server: add system.adminStats procedure (total orders, pending requests, low-stock count)
- [x] AdminPanel: add summary stat cards in header area

## Documentation & Support Features
- [x] FAQ page: create dedicated FAQ component with common questions and answers
- [x] FAQ page: include Employee ID format, BQ Comment examples, Level 1/2 role differences
- [x] FAQ page: integrate into Documentation page with tab navigation
- [x] FAQ page: responsive design for mobile and desktop
- [ ] Video tutorials: integrate demo videos for Login, Submit Order, Approval Center (removed - placeholder videos not suitable)
- [x] System status page: show server uptime, maintenance schedules, recent updates
- [x] System status page: display system components status (Web Server, Database, API Gateway, etc.)
- [x] System status page: add to home page feature cards
- [x] System status page: responsive design and styling


## Future Improvements & Enhancements
- [ ] System status page: add real backend status procedure with actual uptime/response time data
- [ ] System status page: replace hardcoded maintenance schedule with database-backed entries
- [ ] System status page: integrate real-time system metrics from server monitoring
- [ ] Video tutorials: create demo videos for Login, Submit Order, Approval Center workflows
- [ ] Notification system: add email notifications for maintenance windows
- [ ] Analytics dashboard: add usage statistics and performance metrics


## Implementation Notes

### Video Tutorials - Placeholder URLs
The Video Tutorials component currently uses placeholder YouTube URLs (dQw4w9WgXcQ - Rick Roll video) for demonstration purposes. In production, these should be replaced with actual demo videos:
- Login tutorial video
- Submit Order tutorial video  
- Approval Center tutorial video
- Stock History tutorial video
- Admin Panel tutorial video
- Order Usage tutorial video

To update: Edit `client/src/components/VideoTutorials.tsx` and replace the `videoUrl` field in each tutorial object with the actual YouTube embed URL.

## UX Improvements - Confirmation & Welcome Messages
- [x] Login: show welcome message with employee name after successful login
- [x] Approval Center: add confirmation dialog before approving a request
- [x] Approval Center: add confirmation dialog before cancelling a request
- [x] Submit Order: add confirmation dialog before submitting a new order
- [x] Usage Update: add confirmation dialog before updating usage (Old Stock clear)
- [x] Level 1 Request (delete/usage): add confirmation dialog before sending request

## UX Improvements - Additional Confirmations (Gaps)
- [x] Usage Update (Level 2 Job No): add confirmation dialog before confirming Job No usage
- [x] Level 1 Request (Job No): add confirmation step before submitting Job No usage request
- [x] Level 1 Request (Delete): add confirmation step before submitting delete request

## Language Fix
- [x] Replace all Myanmar text in Login welcome message with English
- [x] Replace all Myanmar text in SubmitOrder confirmation dialog with English
- [x] Replace all Myanmar text in StockHistory dialogs (UsedUpdateDialog, UsedUpdateRequestDialog, DeleteRequestDialog) with English
- [x] Replace all Myanmar text in ApprovalCenter confirmation dialogs with English

## Login Page - Admin Contact
- [x] Add admin contact section to Login page (Employee Login tab)
- [x] Show Admin Name: HEiNANN and Contact No: 01159225408
- [x] Add WhatsApp direct link button (wa.me link) that opens WhatsApp chat directly
- [x] Guide users without Employee ID to contact admin

## Geo-Restriction Feature
- [x] Create useGeoCheck hook to detect user country via ipapi.co API
- [x] Create GeoRestricted component with bilingual notice (Myanmar + English)
- [x] Integrate geo-check into App.tsx to wrap all routes
- [x] Allow Malaysia (MY) and Myanmar (MM) only; show notice for all other countries
- [x] Include VPN warning message in bilingual notice

## Approval Center Enhancements
- [x] DB: add cancel_reason column to pending_requests table
- [x] DB: add approved_qty column to pending_requests table (Level 2 can edit qty before approving)
- [x] DB: create approval_action_log table to record Level 2 actions (approve/cancel/direct actions)
- [x] Server: update approveRequest procedure to accept approved_qty and log the action
- [x] Server: update cancelRequest procedure to require cancel_reason and log the action
- [x] Server: add getActionLog procedure to fetch Level 2 action history
- [x] UI: add qty edit input in approve confirmation dialog
- [x] UI: add cancel reason textarea in cancel confirmation dialog (required)
- [x] UI: add History tab in Approval Center showing Level 2 action log

## Approval Center Enhancements - Direct Action Logging
- [x] Server: log direct Level 2 actions (used update, old stock clear) into approval_action_log
- [x] Schema: add details column to approvalActionLog for human-readable descriptions
- [x] Schema: change actionType to varchar(64) to support direct_used_update and direct_old_stock types
- [x] Server: extend pendingRequests.actionLog to include direct Level 2 actions via same table
- [x] UI: Approval Center History tab shows both request reviews and direct Level 2 actions

## Admin Panel - Worker Edit Feature
- [x] Server: add updateWorker procedure to update Employee ID, name, department, and User Level
- [x] Server: validate that new Employee ID does not conflict with existing workers
- [x] UI: add Edit button to each worker row in Admin Panel Workers tab
- [x] UI: edit dialog with fields for Employee ID, name, department, and User Level
- [x] UI: confirmation step requiring user to re-enter the (new) Employee ID before saving
- [x] UI: show success toast after successful update

## Approval Center - Action History Fix
- [x] Rename "My Action History" tab to "Action History" in Approval Center
- [x] Make Action History tab visible to both Level 1 and Level 2 users
- [x] Server: actionLog procedure already returns all history (no filter by user)

## Used Update - Job No Extra Fields
- [x] Schema: add masterCard, boardSizeW, boardSizeL, scores columns to usageHistory table
- [x] Schema: run drizzle-kit generate and apply migration SQL
- [x] Server: update orders.logUsage procedure to accept and store masterCard, boardSizeW, boardSizeL, scores
- [x] Server: update logUsageHistory db helper to accept and store new fields
- [x] UI: show MasterCard, Modify Board Size (WxL), Scores fields in Used Update dialog when Job No is selected (Level 2)
- [x] UI: all new fields are optional but shown only for Job No usage type

## Used Update Dialog - Layout Fix
- [x] Remove "(optional)" text from MasterCard and Modify Board Size labels
- [x] Compact Board Size WxL inputs so they fit on mobile without overflow
- [x] Improve overall Used Update dialog styling for mobile and desktop
