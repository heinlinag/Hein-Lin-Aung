import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const notFoundSource = fs.readFileSync(path.join(root, "client/src/pages/NotFound.tsx"), "utf8");

describe("custom 404 recovery navigation", () => {
  it("offers Home plus useful public recovery routes", () => {
    expect(notFoundSource).toContain('id="not-found-button-group"');
    expect(notFoundSource).toContain("Go Home");
    expect(notFoundSource).toContain('aria-label="Helpful recovery links"');
    expect(notFoundSource).toContain('setLocation("/docs")');
    expect(notFoundSource).toContain('setLocation("/help")');
    expect(notFoundSource).toContain('setLocation("/status")');
  });
});
