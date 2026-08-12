import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminPanelSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/AdminPanel.tsx"),
  "utf8",
);
const adminLoginSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/AdminLogin.tsx"),
  "utf8",
);

describe("Admin Panel light-mode rebuild", () => {
  it("uses a dedicated white-theme shell instead of the permanent dark token set", () => {
    expect(adminPanelSource).toContain('className="admin-light min-h-screen"');
    expect(adminPanelSource).toContain('const isDark = false;');
    expect(adminPanelSource).toContain('Light Mode');
    expect(adminPanelSource).toContain('Admin Control Center');
    expect(adminPanelSource).toContain('const ADMIN_LIGHT_STYLES');
  });

  it("applies shared light surfaces and a contextual workspace header to every management tab", () => {
    expect(adminPanelSource).toContain('admin-light-surface');
    expect(adminPanelSource).toContain('const tabDescriptions: Record<TabId, string>');
    expect(adminPanelSource).toContain('Admin workspace');
    expect(adminPanelSource).toContain('Live management');
  });

  it("keeps the mobile Admin navigation and More drawer touch-safe in the light theme", () => {
    expect(adminPanelSource).toContain('admin-light-mobile-nav');
    expect(adminPanelSource).toContain('admin-light-drawer');
    expect(adminPanelSource).toContain('More admin tools');
    expect(adminPanelSource).toContain('pb-[env(safe-area-inset-bottom)]');
  });

  it("matches the Administrator login entry screen to the white-theme control center", () => {
    expect(adminLoginSource).toContain('admin-login-light min-h-screen');
    expect(adminLoginSource).toContain('const ADMIN_LOGIN_LIGHT_STYLES');
    expect(adminLoginSource).toContain('ANIM_STYLES + ADMIN_LOGIN_LIGHT_STYLES');
  });
});
