import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8",
);

describe("Mobile Home stock activity", () => {
  it("loads current stock inputs and usage outputs for the activity timeline", () => {
    expect(homeSource).toContain("trpc.orders.list.useQuery({}, { refetchInterval: 30000 })");
    expect(homeSource).toContain("trpc.orders.getUsage.useQuery(undefined, { refetchInterval: 30000 })");
    expect(homeSource).toContain('type: "input" as const');
    expect(homeSource).toContain('type: "output" as const');
  });

  it("renders a mobile-only combined Input/Output section limited to the latest ten entries", () => {
    expect(homeSource).toContain('className="sm:hidden px-4 pb-5"');
    expect(homeSource).toContain("Stock Input / Output");
    expect(homeSource).toContain(".slice(0, 10)");
    expect(homeSource).toContain('{isInput ? "Input" : "Output"}');
  });

  it("places the mobile activity section before system status and the footer", () => {
    const activityIndex = homeSource.indexOf("Mobile: Recent Stock Input / Output");
    const statusIndex = homeSource.indexOf("System Status Bar");
    const footerIndex = homeSource.indexOf("{/* Footer */}");
    expect(activityIndex).toBeGreaterThan(-1);
    expect(activityIndex).toBeLessThan(statusIndex);
    expect(statusIndex).toBeLessThan(footerIndex);
  });
});
