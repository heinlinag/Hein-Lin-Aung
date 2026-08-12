import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appLayoutSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AppLayout.tsx"),
  "utf8",
);
const homeSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8",
);

describe("Mobile More navigation", () => {
  it("exposes Messages directly while opening Alerts in a dedicated swipe-in panel", () => {
    expect(appLayoutSource).toContain('href: "#more"');
    expect(appLayoutSource).toContain('label: "More"');
    expect(appLayoutSource).toContain("MOBILE_MORE_ITEMS");
    for (const href of ["/user-profile", "/docs", "/help", "/faq", "/status"]) {
      expect(appLayoutSource).toContain(`href: "${href}"`);
    }
    expect(appLayoutSource).not.toMatch(/MOBILE_MORE_ITEMS[\s\S]*?href: "\/notifications"/);
    expect(appLayoutSource).toContain('href: "/chat",                   icon: <MessageCircle size={22} />, label: "Messages", order: "order-4", badge: unreadMsgCount');
    expect(appLayoutSource).toContain("openNotificationsPanel");
    expect(appLayoutSource).toContain("notificationsPanelOpen");
    expect(appLayoutSource).toContain('aria-label="Notifications"');
    expect(appLayoutSource).toContain("System Status");
    expect(appLayoutSource).toContain("closeMore(); handleLogout();");
  });

  it("hides secondary Quick Actions only below the sm breakpoint", () => {
    for (const title of ["Messages", "My Profile", "Documentation", "Help Center", "FAQ"]) {
      expect(homeSource).toMatch(new RegExp(`title:\\s*"${title}",[\\s\\S]*?mobileHidden:\\s*true`));
    }
    expect(homeSource).toContain('mobileHidden ? "hidden sm:block " : ""');
  });

  it("uses motion state with backdrop fade, spring panel slide, and staggered item entry", () => {
    expect(appLayoutSource).toContain('useState<"opening" | "open" | "closing">');
    expect(appLayoutSource).toContain("requestAnimationFrame(() => setMoreMotion(\"open\"))");
    expect(appLayoutSource).toContain("transition-[opacity,transform]");
    expect(appLayoutSource).toContain("cubic-bezier(0.22,1,0.36,1)");
    expect(appLayoutSource).toContain("transitionDelay: moreMotion === \"open\"");
  });

  it("confirms logout, reports browser online state, and supports swipe-down dismissal", () => {
    expect(appLayoutSource).toContain("setLogoutConfirmOpen(true)");
    expect(appLayoutSource).toContain("Log out of StockDash?");
    expect(appLayoutSource).toContain("window.addEventListener(\"online\"");
    expect(appLayoutSource).toContain("System online");
    expect(appLayoutSource).toContain("onTouchStart={handleMoreTouchStart}");
    expect(appLayoutSource).toContain("moreDragOffset > 88");
  });

  it("personalizes the logout confirmation with the worker profile image and name", () => {
    expect(appLayoutSource).toContain('alt={`${displayName} profile`}');
    expect(appLayoutSource).toContain("Signed in as");
    expect(appLayoutSource).toContain("Your active device session for {displayName || worker.name}");
  });
});
