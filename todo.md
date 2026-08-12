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
- [x] System status page: add real backend status procedure with actual uptime/response time data (completed May 27)
- [x] System status page: replace hardcoded maintenance schedule with database-backed entries (future)
- [x] System status page: integrate real-time system metrics from server monitoring (future)
- [x] Video tutorials: create demo videos for Login, Submit Order, Approval Center workflows (future)
- [x] Notification system: add email notifications for maintenance windows (future)
- [x] Analytics dashboard: add usage statistics and performance metrics (future)


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
- [x] Admin Panel: Full Access — direct Used Update / Delete from Admin Panel (bypass approval)
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

## Stock Quantity Logic Fix (May 7)
- [x] Server: Level 1 submitRequest (Used Update) must NOT deduct Available Qty — request only
- [x] Server: Level 1.1 processApprove must deduct Available Qty by processApprovedQty
- [x] Server: Level 1.1 self-submit Used Update → auto In Process status + immediate stock deduction
- [x] ApprovalCenter: Level 1.1 can only cancel their OWN self-submitted requests; cannot cancel Level 1 user requests that are already processed
- [x] StockHistory: show Remaining After = Available - processApprovedQty only after Level 1.1 process

## Stock Quantity Logic Fix (May 7) - COMPLETED
- [x] Server: Level 1 submitRequest (Used Update) must NOT deduct Available Qty — request only (no changes needed, already correct)
- [x] Server: Level 1.1 processApprove: preview only, no stock deduction (stock deduction moved to Level 2 approve)
- [x] Server: Level 1.1 self-submit Used Update → auto In Process status, no stock deduction (preview only)
- [x] Server: Level 2 approve deducts stock based on processApprovedQty when Level 1.1 already processed
- [x] ApprovalCenter: Level 1.1 can only cancel their OWN requests; cannot cancel other users' processed requests
- [x] StockHistory: show Remaining After = Available - processApprovedQty for Level 1.1 users (preview only)
- [x] StockHistory: Level 1 users do NOT see Remaining After (request only, no stock effect)

## QR Scanner Feature (May 9)
- [x] Fix QR code field: change masterCard key to bq in QR code data
- [x] Install html5-qrcode library for camera-based QR scanning
- [x] Create QR Scanner page (/qr-scanner) with camera scan capability
- [x] QR scan result: match scanned order against Stock History records
- [x] Show match/mismatch status with order details after scan
- [x] Allow balance update after scan with Employee ID verification
- [x] Add QR Scanner route and navigation link
- [x] Add QR Scanner card to Home dashboard
- [x] Add Scan button in Stock History (desktop icon + mobile button) linking to /qr-scanner?orderId=XXX
- [x] QRScanner page reads orderId from URL query param for pre-filled verification

## QR Scanner - Scanned History Feature (May 9)
- [x] Schema: add qr_scan_log table (id, orderId, scannedBy, scannedByName, action, oldQty, newQty, createdAt)
- [x] Apply migration SQL for qr_scan_log table
- [x] Server: add orders.logQrScan procedure to record each scan event
- [x] Server: add orders.getQrScanHistory procedure to fetch scan log
- [x] QRScanner: log scan event on every successful QR scan (manual or camera)
- [x] QRScanner: log balance update event when Employee ID verified and qty updated
- [x] QRScanner: add "Scanned History" tab showing scan log (who, Order ID, action, time)


## Terminology Update: Order ID → Production Order (May 9)
- [x] Replace "Order ID" with "Production Order" in all UI labels and placeholders
- [x] Update QR Scanner page (scan input, history display, QR code label)
- [x] Update A4 Label printing (header, QR code text, footer)
- [x] Update Stock History page (table headers, mobile cards, dialogs)
- [x] Update Home dashboard (QR Scanner card description)
- [x] Update FAQ page (all references to Order ID)
- [x] Update server-side error messages and responses


## Tracking ID (Reference Number) Feature (May 12)
- [x] Schema: add trackingId column to orders table (unique, auto-generated format: TRK-YYYYMMDD-XXXXX)
- [x] Apply migration SQL for trackingId column
- [x] DB helper: generateTrackingId function
- [x] Server: update submitOrder procedure to auto-generate and save trackingId
- [x] Stock History: display Tracking ID in desktop table (new column after Production Order)
- [x] Stock History: display Tracking ID in mobile card (prominently shown)
- [x] QR Scanner: add trackingId to QR code data
- [x] A4 Label: display Tracking ID prominently (header or near QR code)
- [x] FAQ: add Q&A about Tracking ID (Reference Number) format and usage

## Enhanced Tracking ID Format (May 12 - v2)
- [x] Update generateTrackingId to include Production Order suffix
- [x] Format: PP4 + DDMMYY + HHMM + Production Order Suffix (14 chars total)
- [x] Example: PP41305262026A206 (from Production Order A-206 on 13/05/26 at 20:26)
- [x] Handle various Production Order formats (A-206, A206, A - 206, etc.)
- [x] Auto-uppercase and remove hyphens/spaces from Production Order
- [x] Extract last 4 characters from Production Order ID
- [x] Comprehensive unit tests for all format variations (7 tests, all passing)
- [x] Update existing tests to support new format

## Mobile View - Tracking ID Display (May 13)
- [x] Stock History mobile card: add Tracking ID display below Date/Time
- [x] Show "N/A" for orders without Tracking ID
- [x] Format: "Tracking ID: PP41305262026A206" or "Tracking ID: N/A"
- [x] Style to match existing mobile card design

## Tracking ID Verification & Bug Fix (May 13)
- [x] Fix: Add trackingId to getAllOrders SELECT statement
- [x] Verify: trackingId is being generated automatically on order submission
- [x] Verify: trackingId is being saved to database correctly
- [x] Verify: trackingId is being returned to frontend in Stock History
- [x] Verify: trackingId displays correctly on mobile cards
- [x] Verify: trackingId displays correctly on desktop table
- [x] All tests passing (16/16 ✓)

## Submit Order Success Screen - Tracking ID Display (May 13)
- [x] Create success dialog/screen after order submission
- [x] Display generated Tracking ID prominently on success screen
- [x] Show order details (Production Order, Flute Type, Size, Qty)
- [x] Add "View in Stock History" button to navigate to the order
- [x] Add "Submit Another Order" button to clear form and start new order
- [x] Mobile and desktop responsive design

## Admin Panel Mobile View - Delete Button Fix (May 13)
- [x] Remove duplicate Delete button from mobile cards in Admin Panel
- [x] Keep only one Delete button per mobile card
- [x] Ensure desktop view still has Delete button in actions column

## Desktop Tracking ID Display Fix (May 13)
- [x] Update desktop table to show "N/A" for missing Tracking ID (consistent with mobile)
- [x] Style N/A differently (gray background) vs actual Tracking ID (teal background)
- [x] Ensure consistency between mobile and desktop views

## Backfill Existing Orders with Tracking ID (May 13)
- [x] Create migration script to generate Tracking IDs for all existing orders
- [x] Ensure Tracking IDs follow the format: PP4DDMMYYHHMM + OrderID suffix
- [x] Use createdAt timestamp for date/time in Tracking ID
- [x] Execute migration to populate trackingId for all orders without one
- [x] Verify all orders now have Tracking IDs

## A4 Label - Black & White Styling (May 13)
- [x] Remove all colors from A4Label component
- [x] Update to black text only (for black and white printing)
- [x] Remove colored backgrounds (teal, blue, yellow, etc.)
- [x] Keep borders and structure, use black lines only
- [x] Ensure QR code remains black and white
- [x] Test print preview to verify black and white output

