import { describe, expect, it } from "vitest";
import { applyStockDashRouteMetadata } from "./stockDashMetadata";
import {
  getStockDashPageMetadata,
  getStockDashStructuredData,
  STOCK_DASH_OG_IMAGE_URL,
} from "@shared/stockDashPageMetadata";

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
    expect(page).toContain(`property="og:image" content="${STOCK_DASH_OG_IMAGE_URL}"`);
    expect(page).toContain('id="stock-dash-json-ld" type="application/ld+json"');
  });

  it("prevents protected routes from being indexed", () => {
    expect(getStockDashPageMetadata("/stock-history").indexable).toBe(false);
    expect(getStockDashPageMetadata("/admin/worker").title).toBe("Admin Panel | Stock Dash");
  });

  it("provides WebSite and WebPage JSON-LD only for indexable public pages", () => {
    const homeSchema = getStockDashStructuredData("/")?.["@graph"] as Array<Record<string, unknown>>;
    expect(homeSchema).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "WebSite", name: "Stock Dash" }),
      expect.objectContaining({
        "@type": "WebApplication",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Stock Management System",
        creator: { "@type": "Person", name: "HEiNANN" },
      }),
    ]));
    expect(getStockDashStructuredData("/faq")?.["@type"]).toBe("WebPage");
    expect(getStockDashStructuredData("/faq")?.creator).toEqual({ "@type": "Person", name: "HEiNANN" });
    expect(getStockDashStructuredData("/stock-history")).toBeNull();
  });
});
