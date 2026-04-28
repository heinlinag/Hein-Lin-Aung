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


## Latest Changes (User Feedback)
- [x] Remove DashboardLayout sidebar completely - use Home Dashboard as main entry point
- [x] Add BQ Comment filter to Stock History (separate from Order ID/Flute Type search)
- [x] Add Delete button to Stock History orders with Worker ID confirmation
- [ ] Create Deleted Logs History table in Admin Panel to track deleted orders
- [x] Update database schema: add deletedLogs table to track deleted orders


## Usage History Feature (New)
- [ ] Update database schema: add usageHistory table with jobNo, usedQty, orderID, purpose (job/old_stock), createdAt
- [ ] Add "Used Update" button to Stock History orders
- [ ] Create "Used Update" dialog with:
  - Display Available Quantity
  - Choose purpose: Job No or Old Stock
  - Job No: 8-digit validation (e.g. 02123456), Qty deduction, show remaining
  - Old Stock: confirmation dialog, set Frozen=0, move to Out of Stock
- [ ] Add Usage History tab to Dashboard showing: Job No, Used Qty, Order ID, Flute, BQ
- [ ] Update Stock History: display "Flute : B" instead of just "B"
- [ ] Highlight BQ Comment in Stock History with background color