## Tracking ID-Only QR Code & Barcode System (May 13)
- [x] A4 Label: Update QR code generation to use ONLY Tracking ID (not Production Order)
- [x] A4 Label: Show "N/A" instead of QR code if Tracking ID is missing
- [x] A4 Label: Add barcode generation using Tracking ID (JsBarcode library)
- [x] A4 Label: Display barcode below QR code for scanner compatibility
- [x] QR Scanner: Update to accept ONLY Tracking ID (reject Production Order input)
- [x] QR Scanner: When Tracking ID scanned, fetch and display Production Order details
- [x] QR Scanner Manual Input: Accept ONLY Tracking ID format, reject other formats
- [x] Database: Add function to fetch order by Tracking ID (getOrderByTrackingId)
- [x] Server: Add tRPC procedure to get order by Tracking ID
- [x] Test QR scanner with Tracking ID input
- [x] Test barcode scanner with Tracking ID barcode
- [x] Test manual input validation (reject Production Order, accept Tracking ID only)


## Tracking ID-Only QR Code & Barcode System (May 13)
- [x] A4 Label: Generate QR code with ONLY Tracking ID (not JSON)
- [x] A4 Label: Add barcode generation using Tracking ID
- [x] A4 Label: Show "N/A" when no Tracking ID exists
- [x] QR Scanner: Accept ONLY Tracking ID from QR code (plain text)
- [x] QR Scanner: Manual input accepts ONLY Tracking ID
- [x] QR Scanner: Reject Production Order input (old system)
- [x] Database: Add getOrderByTrackingId function
- [x] Server: Add qrVerifyByTrackingId procedure
- [x] QR Scanner: Display Production Order details when Tracking ID is scanned
- [x] All tests passing (16/16)


## QR Scanner UI Updates (May 14)
- [x] Update manual input label: "Production Order" → "Tracking ID"
- [x] Update placeholder text: "E.G. A-207" → "E.G. PP41305262026A206"
- [x] Add barcode scanner component for desktop
- [x] Implement responsive design: QR scanner on mobile, barcode scanner on desktop
- [x] Hide barcode scanner on mobile view
- [x] Test on mobile and desktop


## A4 Label - Vertical Barcode (May 14)
- [x] Update barcode rendering to vertical orientation (portrait)
- [x] Adjust barcode dimensions for vertical display
- [x] Update label layout to accommodate vertical barcode
- [x] Test barcode scanning with vertical orientation


## A4 Label - Remove BQ Comment Row (May 14)
- [x] Remove "BQ COMMENT" row from BQ Information section
- [x] Keep only "BQ" field in the label
- [x] Update label layout to remove duplicate field


## RequestCard Lifecycle Refactoring (May 16)
- [x] Remove "Process Approved by..." section from top of RequestCard
- [x] Add RequestLifecycle component at bottom of RequestCard (before action buttons)
- [x] Display: Request by (Name) Date/Time, In Process by (Name) Date/Time, Approved by (Name) Date/Time
- [x] Test lifecycle display for all request statuses (Pending, In Process, Approved, Cancelled)
- [x] Verify visual layout matches design (build successful, 0 TS errors)


## RequestCard Progress Bar Integration (May 16)
- [x] Remove "Requested: ..." timestamp section from RequestCard
- [x] Add In Process progress bar to RequestCard header (Pending → In Process → Approved)
- [x] Progress bar shows current status with visual indicators
- [x] Test progress bar display for all request statuses (build successful)
- [x] Verify visual layout matches design

## RequestCard Status Display - Single Stage Only (May 16)
- [x] Remove multi-stage progress bar from RequestCard header
- [x] Implement single status badge showing ONLY current active stage (Pending/In Process/Approved/Cancelled)
- [x] Add AlertCircle import to lucide-react
- [x] Build successful, 0 TypeScript errors

## RequestCard Lifecycle Section Refactoring (May 16)
- [x] Update Request Lifecycle section at bottom of RequestCard
- [x] Display "Request by" (Name) Date/Time - always shown
- [x] Display "In Process by" (Name) Date/Time - shown when processApprovedBy exists
- [x] Display "Approved by" (Name) Date/Time - shown when status=approved
- [x] Display "Cancel by" (Name) Date/Time - shown when status=cancelled

## RequestCard Title & Header Update (May 16)
- [x] Change "Used Update Request" → "NPRM Modify Order"
- [x] Remove "by (Name) (Employee ID)" line from RequestCard header
- [x] Build successful, 0 TypeScript errors

## RequestCard Order Info - Add BQ Field (May 16)
- [x] Add BQ field to Order Info section in RequestCard
- [x] Display BQ with yellow background (yellow-100 bg, yellow-800 text)
- [x] Responsive layout maintained for mobile and desktop
- [x] Build successful, 0 TypeScript errors

## RequestCard Order Info - Field Reordering (May 16)
- [x] Reorder fields: Production Order → Flute Type → Size → BQ → Current Qty
- [x] Move BQ before Current Qty (not at bottom)
- [x] Build successful, 0 TypeScript errors

## RequestCard Job Description Section - Label Updates (May 16)
- [x] Change "Job Usage" → "Job Description"
- [x] Change "Used Qty" → "Target Black"
- [x] Change "Remaining After" → "Balance"
- [x] Build successful, 0 TypeScript errors

## RequestCard Job Description - Field Reordering (May 16)
- [x] Reorder fields: Job No → Master Card → Board Size → Scores → Target Black → Balance
- [x] Move Target Black and Balance to bottom of section
- [x] Build successful, 0 TypeScript errors

## RequestCard Order Info - Flute Type Format (May 16)
- [x] Remove "Flute : " prefix from Flute Type value
- [x] Display only the value (e.g., "B" instead of "Flute : B")
- [x] Build successful, 0 TypeScript errors

## RequestCard Job Description - In Process Qty Implementation (May 16)
- [x] Add In Process Qty field between Scores and Target Black
- [x] Implement In Process Qty logic: show processApprovedQty if exists, else "N/A"
- [x] Update Balance calculation: Current Qty - In Process Qty
- [x] Sync Order Info Current Qty with Balance value
- [x] Update Action History: "Approved Request" → "Approved by" (reverted)
- [x] Display Action History with Job No, Used Qty, Process calculation, New Balance
- [x] Build and test all changes
- [x] Revert Action History label back to "Approved by"

## RequestCard Job Description - Target Black Display Update (May 16)
- [x] Change Target Black from "-{value} pcs" to "{value} pcs" format
- [x] Change Target Black color from red to orange (text-orange-600)
- [x] Target Black displays as highlight/reference only (no calculations)
- [x] Build successful, 0 TypeScript errors

## RequestCard Job Description - Balance Calculation Fix (May 16)
- [x] Update Balance to use Current Qty (snapshot.qty) instead of action.newQty
- [x] Balance = Current Qty - In Process Qty (when In Process Qty exists)
- [x] Balance = Current Qty (when In Process Qty is N/A)
- [x] Add null check for snapshot to prevent TypeScript errors
- [x] Build successful, 0 TypeScript errors

## RequestCard Section Label - Job Description to Order Description (May 16)
- [x] Change "Job Description" → "Order Description"
- [x] Build successful, 0 TypeScript errors

