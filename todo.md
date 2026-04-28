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
- [ ] Low-stock alert: highlight orders with qty < 50 pcs in Stock History (yellow/orange warning)
- [ ] Admin Panel: add Deleted Logs History tab showing audit trail (who deleted, when, order details)
- [ ] Deleted Logs tab: show deletedLogs table data via tRPC procedure
