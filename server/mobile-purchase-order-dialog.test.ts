import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appLayoutSource = readFileSync(resolve(process.cwd(), "client/src/components/AppLayout.tsx"), "utf8");
const stockHistorySource = readFileSync(resolve(process.cwd(), "client/src/pages/StockHistory.tsx"), "utf8");

describe("mobile Purchase Order warning layering", () => {
  it("keeps the mobile navigation below the insufficient-stock dialog and its alert", () => {
    expect(appLayoutSource).toContain('lg:hidden fixed bottom-0 left-0 right-0 z-40');
    expect(stockHistorySource).toContain('role="alert" aria-live="polite"');
    expect(stockHistorySource).toContain("Available Qty is insufficient for this order.");
  });
});
