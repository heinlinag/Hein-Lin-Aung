import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const homeSource = fs.readFileSync(path.join(root, "client/src/pages/Home.tsx"), "utf8");

describe("Home page SEO heading", () => {
  it("contains a visible descriptive H2 within the 80-character limit", () => {
    const match = homeSource.match(/<h2 id="stock-management-dashboard-heading"[^>]*>\s*([^<]+?)\s*<\/h2>/);
    expect(match?.[1]).toBe("PP4 Manual Slitter Stock Management Dashboard");
    expect(match?.[1].length).toBeLessThanOrEqual(80);
  });
});
