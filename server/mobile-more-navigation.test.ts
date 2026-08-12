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
  it("replaces the bottom Chat tab with a More control and exposes secondary destinations", () => {
    expect(appLayoutSource).toContain('href: "#more"');
    expect(appLayoutSource).toContain('label: "More"');
    expect(appLayoutSource).toContain("MOBILE_MORE_ITEMS");
    for (const href of ["/chat", "/user-profile", "/docs", "/help", "/faq"]) {
      expect(appLayoutSource).toContain(`href: "${href}"`);
    }
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
});
