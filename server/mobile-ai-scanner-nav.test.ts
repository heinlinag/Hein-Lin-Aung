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

describe("Mobile AI Scanner Add navigation", () => {
  it("hides the Add Stock NPRM Quick Actions card on mobile only", () => {
    expect(homeSource).toContain('title: "Add Stock NPRM"');
    expect(homeSource).toContain("mobileHidden: true");
    expect(homeSource).toContain('"hidden sm:block "');
  });

  it("routes the mobile Add tab directly to the AI Scanner", () => {
    expect(appLayoutSource).toContain('href: "/submit-order/ai-scanner"');
    expect(appLayoutSource).toContain('icon: <Camera size={20} />');
    expect(appLayoutSource).toContain('label: "Add"');
  });
});
