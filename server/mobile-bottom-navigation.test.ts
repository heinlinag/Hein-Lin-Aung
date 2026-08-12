import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appLayoutSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AppLayout.tsx"),
  "utf8",
);

describe("Mobile bottom navigation", () => {
  it("places Stock before Messages on mobile and retains the shared More control", () => {
    expect(appLayoutSource).toContain('href: "/stock-history",          icon: <Package size={22} />,       label: "Stock",  order: "order-3 sm:order-5"');
    expect(appLayoutSource).toContain('href: "/chat",                   icon: <MessageCircle size={22} />, label: "Messages", order: "order-4"');
    expect(appLayoutSource).toContain('href: "#more",                   icon: <MoreHorizontal size={23} />, label: "More"');
  });

  it("uses mobile-friendly tab height, active icon treatment, and positioned badges", () => {
    expect(appLayoutSource).toContain('h-[72px]');
    expect(appLayoutSource).toContain('bg-indigo-50 text-indigo-600');
    expect(appLayoutSource).toContain('absolute -top-1.5 -right-1.5');
  });
});
