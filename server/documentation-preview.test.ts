import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const documentationSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Documentation.tsx"),
  "utf8",
);

describe("Employee Guide PDF preview", () => {
  it("provides a dedicated preview state for the Employee Guide", () => {
    expect(documentationSource).toContain("showEmployeeGuidePreview");
    expect(documentationSource).toContain("setShowEmployeeGuidePreview(true)");
  });

  it("renders the Employee Guide inside an accessible preview dialog", () => {
    expect(documentationSource).toContain('role="dialog"');
    expect(documentationSource).toContain('aria-label="Employee Guide PDF preview"');
    expect(documentationSource).toContain('title="StockDash v6.2.5 Employee Guide PDF"');
  });

  it("keeps a download action available inside the preview", () => {
    expect(documentationSource).toContain('download="StockDash_Employee_Guide_v6.2.5.pdf"');
    expect(documentationSource).toContain("StockDash_Employee_Guide_v6.2.5_a77c18c3.pdf");
  });
});
