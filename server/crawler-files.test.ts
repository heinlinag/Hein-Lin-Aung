import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "client/public");
const robots = fs.readFileSync(path.join(publicDir, "robots.txt"), "utf8");
const sitemap = fs.readFileSync(path.join(publicDir, "sitemap.xml"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const sitemapGenerator = fs.readFileSync(path.join(root, "scripts/generate-sitemap.mjs"), "utf8");

describe("search crawler files", () => {
  it("publishes a canonical sitemap and excludes private application routes", () => {
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://stockdash.click/sitemap.xml");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /admin/");
    expect(robots).toContain("Disallow: /stock-history");
    expect(robots).toContain("Disallow: /check.qr/");
    expect(robots).toContain("Disallow: /404");
  });

  it("lists only canonical indexable pages with valid update metadata", () => {
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(sitemap).toContain("https://stockdash.click/");
    expect(sitemap).toContain("https://stockdash.click/docs");
    expect(sitemap).toContain("https://stockdash.click/help");
    expect(sitemap).toContain("https://stockdash.click/faq");
    expect(sitemap).toContain("https://stockdash.click/status");
    expect(sitemap.match(/<url>/g)).toHaveLength(5);
    expect(sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g)).toHaveLength(5);
    expect(sitemap).not.toContain("https://www.stockdash.click");
    expect(sitemap).not.toContain("/admin");
    expect(sitemap).not.toContain("/stock-history");
    expect(sitemap).not.toContain("/check.qr/");
  });

  it("regenerates last-modified dates from Documentation and FAQ source history on every build", () => {
    expect(packageJson.scripts["sitemap:generate"]).toBe("node scripts/generate-sitemap.mjs");
    expect(packageJson.scripts.prebuild).toBe("pnpm sitemap:generate");
    expect(sitemapGenerator).toContain('source: "client/src/pages/Documentation.tsx"');
    expect(sitemapGenerator).toContain('source: "client/src/pages/FAQ.tsx"');
    expect(sitemapGenerator).toContain('execFileSync("git", ["log", "-1", "--format=%cs", "--", sourcePath]');
    expect(sitemapGenerator).toContain("mtime.toISOString().slice(0, 10)");
  });
});
