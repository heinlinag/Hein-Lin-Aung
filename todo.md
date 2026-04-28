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