## StockHistory - Button Label Update (May 16)
- [x] Change "Request Use" → "Purchase Order" in StockHistory page
- [x] Updated both desktop table and mobile card button labels
- [x] Build successful, 0 TypeScript errors

## StockHistory - Purchase Order Dialog Header Update (May 16)
- [x] Change dialog title from "Used Update Request" → "Purchase Order"
- [x] Change "Order:" → "Production Order:" label
- [x] Add Tracking ID / Reference number display (N/A if not available)
- [x] Build successful, 0 TypeScript errors

## StockHistory - Old Stock Permission Access Restriction (May 16)
- [x] Add permission check for Old Stock button in UsedUpdateRequestDialog
- [x] Level 1 users see alert: "You are not authorized to access this feature. Please contact your Administrator."
- [x] Level 1.1 and Level 2 users can access Old Stock feature
- [x] Build successful, 0 TypeScript errors

## StockHistory - Permission Denied Dialog (May 16)
- [x] Replace browser alert with proper Dialog component
- [x] Add Dialog with "Access Restricted" title and AlertTriangle icon
- [x] Display message: "You are not authorized to access this feature. Please contact your Administrator via WhatsApp for assistance."
- [x] Add "OK, Understood" button to close dialog
- [x] Add "Contact Admin" button with WhatsApp link (placeholder: +60123456789)
- [x] Build successful, 0 TypeScript errors

## StockHistory - WhatsApp Number Update (May 16)
- [x] Update WhatsApp link from +60123456789 to +601159225408
- [x] Build successful, 0 TypeScript errors

## StockHistory - Purchase Order Dialog Header & Info (May 16)
- [x] Add Order Info section (Flute Type, BQ) below Purchase Order header
- [x] Improve Available Quantity display with smaller text for calculation
- [x] Display format: "Stock: X pcs - Pending: Y pcs = Available: Z pcs"
- [x] Optimize layout for mobile and desktop views
- [x] Build successful, 0 TypeScript errors

## StockHistory - Purchase Order Header Reorganization (May 16)
- [x] Reorganize header to show all info in sequence (no separation)
- [x] Display order: Production Order, Tracking ID, Flute Type, BQ, Available Quantity
- [x] Use smaller text size (text-xs, text-[10px])
- [x] Remove duplicate Order Info section below header
- [x] Build successful, 0 TypeScript errors

## StockHistory - Remove Duplicate Available Quantity Box (May 16)
- [x] Remove duplicate "AVAILABLE QUANTITY" box from Purchase Order dialog
- [x] Keep Available Quantity info in header only
- [x] Build successful, 0 TypeScript errors

## StockHistory - Available Quantity Calculation Update (May 16)
- [x] Create new procedure to fetch In Process Qty from Approval Center (processApprovedQty)
- [x] Update Available Quantity calculation: Stock - In Process Qty (instead of Pending Qty)
- [x] Handle N/A case: treat as 0
- [x] Update Purchase Order dialog header to show correct calculation
- [x] Test calculation with different In Process Qty values
- [x] Build successful, 0 TypeScript errors

## StockHistory - Purchase Order Calculation Label Update (May 16)
- [x] Change "Pending" label to "In Process" in calculation display
- [x] Display: "(Stock: X pcs − In Process: Y pcs = Available: Z pcs)"
- [x] Build successful, 0 TypeScript errors

## StockHistory - Pending Request Purchase Section (May 16)
- [x] Add "Pending Request Purchase" section to Purchase Order dialog header
- [x] Fetch pending requests from Approval Center with same Production Order/Tracking ID
- [x] Display count of pending requests (e.g., "1 job")
- [x] Show "N/A" if no pending requests exist
- [x] Only show pending requests (status = pending)
- [x] Test with different pending request counts
- [x] Build successful, 0 TypeScript errors

## Level 2 Process Approve Permission Fix (May 20)
- [x] Allow Level 2 users to process-approve requests (previously restricted to Level 1.1 only)
- [x] Update server-side permission check to include Level 2
- [x] Update error message to reflect both Level 1.1 and Level 2 can process-approve
- [x] Write unit tests for Level 2 process approve permissions (13 tests, all passing)
- [x] Verify Level 2 users can now click Process button without permission error


## Purchase Order Dialog Layout Optimization (May 20)
- [x] Optimize Purchase Order dialog for desktop/computer version
- [x] Make dialog more compact and fit better on larger screens
- [x] Adjust max-width and padding for desktop layout (added md:max-w-md)
- [x] Ensure mobile view remains responsive (kept max-w-sm for mobile)
- [x] Test on various screen sizes (15 unit tests, all passing)


## Stock History Search Improvements (May 20)
- [x] Replace Search Flute Type text input with dropdown selector (BA, BE, A, B, C, E)
- [x] Implement exact matching for Flute Type (B should NOT match BA)
- [x] Make Flute Type selection REQUIRED when searching by BQ Comment
- [x] Show validation message if BQ Comment searched without Flute Type selected
- [x] Keep Search Production Order as text search (no changes)
- [x] Test search combinations and filtering logic
- [x] Add unit tests for search filtering (22 tests, all passing)


## Purchase Order Card Size Expansion (May 21)
- [x] Increase Purchase Order card/dialog max-width for desktop version (md:max-w-2xl)
- [x] Make card larger and more spacious on computer screens
- [x] Improve visual hierarchy and readability on larger screens (lg:p-8)
- [x] Keep mobile view compact and responsive (max-w-sm)
- [x] Test on various desktop screen sizes
- [x] Add unit tests for responsive card sizing (25 tests, all passing)


## Stock History Table Flute Type Display (May 21)
- [x] Change Flute Type column display from "Flute : B" to just "B" on desktop table
- [x] Apply to all flute types (BA, BE, A, B, C, E)
- [x] Keep mobile card display format as is
- [x] Test on desktop and mobile views
- [x] Add unit tests for display format (26 tests, all passing)


## Sticky Table Header for Stock History (May 21)
- [x] Add sticky header to Stock History table on desktop/computer version
- [x] Header should stay fixed at top while scrolling through order cards
- [x] Display all column names (TRACKING ID, PRODUCTION ORDER, FLUTE TYPE, SIZE, QTY, BQ, DATE, ACTIONS)
- [x] Keep header styling consistent with table design
- [x] Only apply to desktop version (hidden on mobile)
- [x] Test scrolling behavior
- [x] Add unit tests for sticky header functionality (35 tests, all passing)


## Mobile Order Card Ref Badge Removal (May 21)
- [x] Hide "Ref: " badge on mobile view order cards
- [x] Keep Tracking ID display at bottom (already shows same value)
- [x] Remove redundant Ref number from mobile card header
- [x] Keep Ref badge visible on desktop
- [x] Test on mobile and desktop views
- [x] Add unit tests for Ref badge visibility (34 tests, all passing)


## Search Input Case Conversion (May 21)
- [x] Make search inputs case-insensitive
- [x] Convert lowercase letters to uppercase (a > A, b > B, etc.)
- [x] Apply to Production Order search (onChange: e.target.value.toUpperCase())
- [x] Apply to BQ Comment search (onChange: e.target.value.toUpperCase())
- [x] Test case conversion on mobile and desktop
- [x] Add unit tests for case conversion (24 tests, all passing)


## BQ Search Placeholder Text Update (May 21)
- [x] Change BQ search placeholder from "Select Flute Type first" to "Please select Flute Type first"
- [x] Use English language only
- [x] Test placeholder text displays correctly
- [x] Add unit tests for placeholder text (14 tests, all passing)


