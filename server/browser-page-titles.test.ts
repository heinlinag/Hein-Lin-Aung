import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const appSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../client/src/App.tsx"),
  "utf8",
);

describe("Stock Dash browser page titles", () => {
  it("sets a Stock Dash title for public, worker, admin, and unknown routes", () => {
    expect(appSource).toContain('const STOCK_DASH_DEFAULT_TITLE = "Stock Dash - Stock Management System"');
    expect(appSource).toContain('"/stock-history": "Stock History | Stock Dash"');
    expect(appSource).toContain('"/admin" || pathname.startsWith("/admin/")');
    expect(appSource).toContain('return "Admin Panel | Stock Dash"');
    expect(appSource).toContain('if (pathname.startsWith("/check.qr/")) return "Production Order | Stock Dash"');
    expect(appSource).toContain('return titles[pathname] ?? "Page Not Found | Stock Dash"');
    expect(appSource).toContain("document.title = getBrowserTitle(location)");
  });
});
