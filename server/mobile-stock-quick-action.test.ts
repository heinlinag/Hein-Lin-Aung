import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8",
);
const appLayoutSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AppLayout.tsx"),
  "utf8",
);

describe("Mobile Stock navigation and Quick Actions", () => {
  it("hides Stock History in Quick Actions below the sm breakpoint", () => {
    expect(homeSource).toMatch(/title:\s*"Stock History",[\s\S]*?href:\s*"\/stock-history",[\s\S]*?mobileHidden:\s*true/);
    expect(homeSource).toContain('mobileHidden ? "hidden sm:block " : ""');
  });

  it("retains the mobile bottom Stock navigation entry", () => {
    expect(appLayoutSource).toContain('href: "/stock-history"');
    expect(appLayoutSource).toContain('label: "Stock"');
  });
});