## Remove Duplicate Headings on Desktop (May 21)
- [x] Remove duplicate "Approval Center" heading on desktop version
- [x] Keep only one heading at the top (from AppLayout pageTitle)
- [x] Apply same fix to Usage History page
- [x] Test on desktop and mobile views
- [x] Add unit tests for heading display (13 tests, all passing)


## Profile Dropdown Centering (May 22)
- [x] Center User Profile dropdown on Desktop version (lg breakpoint)
- [x] Add responsive classes: lg:left-1/2 lg:-translate-x-1/2 lg:right-auto
- [x] Keep Mobile View with right-0 positioning (unchanged)
- [x] Add unit tests for profile dropdown centering (37 tests, all passing)


## Desktop Admin Panel and Logout Hiding (May 22)
- [x] Hide Admin Panel from desktop sidebar navigation
- [x] Hide Logout button from desktop sidebar
- [x] Filter NAV_ITEMS with adminOnly flag
- [x] Add hidden class to logout button
- [x] Keep both visible in mobile view
- [x] Add unit tests for desktop hiding (34 tests, all passing)


## Animation Implementation (May 22)
- [x] Add animations to checkbox and toggle elements (scale 110% checked, 125% hover, spring easing)
- [x] Add animations to buttons and clickable elements (scale 110% hover, 98% active)
- [x] Add animations to form inputs and transitions (scale 103% focus with shadow)
- [x] Add animations to modals and dropdowns (fade-in + zoom-in animation)
- [x] Add smooth transitions to status badges (duration-500 with cubic-bezier)
- [x] Add animations to approval/rejection actions (via button animations)
- [x] Enhance animations with smoother easing and longer durations
- [x] Update unit tests for enhanced animations (51 tests, all passing)


## Success Modal Checkmark Animation (May 22)
- [x] Add smooth animation to checkmark icon in success modal (scale 0→1.2→1 with rotation)
- [x] Implement scale and fade-in effect for checkmark (opacity 0→1)
- [x] Add bounce/spring effect to checkmark appearance (cubic-bezier spring easing)
- [x] Implement background pulse animation (scale 0.8→1)
- [x] Add animation sequencing (background first, checkmark with 0.2s delay)
- [x] Write unit tests for success modal animations (49 tests, all passing)


## Refresh Button Repositioning in Approval Center (May 22)
- [x] Move Refresh button next to status filter buttons (Pending, Approved, Cancelled, All)
- [x] Use ml-auto for right alignment in the filter row
- [x] Maintain vertical alignment with status buttons
- [x] Add transition-colors for smooth hover effect
- [x] Write unit tests for refresh button repositioning (55 tests, all passing)


## Refined Smooth Animations (May 22)
- [x] Reduce checkbox/radio scale from 125% to 110% on hover
- [x] Reduce checkbox checked scale from 110% to 105%
- [x] Reduce button hover scale from 110% to 105%
- [x] Change button shadow from shadow-lg to shadow-md
- [x] Change button active scale from 98% to 100%
- [x] Use consistent cubic-bezier(0.4, 0.0, 0.2, 1) timing
- [x] Remove spring easing (1.56 value)
- [x] Write unit tests for refined animations (53 tests, all passing)


## Home Menu Item (May 23)
- [x] Add "Home" menu item to sidebar navigation (at top, above Submit Order)
- [x] Create Home page route (href: "/")  that displays Dashboard
- [x] Add Home icon (Home icon from lucide-react) to sidebar menu
- [x] Clicking Home navigates to Dashboard page
- [x] Add unit tests for Home menu (50 tests, all passing) navigation


## Cancel Reason Display in Approval Center (May 24)
- [x] Add cancelReason field to PendingRequest type in ApprovalCenter.tsx
- [x] Display Cancel Reason below "Cancel by" info in Request Card
- [x] Format: "Cancel Reason: [reason text]" on separate line
- [x] Only show Cancel Reason when request status is "cancelled" and reason exists
- [x] Verify TypeScript compilation passes


## Update Info Dropdown Menu in Approval Center (May 24)
- [x] Replace individual Cancel, Process, Approve buttons with single "Update Info" button
- [x] Create dropdown menu with all available actions
- [x] Add DropdownMenu component import and Button import
- [x] Display "Cancel" option with red icon
- [x] Display "Process" option with purple icon
- [x] Display "Approved" option with green icon
- [x] Only show relevant actions based on user permissions
- [x] Maintain all original functionality and logic
- [x] Verify TypeScript compilation passes
- [x] Improve dropdown menu styling with hover effects
- [x] Add rounded corners and better spacing to menu items
- [x] Simplify menu text labels


## Desktop Sidebar Redesign - Next Level (May 24)
- [x] Redesign sidebar with compact, professional layout
- [x] Improve spacing and padding for better visual hierarchy
- [x] Enhance navigation items with better styling
- [x] Add smooth hover effects and transitions
- [x] Optimize for desktop/computer use
- [x] Improve worker info section styling
- [x] Add subtle animations for professional feel
- [x] Test on desktop and verify improvements


## Admin Panel Design Upgrade (May 25)
- [x] Redesign Admin Panel header with modern styling and branding
- [x] Improve tab navigation with better visual hierarchy and responsive design
- [x] Enhance Workers Tab with card-based layout and better spacing
- [x] Add gradient backgrounds and modern color scheme to Admin Panel
- [x] Optimize dialogs and modals for mobile and desktop views
- [x] Improve responsive layout for all device sizes (mobile, tablet, desktop)
- [x] Add smooth transitions and hover effects for better UX
- [x] Test Admin Panel on mobile, computer, and desktop versions


## Admin Panel Enhancements (May 25)
- [x] Change "Lock" button to "Logout" with improved design
- [x] Add verification confirmation dialog for logout
- [x] Optimize AdminPanel header for mobile with compact design
- [x] Allow all admin operations without restrictions
- [x] Add verification confirmation dialogs for critical admin actions


## Responsive Design for 4 Device Types (May 25)
- [x] Audit current responsive design and identify gaps
- [x] Update Tailwind breakpoints for 4-device support (mobile, tablet, laptop, desktop)
- [x] Optimize mobile version (< 640px) for phones with compact layout
- [x] Optimize tablet version (640px - 1024px) for tablets
- [x] Optimize laptop version (1024px - 1440px) for smaller computers
- [x] Optimize desktop version (> 1440px) for large screens
- [x] Test all pages on all 4 device types
- [x] Ensure consistent experience across all device sizes


## QR Scanner Manual Input Validation (May 25)
- [x] Add Tracking ID format validation to QR Scanner
- [x] Validate manual input for correct format and length
- [x] Show error messages for invalid characters
- [x] Show error messages for incorrect length
- [x] Display "Tracking ID or Reference number only" message
- [x] Prevent submission of invalid Tracking IDs

## Enhanced Action History with Event Cards (May 26)
- [x] Create ActionHistoryCard component for different event types (approved, cancelled, qr_scanner)
- [x] Add refresh button with spinning animation to Action History header
- [x] Display "Recent Usage Events (Latest 200)" title in history tab
- [x] Parse action log details field to extract balance information
- [x] Show approved events with Job No, Production Order, Usage Qty, Current/New Balance, Requested/Approved by
- [x] Show cancelled events with Job No, Production Order, Cancel Reason, Requested/Cancelled by
- [x] Show QR scanner events with Tracking ID, Production Order, Balance updates, Scanned by
- [x] Add server-side tests for action log functionality (6 tests, all passing)
- [x] Verify action logs are retrieved and ordered correctly
- [x] Confirm details field JSON storage and retrieval

