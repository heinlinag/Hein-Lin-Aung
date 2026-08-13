import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const documentSource = fs.readFileSync(path.join(root, "client/index.html"), "utf8");

describe("Home page SEO metadata", () => {
  it("uses the requested Stock Dash title and description", () => {
    expect(documentSource).toContain("<title>Stock Dash - Stock Management System</title>");
    expect(documentSource).toContain('name="description" content="Stock Dash Management System by HEiNANN. Created by HEiNANN"');
  });
});
