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
- [x] Video tutorials: integrate demo videos for Login, Submit Order, Approval Center (removed - placeholder videos not suitable)
- [x] System status page: show server uptime, maintenance schedules, recent updates
- [x] System status page: display system components status (Web Server, Database, API Gateway, etc.)
- [x] System status page: add to home page feature cards
- [x] System status page: responsive design and styling


## Future Improvements & Enhancements
- [ ] System status page: add real backend status procedure with actual uptime/response time data (future)
- [ ] System status page: replace hardcoded maintenance schedule with database-backed entries (future)
- [ ] System status page: integrate real-time system metrics from server monitoring (future)
- [ ] Video tutorials: create demo videos for Login, Submit Order, Approval Center workflows (future)
- [ ] Notification system: add email notifications for maintenance windows (future)
- [ ] Analytics dashboard: add usage statistics and performance metrics (future)


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

## Used Update - Required Fields Fix
- [x] MasterCard: make required (red * asterisk), add validation
- [x] Board Size WxL: make required (red * asterisk), add validation
- [x] Scores: keep as optional with "(optional)" label

## Level 1 Used Update Request - Extra Fields
- [x] UI: add MasterCard field to Level 1 UsedUpdateRequestDialog
- [x] UI: add Board Size (W × L) field to Level 1 UsedUpdateRequestDialog
- [x] UI: add Scores field (optional) to Level 1 UsedUpdateRequestDialog
- [x] Server: update Level 1 request procedure to accept and store masterCard, boardSizeW, boardSizeL, scores
- [x] UI: validate MasterCard and Board Size as required before Submit for Approval

## Level 1 Used Update Request - Server-Side Handling (Gaps)
- [x] Server: update pendingRequests.approve to parse and persist masterCard, boardSizeW, boardSizeL, scores from Level 1 request actionData
- [x] Server: ensure Level 2 can edit these fields when approving (already implemented for direct Level 2 actions)

## Level 1 Used Update Request - Layout Fix
- [x] Compact Board Size WxL inputs so they fit on mobile without overflow
- [x] Improve overall Used Update Request dialog styling for mobile and desktop
- [x] Add scrollable container (max-h-[90vh]) for long content

## Show Extra Fields in Approval Center Request Cards (Used Update Type)
- [x] ApprovalCenter.tsx: Show MasterCard, Board Size (W×L), Scores in JOB USAGE section for used_update requests
- [x] Parse actionData JSON to extract masterCard, boardSizeW, boardSizeL, scores fields

## User Level 1.1 Implementation
- [x] Schema: add process_approved_qty, process_approved_by, process_approved_at fields to pendingRequests table
- [x] Run drizzle-kit generate and apply migration SQL
- [x] Server: add pendingRequests.processApprove procedure (Level 1.1 only)
- [x] UI: ApprovalCenter.tsx — Level 1.1 sees "Process Approve" button on Level 1 pending requests
- [x] UI: Process Approve dialog — title "Approve Request (process approved request)", shows Requested Qty, optional Approved Qty input
- [x] UI: Show "Process Approved" badge/indicator on request cards when process_approved_by is set
- [x] UI: AdminPanel.tsx — add "1.1" option to worker level dropdown in Add Worker and Edit Worker dialogs
- [x] UI: ApprovalCenter — Level 1.1 info banner explaining their role

## User Level 1.1 (Process Approve)
- [x] Schema: Add `processApprovedQty`, `processApprovedBy`, `processApprovedAt` columns to `pendingRequests`
- [x] Schema: Add `"1.1"` to workers `userLevel` enum
- [x] DB: Add `processApprovePendingRequest` helper in `server/db.ts`
- [x] Router: Add `pendingRequests.processApprove` procedure (Level 1.1 only)
- [x] Router: Update `workers.add` and `workers.update` to accept `"1.1"` level
- [x] Router: Allow Level 1.1 workers to submit requests and cancel their own
- [x] AuthContext: Widen `userLevel` type to include `"1.1"`
- [x] Login.tsx: Update type cast for `userLevel`
- [x] ApprovalCenter: Show `Process` button for Level 1.1 users
- [x] ApprovalCenter: Show `processApprovedBy` info banner on cards
- [x] ApprovalCenter: Process Approve dialog with optional qty override
- [x] AdminPanel: Add Level 1.1 button in Add/Edit worker dialogs
- [x] AdminPanel: Show purple badge for Level 1.1 workers
- [x] AppLayout: Show purple badge for Level 1.1 workers
- [x] Home.tsx: Show `(View & Process)` label for Level 1.1 on Approval Center card

## Approval Center - Show Extra Fields in Used Update Requests
- [x] ApprovalCenter: Show Master Card, Board Size (W×L), Scores in Job Usage section

## Level 1.1 Auto Process-Approve on Submit
- [x] Server: pendingRequests.submit — if worker is Level 1.1, auto call processApprovePendingRequest after creating request
- [x] StockHistory: Level 1.1 user sees same Used Update / Delete dialogs as Level 1
- [x] StockHistory: After Level 1.1 submits, show toast "Request submitted & auto process-approved"


## Approval Center — Job No Search Feature
- [x] ApprovalCenter.tsx: Add search input field when "All" tab is selected
- [x] Filter Used Update requests by Job No (exact or partial match)
- [x] Show search results in real-time as user types