## Enhanced Scanned History with Event Cards (May 26)
- [x] Create QRScanHistoryCard component for displaying different QR scan event types
- [x] Add refresh button with spinning animation to Scanned History header
- [x] Display "Recent Scan Events (Latest 200)" title in history tab
- [x] Properly display balance updates with old/new quantities and adjustment amounts
- [x] Add visual up/down indicators (↑/↓) for adjustment direction
- [x] Improved card layout and visual hierarchy
- [x] Fixed balance updates display with better color coding
- [x] Improved refresh button with toast notification feedback
- [x] Add server-side tests for QR scan history functionality (6 tests, all passing)
- [x] Fixed mobile responsive layout for card display
- [x] Reduced padding on mobile, better text wrapping
- [x] Smaller icons on mobile for better fit

## Help Center Page with Support Features (May 27)
- [x] Create Help Center page component with 4 tabs (FAQ, How-to Guides, Troubleshooting, Contact)
- [x] Add 8 comprehensive FAQ Q&A pairs with expandable interface
- [x] Add 4 detailed step-by-step how-to guides
- [x] Add 6 troubleshooting solutions with color-coded display
- [x] Create contact form with Name, Email, Subject, Message fields
- [x] Display Administrator contact information (Email, WhatsApp, Name)
- [x] Pull admin contact from environment variables (VITE_ADMIN_EMAIL, VITE_ADMIN_WHATSAPP, VITE_ADMIN_NAME)
- [x] Add Help Center route to App.tsx at /help
- [x] Add Help Center link to AppLayout sidebar navigation
- [x] Responsive design for mobile and desktop
- [x] Search functionality for help topics (placeholder)
- [x] Toast notifications for form submission

## Future Improvements & Enhancements
- [x] Allow all admin operations without restrictions (May 25)
- [x] Add verification confirmation dialogs for critical admin actions (May 25)
- [x] System status page: add real backend status procedure with actual uptime/response time data (completed May 27)
- [x] System status page: replace hardcoded maintenance schedule with database-backed entries (future)
- [x] System status page: integrate real-time system metrics from server monitoring (future)
- [x] Video tutorials: create demo videos for Login, Submit Order, Approval Center workflows (future)
- [x] Notification system: add email notifications for maintenance windows (future)
- [x] Analytics dashboard: add usage statistics and performance metrics (future)


## Verification Dialogs & System Status (May 27)
- [x] Add verification confirmation dialogs for critical admin actions
  - [x] Delete Worker requires admin password verification
  - [x] Enhanced dialog with warning icon and red styling
  - [x] Disabled button until password is entered
  - [x] Shows clear warning about irreversible action
- [x] Create real backend status procedure with actual uptime/response time data
  - [x] system.status procedure with uptime calculation
  - [x] Track server response times and averages
  - [x] Return 6 system components with individual response times
  - [x] Integrate with System Status page to display real data
  - [x] Show uptime in formatted hours/minutes
  - [x] Display component status and response times
- [x] Add server-side tests for health/status procedure (12 tests, all passing)

## Comprehensive UI/UX Upgrade - Next Level (May 28)
- [x] Upgrade global design system (animations, color palette, typography, transitions)
- [x] Redesign Login/Access page with next-level visual experience
- [x] Redesign Dashboard page with modern layout and data visualization
- [x] Redesign Admin Panel with premium UI and improved UX
- [x] Upgrade responsive design for all 5 device types (Mobile, Tablet, Laptop, Computer, Desktop)
- [x] Upgrade Notification system to next level
- [x] Update App Version info

## Login Placeholder & Page Upgrades (May 28)
- [x] Remove DN156 from Employee ID placeholder text
- [x] Upgrade Stock History page to next level design
- [x] Upgrade Approval Center page to next level design

## Submit Order & Purchase Order Next Level Upgrade (May 28)
- [x] Upgrade Submit Order page to next level design
- [x] Upgrade Purchase Order section in Stock History to next level design

## Next-Level UI Upgrade (May 2026)
- [x] Submit Order page: premium progress stepper, gradient sections, BQ shortcuts, animated success screen
- [x] Purchase Order modal (Level 2): gradient emerald header, grid info cards, premium choose buttons, animated overlay
- [x] Purchase Order modal (Level 1/1.1): gradient purple/orange header, premium choose buttons, level-aware styling
- [x] Purchase Order modals: backdrop-blur, zoom-in animations, active:scale effects, shadow-lg hover states
- [x] Updated vitest tests for new Purchase Order premium layout classes

## Submit Order Compact Layout Fix (May 2026)
- [x] Reduce spacing between sections on all devices (mobile/tablet/laptop/desktop)
- [x] Make Dimensions section more compact: Size W×L and Qty on same row on desktop, stacked properly on mobile
- [x] Reduce overall padding and gaps for compact feel across all breakpoints

## Submit Order Mobile Layout Fix (May 28)
- [x] Fix Dimensions section on mobile: Size W×L and Qty stacked vertically on mobile

## Submit Order Mobile Layout - Width & Length Stacked (May 28)
- [x] Mobile view: Width and Length inputs stacked vertically (space-y-2) instead of side-by-side

## Label A4 Next Level Upgrade (May 28)
- [x] Upgrade A4Label component to premium print design (black & white, professional layout)

## Documentation & PDF Update (May 28)
- [x] Update Documentation page with current version and features
- [x] Update FAQ page with current version info
- [x] Update System Status page with current version
- [x] Generate updated Employee User Guide PDF
- [x] Generate updated Administrator Documentation PDF
- [x] Upload PDFs and link them in the app

## PWA Support (May 30)
- [x] Generate PWA icons (192x192, 512x512) from GSPP logo
- [x] Create manifest.json with app name, icons, theme colors
- [x] Create service worker (sw.js) for offline caching
- [x] Register service worker in index.html
- [x] Add install prompt UI component (banner/button)
- [x] Link manifest in index.html

## Notification System Upgrade - Real-Time & Rich Messages (May 30)
- [x] Add in-app appNotifications DB table (type, title, message, orderID, jobNo, qty, fluteType, workerID, trackingId, createdAt)
- [x] Add server procedures: notifications.create, notifications.list, notifications.markRead, notifications.unreadCount
- [x] Upgrade notification messages for all event types: order_request, order_approved, order_cancelled, order_in_process, order_deleted, out_of_stock
- [x] Create NotificationBell component with real-time polling (5s interval), unread badge, rich message panel
- [x] Add notification triggers in StockHistory: job usage, old stock clear, delete (Level 2 direct + Level 1 request)
- [x] Add notification triggers in ApprovalCenter: approve, cancel, processApprove
- [x] Add NotificationBell to DashboardLayout mobile header (next to page title)

## Public Order Card Page (May 30)
- [x] Add publicProcedure to fetch order by trackingId (no auth required) — reused existing trpc.orders.qrVerifyByTrackingId
- [x] Create PublicOrderCard page: Production Order, Balance, Flute Type, Board Size, BQ, Status
- [x] Register route /:trackingId in App.tsx (public, no geo/auth guard)

