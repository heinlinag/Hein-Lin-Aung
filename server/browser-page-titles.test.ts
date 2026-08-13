import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getStockDashPageMetadata, STOCK_DASH_DEFAULT_TITLE } from "@shared/stockDashPageMetadata";

const appSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../client/src/App.tsx"),
  "utf8",
);

describe("Stock Dash browser page titles", () => {
  it("sets a Stock Dash title for public, worker, admin, and unknown routes", () => {
    expect(STOCK_DASH_DEFAULT_TITLE).toBe("Stock Dash - Stock Management System");
    expect(getStockDashPageMetadata("/stock-history").title).toBe("Stock History | Stock Dash");
    expect(getStockDashPageMetadata("/admin/worker").title).toBe("Admin Panel | Stock Dash");
    expect(getStockDashPageMetadata("/check.qr/PP41308260345B991").title).toBe("Production Order | Stock Dash");
    expect(getStockDashPageMetadata("/unknown").title).toBe("Page Not Found | Stock Dash");
    expect(appSource).toContain("document.title = metadata.title");
  });
});