## Notifications Upgrade — Broadcast to All Users
- [x] Server: update push notification logic to send to ALL subscribed users (not just Level 2)
- [x] Server: notify all users on Submit Order
- [x] Server: notify all users on Used Update (direct Level 2 action)
- [x] Server: notify all users on Request Use (Level 1 / 1.1 pending request submitted)
- [x] Server: notify all users on In Process (Level 1.1 process-approve)
- [x] Server: notify all users on Approved (Level 2 final approve)
- [x] Server: notify all users on Cancelled (Level 2 cancel)
- [x] Server: notify all users on Employee Login

## Access Restricted Page Upgrade
- [x] Upgrade GeoRestricted component with modern, polished design
- [x] Use multiple IP geolocation APIs for more reliable country detection
- [x] Add loading state while geo-check is in progress
- [x] Improve bilingual notice (Myanmar + English) with clearer messaging
- [x] Add retry/refresh button for users who may have VPN issues

## Usage History & Admin Panel Full Access + Login Version Display
- [x] Usage History: show MasterCard, Board Size (W×L), Scores columns in history table
- [x] Usage History: show Level 1.1 request info (process approved by) in history
- [x] Admin Panel: Full Access — approve/cancel pending requests from Admin Panel
- [x] Admin Panel: Full Access — process approve (Level 1.1 style) from Admin Panel
- [ ] Admin Panel: Full Access — direct Used Update / Delete from Admin Panel (bypass approval)
- [x] Admin Panel: show all worker levels including 1.1 in worker management
- [x] Login Page: display current version number (e.g. v2.5.0)

## Refresh Button Animation + Login Contact Fix
- [x] Add spinning animation to all refresh/reload buttons app-wide (ApprovalCenter, AdminPanel, StockHistory, etc.)
- [x] Login page: remove admin name (HEiNANN) and phone number display, keep only "Chat on WhatsApp" button

## Loading Screen Countdown + Refresh Animation Fix
- [x] GeoRestricted: show 30s countdown timer during loading screen
- [x] Approval Center: verify refresh button spin animation works correctly

## Action History — Show Level 1.1 Process Info After Final Approval/Cancellation
- [x] ApprovalCenter: show processApprovedBy/processApprovedAt/processApprovedQty in request cards even when status is "approved" or "cancelled"
- [x] ApprovalCenter: show "Processed" badge (purple outline) on approved/cancelled cards that have processApprovedBy set

## Access Restricted — 30s Countdown Fix
- [x] GeoRestricted: fix SVG ring to deplete from full→empty as countdown goes 30→0
- [x] GeoRestricted: number turns orange when countdown ≤ 10s
- [x] GeoRestricted: ring color changes blue→orange when countdown ≤ 10s
- [x] GeoRestricted: countdown stops immediately when geo API responds

## Approval Center — Block Level 1 Cancel When Process-Approved
- [x] ApprovalCenter: when Level 1 user clicks Cancel on a process-approved request, show error dialog instead of cancel dialog
- [x] Error message: "Your request has already been processed by [processApprovedBy]. You cannot cancel it at this stage. Please contact your supervisor."

## User Profile Panel in Header
- [x] AppLayout: make user badge (name + level) clickable to open a profile dropdown/panel
- [x] Profile panel: show worker name, worker ID, department, user level badge
- [x] Profile panel: quick links to Admin Panel (admin/level 2 only), Documentation, System Status
- [x] Profile panel: show logout button
- [x] Profile panel: close on outside click or Escape key

## Header / Home / Pages Fixes
- [x] AppLayout: remove standalone Logout button from mobile header (logout is already inside profile dropdown)
- [x] AppLayout: rename badge text from "H... Lv.X" to "User Profile"
- [x] Home: remove Admin Panel, Documentation, System Status quick-access cards
- [x] Documentation page: verify it works and has real content (routes /docs confirmed working)
- [x] System Status page: verify it works and has real content (routes /status confirmed working)

## Admin Panel Protection
- [x] AppLayout profile dropdown: Admin Panel link only shown to Level 2 users
- [x] AppLayout profile dropdown: clicking Admin Panel shows password dialog before navigating
- [x] AdminPanel.tsx: block direct URL access (/admin) for Level 1 and Level 1.1 users - redirect to home

## Login Page Animations
- [x] Tab switch (Employee ↔ Admin): slide + fade animation
- [x] Employee login success: full-screen success animation before navigating to home
- [x] Admin login success: full-screen success animation before navigating to admin panel

## Enhanced Welcome Toast
- [x] Login: show time-aware greeting (Good Morning/Afternoon/Evening) + pending count in welcome toast, 5s duration, all user levels

## Notifications / FAQ / Docs / Status / Responsive
- [x] Notifications: improve browser permission prompt UI (better onboarding card with bell icon, benefit text, dismiss button)
- [x] FAQ: create /faq route with AppLayout, add FAQ link in User Profile dropdown (all users)
- [x] Documentation: updated Employee Guide and Admin Guide to v2.5 features
- [x] Documentation: removed FAQ tab (double header issue) — FAQ button now navigates to /faq page directly
- [x] System Status: updated with 6 new May 7 entries, 10 system components including Geo-Restriction and Admin Access Control
- [x] Responsive: FAQ wrapped in AppLayout for /faq route; Home notification banner responsive on mobile/desktop

## Approval Flow UX Fixes (May 7)
- [x] Level 2 Approve dialog: show process qty vs requested qty conflict warning with option to override
- [x] Level 1 Request Use dialog: rename "Quantity to Use" field to "For This Modify Target Black How Many Pcs?" (separate from available qty display)
- [x] Level 1.1 Process dialog: rename title to "Process Approved", show Target Black QTY from Level 1 request, require qty input before confirming