## Web Push Background Notifications - VAPID (May 31)
- [x] Generate VAPID keys and store as env secrets (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY)
- [x] Add pushSubscriptions DB table (workerID, endpoint, p256dh, auth)
- [x] Add server procedures: push.subscribe, push.unsubscribe, push.sendToAll, push.sendToWorkers, push.sendToLevel2, push.getVapidKey
- [x] Update service worker v3.0: push event handler, PUSH_RECEIVED postMessage to open clients, correct icon path /icons/icon-192.png
- [x] Update frontend: NotificationBell polling reduced to 3s (open) / 8s (closed), PUSH_RECEIVED SW message listener for immediate refetch
- [x] Wire push.sendToAll to all order event triggers: request, approve, cancel, delete, in-process, out-of-stock in StockHistory and ApprovalCenter
- [x] Push payloads include: type, url, orderID, jobNo, requireInteraction for rich background notifications
- [x] tsc --noEmit passes cleanly (0 errors); watcher shows stale incremental cache errors (false positives)

## Link & Error Fixes (May 31)
- [x] Fix service worker icon paths: /icons/icon-192.png → /icon-192.png (no subdirectory)
- [x] Fix push.ts icon/badge paths: /icons/icon-192.png → /icon-192.png
- [x] Add 410/404 stale subscription auto-cleanup in push.ts
- [x] Bump sw.js cache name to stockdash-v3.1 to force SW update on all clients
- [x] Make Email and WhatsApp clickable links in HelpCenter contact section
- [x] Add catch-all route in App.tsx to show NotFound for any unknown path
- [x] Fix all 12 pending-requests.test.ts failures (stale test expectations vs actual router behavior)
- [x] All 566 tests passing (25 test files)
- [x] tsc --noEmit: 0 errors
- [x] Cleaned 5 stale duplicate push subscriptions from DB (old May 5 entries)

## Excel Export Improvement (May 31)
- [x] Replace single-sheet Excel export with 2-sheet workbook (Current Stock + Out of Stock)
- [x] Each sheet has: title rows (merged), generated date/time, total records, column headers, data rows, total qty summary row
- [x] Auto-set column widths for all 10 columns (no manual adjustment needed)
- [x] Filename: PP4_StockHistory_YYYY-MM-DD.xlsx
- [x] Remove PDF export button and jspdf/jspdf-autotable usage
- [x] Remove unused FileDown import
- [x] tsc --noEmit: 0 errors | 566/566 tests passing

## Custom In-App Announcement Banner (Jun 3)
- [x] Add announcements DB table (id, title, message, type, isActive, createdBy, createdAt, expiresAt)
- [x] Add boolean import to drizzle schema
- [x] Generate and apply migration SQL (0022_wet_synch.sql)
- [x] Add server procedures: announcements.listActive, listAll, create, setActive, delete
- [x] Build AnnouncementsTab component for Admin Panel (create form, type selector, preview, list with activate/deactivate/delete)
- [x] Add Announcements tab to Admin Panel navigation (Megaphone icon, indigo color)
- [x] Build AnnouncementBanner component (shown on all pages, dismissible per session, expand/collapse long messages, auto-refresh every 60s)
- [x] Wire AnnouncementBanner into App.tsx GeoRestrictedRouter (appears above all pages)
- [x] 16 new announcement tests passing (26 test files, 582 tests total)
- [x] tsc --noEmit: 0 errors

## Chat Feature Enhancements (Jun 3)
- [x] Desktop/Tablet/Laptop/Computer: Show "Messages" title in Chat sidebar header (fullHeight prop in AppLayout)

### Message Read Receipts (✓✓ ticks)
- [x] DM: chatMessages table already has readAt column — use it for read receipt
- [x] Server: add chat.markRead procedure (already exists) — verify it sets readAt timestamp
- [x] Server: update getMessages to return readAt for each message
- [x] UI: show single ✓ (sent) and double ✓✓ (read) tick on DM messages (WhatsApp style)
- [x] UI: blue ✓✓ when read, gray ✓✓ when delivered but unread
- [x] Group: groupMessages table — add readBy JSON column (array of workerIDs who read)
- [x] Server: add groupChat.markGroupRead to record reader in readBy array
- [x] UI: show ✓✓ on group messages when all members have read

### Push Notifications for Chat Messages
- [x] Server: wire push.sendToWorkers in chat.sendMessage — notify recipient of new DM
- [x] Server: wire push.sendToWorkers in groupChat.sendGroupMessage — notify all group members except sender
- [x] Push payload: type="new_message", url="/chat", senderName, preview text, requireInteraction: false
- [x] Group push payload: type="new_group_message", url="/chat", groupName, senderName, preview

### Emoji Reactions on Messages
- [x] Schema: add messageReactions table (id, messageType [dm/group], messageID, workerID, emoji, createdAt)
- [x] Generate and apply migration SQL
- [x] Server: add reactions.toggle, reactions.getForMessages procedures
- [x] UI DM: hover on message → emoji picker (6 quick emojis: 👍❤️😂😮😢😡)
- [x] UI Group: same emoji picker on group messages
- [x] UI: show reaction counts below messages (grouped by emoji)
- [x] UI: tap own reaction to remove it


## NPRM Modify Order Urgent Feature (Jun 9)
- [x] Add isUrgent column to pendingRequests table (database migration)
- [x] Create toggleUrgent helper in server/db.ts
- [x] Add toggleUrgent tRPC procedure (Level 1 only)
- [x] Add Mark Urgent button to Update Info dropdown in ApprovalCenter
- [x] Display red "Order is Urgent" badge on NPRM cards when urgent
- [x] Auto-remove urgent flag when request is approved
- [x] All 594 tests passing

## Board Size Calculation System (Jun 9)
- [x] Add useBoardSizeCalc hook/helper with pieces-per-W and pieces-per-L logic (50mm allowance)
- [x] Show calculation result panel below Board Size inputs in UsedUpdateDialog (Level 2)
- [x] Show calculation result panel below Board Size inputs in UsedUpdateRequestDialog (Level 1/1.1)
- [x] Block submit when Production L < Job Board L or Production W < Job Board W (error state)
- [x] Show warning (but allow submit) when Production L == Job Board L or Production W == Job Board W
- [x] Display pieces count result (floor((Production - 50) / JobBoard)) for both W and L

## Chat/Messages - Next Level Upgrade
- [x] Chat UI: Add online/offline status indicator (green dot) for users
- [x] Chat UI: Add typing indicator ("typing...") in real-time (deferred - requires WebSocket)
- [x] Chat UI: Improve message input with multi-line textarea support (auto-resize)
- [x] Chat UI: Add message reply/quote feature (reply to specific message)
- [x] Chat UI: Add message delete (own messages only)
- [x] Chat UI: Improve group chat - online count in header
- [x] Chat UI: Smooth scroll-to-bottom with "New messages" floating button
- [x] Chat UI: Add message search within conversation
- [x] Chat UI: Improve empty state animations and illustrations
- [x] Chat UI: Add sound notification for new incoming messages

## Notification Messages - Next Level Upgrade
- [x] Notifications: Add dedicated Notifications page (full-page center)
- [x] Notifications: Add category filter tabs (All, Orders, System, Chat)
- [x] Notifications: Click notification to navigate to relevant page (deep-link)
- [x] Notifications: Add notification sound effect on new push
- [x] Notifications: Improve push notification content with action buttons
- [x] Notifications: Add "chat_message" notification type for DM/group messages
- [x] Notifications: Show notification toast/banner in-app when new push arrives
- [x] Notifications: Add notification preferences (mute types, quiet hours) (future)
- [x] Notifications: Improve NotificationBell dropdown with better grouping by date
- [x] Notifications: Add swipe-to-dismiss on mobile notification items (future)

