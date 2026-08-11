# StockDash Project Reference — v6.2.5

**Application:** PP4 Manual Slitter Stock Management System  
**Primary domains:** `stockdash.click`, `www.stockdash.click`, and `heinann.manus.space`  
**Project path:** `/home/ubuntu/stock-management`  
**Current application version:** **6.2.5**  
**Prepared for:** HEiNANN  
**Maintained by:** Manus AI

## Purpose

StockDash manages PP4 Manual Slitter NPRM stock. Workers can add stock, search Stock History, submit NPRM modification requests, scan QR codes, use the AI Label Scanner, review notifications, and maintain their profile. Level 2 administrators have full management access through the Admin Panel.

## Technology Overview

| Area | Implementation |
|---|---|
| Frontend | React 19, Tailwind CSS 4, Wouter, Radix UI |
| Server | Express 4 and tRPC 11 |
| Data | Drizzle ORM with MySQL/TiDB |
| AI scanner | Gemini vision through the server-side scan route |
| File storage | S3-compatible storage through `server/storage.ts` |
| Notifications | Web Push with VAPID keys, service worker, and in-app notifications |
| Design system | Deep navy/indigo dark glassmorphism with frosted cards and gradient accents |

## v6.2.5 Release Summary

Version 6.2.5 introduces the AI-assisted Add Stock NPRM workflow, strengthens security and auditability, and standardizes the mobile and administrative experience.

| Release area | Delivered capability |
|---|---|
| **AI Label Scanner** | Workers can take a photo or upload a PP4 label. AI extracts Production Order, Flute Type, board size, quantity, and BQ Formula after validating `MASTERCARD: PB`. |
| **Scanner review flow** | Scanned values are editable before submission. Duplicate Production Orders are detected before a new order is created. |
| **Scanner reliability** | Client-side image compression reduces upload payloads. Images are sent through the dedicated multipart `/api/scan-label` endpoint rather than tRPC batching. |
| **Scanner traceability** | Orders now store `submittedVia` as `manual` or `scanner`. Scanner-created orders show a **AI Scanned** badge in Stock History. |
| **Admin Panel** | Each operational area has a direct route such as `/admin/workers`, `/admin/orders`, and `/admin/audit-log`; mobile users receive a sticky primary navigation bar plus a More drawer. |
| **Security Audit Log** | Employee ID, Display Name, and profile picture changes are recorded for Level 2 review. |
| **User Profile** | Workers can upload a profile picture, change Display Name every seven days, and change Employee ID every thirty days after confirmation. |
| **Push notifications** | Dynamic VAPID-key subscription, permission onboarding, and push triggers for new orders, requests, approvals, cancellations, and chat events. |
| **Responsive UI** | Mobile Dashboard uses compact stats and quick-action grids while tablet, laptop, desktop, and wide desktop layouts retain detailed cards. |

## Key User Routes

| Route | Purpose | Access |
|---|---|---|
| `/` | Home Dashboard | Authenticated worker |
| `/submit-order` | Add Stock NPRM; Scanner is the default mode | Authenticated worker |
| `/submit-order/ai-scanner` | Direct entry to Scanner mode | Authenticated worker |
| `/stock-history` | NPRM Stock History and Purchase Order workflows | Authenticated worker |
| `/approval-center` | NPRM Modify Order requests and approval lifecycle | Authenticated worker; capabilities vary by level |
| `/qr-scanner` | QR and Tracking ID verification | Authenticated worker |
| `/user-profile` | Profile picture and identity updates | Authenticated worker |
| `/notifications` | In-app notification centre | Authenticated worker |
| `/docs`, `/help`, `/faq`, `/status` | Documentation, help, FAQ, and system status | Authenticated worker |
| `/check.qr/:id` | Public, read-only production-order view from a shared Tracking ID link | Public |
| `/admin/:tab` | Admin operations, including workers, orders, requests, messages, announcements, notifications, audit logs, maintenance, and settings | Level 2 administrator |

## AI Label Scanner Workflow

> **Acceptance rule:** A scanned label must contain `MASTERCARD: PB`. Any other value is rejected before order submission.

1. The worker selects **Scanner** in Add Stock NPRM and takes a photo or uploads a label image on a mobile device.
2. The browser compresses the image with the Canvas API before transmission.
3. The client sends `image`, `workerID`, and `deviceToken` in `FormData` to `POST /api/scan-label`.
4. The server validates the worker session against the active-device record, then calls Gemini vision to extract the label values.
5. The user reviews and may edit Production Order, Flute Type, width, length, quantity, and BQ Formula.
6. The system prevents duplicate Production Orders and asks for a final confirmation before creating the order.
7. Scanner-created orders submit with `submittedVia: "scanner"` and receive the Stock History scan badge.

