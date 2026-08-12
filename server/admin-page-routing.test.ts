import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminPanelSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/AdminPanel.tsx"),
  "utf8",
);
const appSource = readFileSync(
  resolve(process.cwd(), "client/src/App.tsx"),
  "utf8",
);

describe("Admin Control Center page structure", () => {
  it("uses /admin as the dashboard home", () => {
    expect(adminPanelSource).toContain('dashboard: "dashboard"');
    expect(adminPanelSource).toContain(': "dashboard";');
    expect(adminPanelSource).toContain('navigate(tab === "dashboard" ? "/admin"');
    expect(adminPanelSource).toContain('{ id: "dashboard" as const, label: "Dashboard"');
    expect(adminPanelSource).toContain('{activeTab === "dashboard" ? "Admin Control Center"');
    expect(appSource).toContain('<Route path="/admin">');
  });

  it("maps singular URLs to the dedicated management pages while retaining legacy aliases", () => {
    expect(adminPanelSource).toContain('worker: "workers"');
    expect(adminPanelSource).toContain('order: "orders"');
    expect(adminPanelSource).toContain('request: "pending_requests"');
    expect(adminPanelSource).toContain('message: "contact_messages"');
    expect(adminPanelSource).toContain('announcement: "announcements"');
    expect(adminPanelSource).toContain('notification: "notifications"');
    expect(adminPanelSource).toContain('workers: "worker"');
    expect(adminPanelSource).toContain('orders: "order"');
    expect(adminPanelSource).toContain('pending_requests: "request"');
    expect(appSource).toContain('<Route path="/admin/:tab">');
  });

  it("keeps dashboard-only overview content separate from individual management pages", () => {
    expect(adminPanelSource).toContain('{activeTab === "dashboard" && <>');
    expect(adminPanelSource).toContain('{activeTab !== "dashboard" && <main');
    expect(adminPanelSource).toContain('Role-Based Quick Actions');
    expect(adminPanelSource).toContain('Control Center');
    expect(adminPanelSource).not.toContain('Administrator workspace');
  });

  it("exposes Home and the remaining management pages on mobile navigation", () => {
    expect(adminPanelSource).toContain('{ id: "dashboard" as const, label: "Home"');
    expect(adminPanelSource).toContain('{ id: "contact_messages" as const, label: "Messages"');
    expect(adminPanelSource).toContain('More admin tools');
  });
});