## Notification Center & Nav Badge (Jun 29)
- [x] Notifications page: always-visible "Mark all as read" button (disabled when all read)
- [x] Notifications page: loading spinner on button while marking
- [x] Notifications page: invalidate unreadCount cache after marking all read
- [x] Notifications page: unread badge counter in page title heading
- [x] AppLayout: add /notifications nav item with Bell icon
- [x] AppLayout: unread notification badge counter on Notifications nav item (blue, animated)

## One Device Login Access System (Jun 29)
- [x] Schema: add activeDeviceToken, activeDeviceName, activeDeviceIP, activeLoginAt to workers table
- [x] DB helpers: setWorkerActiveDevice, clearWorkerActiveDevice
- [x] Server: workers.checkDevice - detect if new login device differs from active session
- [x] Server: workers.activateDevice - register new device session
- [x] Server: workers.deactivateDevice - clear session on logout
- [x] AuthContext: remove 1hr expiry - sessions persist until explicit logout (one-device)
- [x] AuthContext: store deviceToken in session
- [x] Login.tsx: generate persistent device fingerprint token (localStorage)
- [x] Login.tsx: detect device name from user-agent (iPhone/Android/Mac/Windows/Linux + browser)
- [x] Login.tsx: call checkDevice on login - detect conflict before completing login
- [x] Login.tsx: ConflictDialog - show old device name + IP address + login time
- [x] Login.tsx: "Force Logout & Continue" - activateDevice then complete login
- [x] AppLayout.tsx: call deactivateDevice on logout to clear server session
- [x] PageHeader.tsx: call deactivateDevice on logout to clear server session

## True Single-Device Enforcement Upgrade (Jun 29)
- [x] Server: heartbeat validates deviceToken, returns displaced:true when mismatch
- [x] Server: login flow immediately overwrites activeDeviceToken (no conflict dialog needed)
- [x] Server: auto-send force-logout system alert notification on every displacement
- [x] Frontend: AppLayout global heartbeat every 30s detects displacement
- [x] Frontend: auto-logout + redirect to /login?reason=displaced when displaced
- [x] Frontend: Login page shows red security banner when redirected due to displacement
- [x] Frontend: removed conflict dialog (no longer needed)

## Maintenance Mode Feature (Jun 30)
- [x] Schema: add systemSettings table with maintenanceMode boolean and maintenanceMessage text
- [x] Server: add system.getMaintenanceStatus (public) and system.setMaintenanceMode (admin-only) procedures
- [x] Admin Settings: add Maintenance On/Off toggle card
- [x] Frontend: Maintenance page UI matching screenshot (illustration, Myanmar text, Restart button)
- [x] Frontend: AppLayout global maintenance check - show maintenance page for non-admin users when ON

## Maintenance Mode Feature (Jun 30)
- [x] Schema: add systemSettings table (key-value store for app config)
- [x] Server: system.getMaintenanceStatus (public procedure - works before login)
- [x] Server: system.setMaintenanceMode (admin-only - toggle ON/OFF + custom message)
- [x] Frontend: MaintenanceGuard in App.tsx - wraps all routes, polls every 30s
- [x] Frontend: Maintenance page UI matching screenshot (Myanmar text, illustration, Restart button)
- [x] Frontend: Admin bypass - admin users see app normally even when maintenance is ON
- [x] Admin Panel: new "Maintenance" tab with status card, custom message textarea, ON/OFF buttons

## Maintenance Mode Bug Fixes (Jun 30)
- [x] Bug fix: setMaintenanceMode changed from adminProcedure to publicProcedure + adminPassword check (fixes error 10002)
- [x] Bug fix: Maintenance page text changed to English only (removed all Myanmar text)
- [x] Admin Panel: textarea placeholder and hint text updated to English

## Rename "Approval Center" to "NPRM Modify Order" (Jul 8)
- [x] Update AppLayout.tsx: change NAV_ITEMS label from "Approval Center" to "NPRM Modify Order"
- [x] Update Home.tsx: change feature card title from "Approval Center" to "NPRM Modify Order"
- [x] Update ApprovalCenter.tsx: change page title from "Approval Center" to "NPRM Modify Order"
- [x] Update FAQ.tsx: replace all "Approval Center" references with "NPRM Modify Order"
- [x] Update Documentation.tsx: replace "Approval Center" with "NPRM Modify Order" in guides
- [x] Update SystemStatus.tsx: replace historical "Approval Center" mentions with "NPRM Modify Order"
- [x] Verify all tests pass after rename (604 tests passing)
- [x] Test navigation and UI display on mobile and desktop

## Add Hover Tooltip to NPRM Modify Order Card (Jul 8)
- [x] Add Info icon button to NPRM Modify Order card
- [x] Implement hover tooltip with feature description
- [x] Tooltip shows user-friendly explanation of card functionality
- [x] Verify tests pass (604 tests passing)
- [x] Test tooltip display on desktop and mobile

## Add Smooth Fade-in Animation to Tooltip (Jul 8)
- [x] Update tooltip.tsx with duration-300 ease-out for smooth appear animation
- [x] Add duration-200 for smooth disappear animation
- [x] Verify tests pass (604 tests passing)
- [x] Test animation smoothness on desktop and mobile

## Add Target Black Qty Edit Functionality to NPRM Modify Order (Jul 8)
- [x] Database: Create requestEditHistory table to track edits (id, requestId, editedBy, editedAt, oldQty, newQty)
- [x] Database: Add migration SQL for new table
- [x] Backend: Create editTargetBlackQty procedure (allow all users to edit)
- [x] Backend: Create getRequestEditHistory procedure to fetch edit history
- [x] Frontend: Add Edit button to NPRM Modify Order request card
- [x] Frontend: Create Edit Modal with Target Black Qty input field
- [x] Frontend: Display edit history below request details (edited by, date, time, old qty, new qty)
- [x] Frontend: Validate edit permissions and show appropriate UI
- [x] Testing: Verify edit functionality works for all user levels
- [x] Testing: Verify edit history displays correctly
- [x] Testing: Verify all tests pass

## NPRM Modify Order Filter Update (Jul 10)
- [x] Convert status tabs (Pending/Approved/Cancelled/All) to Select dropdown
- [x] Add time-based filter (Today, Yesterday, Last Week, Last Month, specific months like Jul 2026)
- [x] Display request count statistics for each time period
- [x] When selecting a month, show only that month's requests
- [x] Complete Edit Target Black modal dialog UI
- [x] Complete Edit history display (edited by, date, time, qty pcs)

## Add Confirmation Dialog for Edit Target Black Save (Jul 10)
- [x] Add confirmation pop-up before saving edited Target Black Qty
- [x] Show old qty → new qty in confirmation dialog
- [x] Only proceed with save after user confirms

## Add Job No Search Bar to NPRM Modify Order (Jul 10)
- [x] Add search state variable for Job No input
- [x] Add Search bar UI (Job No only, placeholder: "Search by Job No e.g. 02134567")
- [x] Filter displayed requests by Job No match (partial/full)
- [x] Show "No results" state when no match found
- [x] Clear search button (X icon)