### Scanner Data Rules

| Field | Rule |
|---|---|
| MASTERCARD | Must equal `PB`; otherwise show the Rejected screen. |
| Production Order | Required and checked against existing orders before submission. |
| Flute Type | Extracted from the BQ Formula prefix, such as `BA` from `BA-LR170...`. |
| BQ Formula | Store/display without the Flute Type prefix, such as `LR170MP140MP140MP140LR170`. |
| Image upload | Do not send large base64 images through tRPC `httpBatchLink`; use `/api/scan-label` multipart upload. |
| Desktop behavior | Scanner mode shows a camera-unavailable notice and guides users to Manual mode on `lg+` displays. |

## Stock Quantity and Approval Rules

Stock History and NPRM Modify Order must not use the frozen request snapshot as a substitute for live stock.

| Status | Current Qty | Balance |
|---|---|---|
| Pending | Live order quantity | Live order quantity |
| In Process | Live order quantity | `liveQty − processApprovedQty` |
| Approved | Live order quantity | `snapshot.qty − processApprovedQty` as the closed/frozen result |

The `orders.getLiveQty` procedure supplies the live quantity to the request card. An approved request must retain its closed Balance even if live stock changes later.

## Important Files

| File | Maintenance role |
|---|---|
| `client/src/pages/SubmitOrder.tsx` | Manual and Scanner Add Stock NPRM workflows, compression, review, rejection, and confirmation screens. |
| `server/_core/index.ts` | Express multipart `/api/scan-label` endpoint using multer and Gemini vision. |
| `server/routers.ts` | tRPC procedures for orders, requests, profiles, audit logs, notifications, and admin operations. |
| `drizzle/schema.ts` | Data schema; `orders.submittedVia`, profile fields, audit logs, push subscriptions, and request lifecycle fields. |
| `client/src/pages/StockHistory.tsx` | Stock list, Purchase Order workflows, available quantity calculations, and AI Scanned badge. |
| `client/src/pages/ApprovalCenter.tsx` | Request card lifecycle and status-specific Current Qty/Balance logic. |
| `client/src/pages/AdminPanel.tsx` | URL-driven admin tabs, full administrative actions, mobile bottom navigation, and audit log. |
| `client/src/components/AppLayout.tsx` | Navigation, profile display, notification permission banner, and global push registration. |
| `client/src/hooks/usePushNotifications.ts` | Dynamic VAPID public-key retrieval and browser subscription lifecycle. |
| `/home/ubuntu/skills/stockdash-webdev/SKILL.md` | Reusable maintenance playbook for future StockDash work. |

## Maintenance Guardrails

| Area | Required practice |
|---|---|
| Dark UI | Use explicit light text (`text-white`, `text-slate-400`) inside dark glassmorphism sections. Do not rely on light-theme semantic tokens such as `text-muted-foreground`. |
| Scanner uploads | Keep file transfer on the multipart Express route; worker sessions use `workerID` and `deviceToken`, not Manus OAuth cookies. |
| VAPID keys | Fetch the public key dynamically. Never hard-code a VAPID key in the browser. |
| Database changes | Update `drizzle/schema.ts`, prepare a migration, and apply SQL with the managed database workflow. |
| Admin controls | Preserve Level 2 access checks while retaining full CRUD actions for authorized administrators. |
| Responsiveness | Preserve the compact mobile layouts separately from the detailed `sm+` layouts. |
| Verification | Run `npx tsc --noEmit`, update `todo.md`, and save a checkpoint after any completed feature. |

## Current Version Locations

The application version is maintained in the following places and should be updated together for future releases:

| Location | Value to update |
|---|---|
| `package.json` | `version` |
| `client/src/pages/Login.tsx` | `APP_VERSION` |
| `client/src/pages/AdminLogin.tsx` | `APP_VERSION` |
| `client/src/pages/Home.tsx` | `APP_VERSION` |
| `client/src/pages/Documentation.tsx` | Version badges and guide labels/URLs |
| `client/src/pages/SystemStatus.tsx` | Version label and release notes |

## Release Checklist

Before a future production release, confirm the following items.

- [ ] The semantic version is updated in all version locations above.
- [ ] System Status contains accurate release notes.
- [ ] TypeScript passes with `npx tsc --noEmit`.
- [ ] New backend behavior has appropriate Vitest coverage.
- [ ] `todo.md` is updated with completed work.
- [ ] A project checkpoint has been saved before publishing.

