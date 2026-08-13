import { describe, expect, it } from "vitest";
import { applyStockDashRouteMetadata } from "./stockDashMetadata";
import { getStockDashPageMetadata } from "@shared/stockDashPageMetadata";

const template = `<!doctype html><html><head><title>Fallback</title><!-- STOCK_DASH_ROUTE_METADATA --></head><body></body></html>`;

describe("Stock Dash route metadata", () => {
  it("defines search and share metadata for each indexable public page", () => {
    for (const route of ["/", "/docs", "/help", "/faq", "/status"]) {
      const metadata = getStockDashPageMetadata(route);
      expect(metadata.indexable).toBe(true);
      expect(metadata.title).toContain("Stock Dash");
      expect(metadata.description.length).toBeGreaterThan(30);
    }
  });

  it("renders page-specific Open Graph, description, canonical, and robots tags", () => {
    const page = applyStockDashRouteMetadata(template, "/docs");
    expect(page).toContain("<title>Documentation | Stock Dash</title>");
    expect(page).toContain('property="og:title" content="Documentation | Stock Dash"');
    expect(page).toContain('name="description" content="Explore Stock Dash guides');
    expect(page).toContain('rel="canonical" href="https://stockdash.click/docs"');
    expect(page).toContain('name="robots" content="index,follow"');
  });

  it("prevents protected routes from being indexed", () => {
    expect(getStockDashPageMetadata("/stock-history").indexable).toBe(false);
    expect(getStockDashPageMetadata("/admin/worker").title).toBe("Admin Panel | Stock Dash");
  });
});