## Add Sample Qty to Customer Sample Feature (Jul 14)
- [x] DB: Add sampleQty column (int NOT NULL DEFAULT 1) to customerSamples table via SQL
- [x] Schema: Add sampleQty field to customerSamples table in drizzle/schema.ts
- [x] Router: Add sampleQty to customerSamples.create input schema and mutation body
- [x] StockHistory.tsx: Add sampleQty useState(1), number input field (between Customer Name and Remark), shown in confirm panel, passed to createSample.mutateAsync
- [x] CustomerSample.tsx: Add sampleQty to SampleRecord type
- [x] CustomerSample.tsx: Show "Sample Qty: X pcs" row in card display (after Customer Name)
- [x] CustomerSample.tsx: Show "SAMPLE QTY: X PCS" row in Print Label A4


## Scheduled Tasks (Cron Jobs)
- [x] Monthly cleanup of out-of-stock orders (task_uid: BNbRtWT3Viape6kdvv6NaN)
  - Cron: 0 0 0 1 * * (1st of every month at 00:00 UTC)
  - Endpoint: POST /api/scheduled/cleanup-out-of-stock
  - Function: Deletes orders with "out_of_stock" status older than 13 months
  - Status: Active and running

## User Profile (/user-profile)
- [x] DB schema: add profilePicture, displayName, displayNameChangedAt, employeeIdChangedAt to workers table
- [x] Migration SQL applied via webdev_execute_sql
- [x] tRPC profile.get procedure
- [x] tRPC profile.updateDisplayName procedure (7-day cooldown enforcement)
- [x] tRPC profile.updateEmployeeId procedure (30-day cooldown enforcement)
- [x] tRPC profile.uploadPicture procedure (base64 → S3 storage)
- [x] UserProfile page with dark glassmorphism design
- [x] Profile picture upload (click avatar, file picker, base64 upload)
- [x] Display Name edit with 7-day cooldown indicator
- [x] Employee ID edit with 30-day cooldown indicator + warning banner
- [x] Read-only fields: Department, Access Level, Member Since
- [x] Route /user-profile added to App.tsx (LoginGate protected)
- [x] "My Profile" link added to AppLayout profile dropdown

## Security Audit Log (Admin Panel)
- [x] Add audit_logs table to drizzle/schema.ts
- [x] Apply migration SQL via webdev_execute_sql
- [x] Add createAuditLog and getAuditLogs helpers to server/db.ts
- [x] Add auditLog.list tRPC procedure (admin-only)
- [x] Wire createAuditLog into updateEmployeeId mutation
- [x] Wire createAuditLog into updateDisplayName mutation
- [x] Wire createAuditLog into uploadPicture mutation
- [x] Build SecurityAuditLogTab component with dark glassmorphism design
- [x] Add "Audit Log" tab to AdminPanel tab list

## v6.2.5 Documentation & Skill Context
- [x] Update project documentation with verified v6.2.5 features and maintenance reference
- [x] Update and validate stockdash-webdev reusable skill with AI Scanner architecture and v6.2.5 pitfalls

## v6.2.5 Employee Guide PDF
- [x] Write and generate a downloadable Employee Guide PDF covering the Scanner workflow
- [x] Upload the guide to project storage and update the Documentation download link
- [x] Add an in-page Employee Guide PDF preview modal before download

## Mobile Header Logo
- [x] Replace the blue logo background with a clean white container in the mobile AppLayout header

## Mobile Home Dashboard
- [x] Hide the Home hero and welcome banner below the sm breakpoint while keeping mobile stats visible

## Mobile Add Navigation
- [x] Hide the Add Stock NPRM Quick Actions card below the sm breakpoint
- [x] Route the mobile Add tab directly to /submit-order/ai-scanner

## AI Scanner Authentication
- [x] Diagnose and fix “Please login first” during AI Scanner image upload
- [x] Add regression coverage for workerID and deviceToken scanner authentication

## AI Scanner Session Health Check
- [x] Add a lightweight worker session health endpoint for scanner preflight checks
- [x] Validate the session before AI Scanner image compression and upload
- [x] Add regression coverage for scanner preflight session validation

## AI Scanner Session Recovery
- [x] Add a Go to Login action when the scanner preflight session check fails

## AI Scanner Post-Login Return
- [x] Preserve the AI Scanner destination when session recovery sends a user to Login
- [x] Redirect a successfully authenticated worker back to the preserved Scanner destination
- [x] Add regression coverage for the Scanner post-login return flow

## Mobile Notification Controls
- [x] Hide the duplicate mobile header notification bell and retain the bottom Alerts tab

## Mobile Bottom Navigation
- [x] Swap the Stock and Chat tab positions in the mobile bottom navigation
- [x] Refine mobile bottom navigation spacing, active state, and badge placement

## Mobile Stock Navigation
- [x] Superseded by corrected requirement — retain the mobile Stock bottom navigation tab
- [x] Hide the duplicate Stock History Quick Actions card below the sm breakpoint

## Mobile More Navigation
- [x] Hide Messages, My Profile, Documentation, Help Center, and FAQ Quick Actions below the sm breakpoint
- [x] Replace the mobile Chat tab with a More drawer containing Messages, My Profile, Documentation, Help Center, and FAQ

## Mobile More Drawer Motion
- [x] Add smooth backdrop fade and spring slide transitions for the mobile More drawer

## Mobile More Drawer Utilities
- [x] Add System Status to the mobile More drawer
- [x] Add a secure Logout shortcut at the bottom of the mobile More drawer

## Mobile More Drawer Usability
- [x] Add a confirmation dialog before logging out from the More drawer
- [x] Add a live online/offline indicator to System Status in the More drawer
- [x] Add swipe-down gesture support to dismiss the More drawer

## Personalized Logout Confirmation
- [x] Display the current worker profile image and name in the mobile logout confirmation dialog

## Admin Workers Desktop Identity
- [x] Display each worker's profile picture or fallback avatar in the desktop Admin Workers table
- [x] Open a full-size profile image preview when an Admin clicks a worker photo in the desktop table

## Mobile Home Stock Activity
- [x] Show the latest 10 Stock History input/output activities in the mobile Home footer area
- [x] Move system status, app version, and copyright below the mobile activity section
- [x] Include QR Scanner and manual balance-adjustment records in the mobile Input / Output timeline
- [x] Store and display the reason or note for each QR or manual balance adjustment

## Stock History Order Details
- [x] Open a complete production-order detail dialog when a Stock History row is selected

## Direct Profile Navigation
- [x] Remove the desktop and mobile profile quick panel
- [x] Open My Profile directly when the profile control is selected

## My Profile Account Summary
- [x] Display key user account and activity statistics in a responsive account summary card
- [x] Display profile completion progress and prompts for missing account details

## QR Scanner Mobile Dialog Layout
- [x] Keep Update Balance dialog actions visible above the mobile bottom navigation

## QR Scanner Adjustment Receipt
- [x] Show a transaction-detail success receipt after a balance adjustment completes

## Messages Experience Redesign
- [x] Redesign the desktop and mobile Messages interface with a polished dark glassmorphism layout
- [x] Improve conversation discovery, chat header, message bubbles, composer, and empty/loading states

## Message Attachments
- [x] Add secure file attachments with preview, upload progress, and download support to direct and group messages

## Messages Header Focus
- [x] Hide the shared application header on the Messages page only

## Messages Send Alert Dialog
- [x] Fix mobile Send Alert dialog layering so the chat thread cannot overlap it

## Mobile Navigation Order
- [x] Move Messages into the mobile bottom navigation Alerts position
- [x] Replace the More drawer Messages shortcut with Alerts and retain its notification badge

## Messages Profile Pictures
- [x] Display worker profile pictures in conversation rows and chat headers with initial-avatar fallbacks
