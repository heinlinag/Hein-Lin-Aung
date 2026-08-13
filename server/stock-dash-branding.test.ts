import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) =>
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("Stock Dash branding", () => {
  it("replaces legacy PP4 Manual Slitter labels across user-facing app surfaces", () => {
    const userFacingSources = [
      "client/public/manifest.json",
      "client/public/sw.js",
      "client/src/components/A4Label.tsx",
      "client/src/components/AppLayout.tsx",
      "client/src/components/PageHeader.tsx",
      "client/src/pages/AdminLogin.tsx",
      "client/src/pages/AdminPanel.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/Login.tsx",
    ].map(read).join("\n");

    expect(userFacingSources).not.toContain("PP4 Manual Slitter");
    expect(read("client/public/manifest.json")).toContain('"name": "Stock Dash - Stock Management System"');
    expect(read("client/src/pages/Home.tsx")).toContain("Stock Dash Management System &copy;");
    expect(read("client/src/components/AppLayout.tsx")).toContain(">Stock Dash</div>");
  });
});
