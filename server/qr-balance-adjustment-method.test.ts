import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const scannerSource = readFileSync(resolve(process.cwd(), "client/src/pages/QRScanner.tsx"), "utf8");

describe("QR balance adjustment methods", () => {
  it("persists the scan or manual source for balance update records", () => {
    expect(schemaSource).toContain('adjustmentMethod: mysqlEnum("adjustmentMethod", ["scan", "manual"])');
    expect(routerSource).toContain('adjustmentMethod: z.enum(["scan", "manual"]).optional()');
    expect(routerSource).toContain("adjustmentMethod: input.adjustmentMethod ?? null");
  });

  it("submits the correct adjustment source from QR Scanner mode or Manual Input mode", () => {
    expect(scannerSource).toContain('adjustmentMethod: manualInput ? "manual" : "scan"');
  });

  it("persists the optional reason and makes the adjustment form clear about its purpose", () => {
    expect(schemaSource).toContain('adjustmentNote: text("adjustmentNote")');
    expect(routerSource).toContain("adjustmentNote: input.note?.trim() || null");
    expect(scannerSource).toContain("Reason / Note");
    expect(scannerSource).toContain("Why is this balance being adjusted?");
  });
});
