import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const homeSource = fs.readFileSync(path.join(root, "client/src/pages/Home.tsx"), "utf8");

describe("Home page SEO heading", () => {
  it("removes the visible dashboard title and retains a concise semantic H2", () => {
    expect(homeSource).not.toContain("PP4 Manual Slitter Stock Management Dashboard");
    const match = homeSource.match(/<h2 className="sr-only">\s*([^<]+?)\s*<\/h2>/);
    expect(match?.[1]).toBe("Stock Management Tools and Features");
    expect(match?.[1].length).toBeLessThanOrEqual(80);
  });
});
