import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scannerSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/QRScanner.tsx"),
  "utf8",
);

describe("QR Scanner mobile Update Balance dialog", () => {
  it("stacks above the mobile navigation and preserves bottom safe-area spacing", () => {
    expect(scannerSource).toContain("z-[70]");
    expect(scannerSource).toContain("pb-[calc(env(safe-area-inset-bottom)+0.75rem)]");
    expect(scannerSource).toContain("pb-[calc(env(safe-area-inset-bottom)+1rem)]");
  });

  it("keeps the action bar available on short mobile viewports", () => {
    expect(scannerSource).toContain("max-h-[calc(100dvh-1.5rem)]");
    expect(scannerSource).toContain("flex-1 overflow-y-auto");
    expect(scannerSource).toContain("shrink-0 border-t border-white/10");
    expect(scannerSource).toContain("Confirm & Verify");
  });
});
