import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const notFoundSource = fs.readFileSync(path.join(root, "client/src/pages/NotFound.tsx"), "utf8");

describe("custom 404 recovery navigation", () => {
  it("offers Home, Help Center, and a WhatsApp Contact Support shortcut", () => {
    expect(notFoundSource).toContain('id="not-found-button-group"');
    expect(notFoundSource).toContain("Go Home");
    expect(notFoundSource).toContain('aria-label="Helpful recovery links"');
    expect(notFoundSource).toContain('setLocation("/help")');
    expect(notFoundSource).toContain('const supportPhone = (import.meta.env.VITE_ADMIN_WHATSAPP || "").replace(/\\D/g, "")');
    expect(notFoundSource).toContain('https://wa.me/${supportPhone}');
    expect(notFoundSource).toContain('aria-label="Contact Support via WhatsApp"');
    expect(notFoundSource).toContain("Contact Support");
    expect(notFoundSource).not.toContain('setLocation("/docs")');
    expect(notFoundSource).not.toContain('setLocation("/status")');
    expect(notFoundSource).not.toContain("Documentation");
    expect(notFoundSource).not.toContain("System Status");
  });
});
