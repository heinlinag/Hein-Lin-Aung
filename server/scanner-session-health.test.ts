import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const submitOrderSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/SubmitOrder.tsx"),
  "utf8",
);
const serverSource = readFileSync(
  resolve(process.cwd(), "server/_core/index.ts"),
  "utf8",
);

describe("AI Scanner session health preflight", () => {
  it("exposes a server-side scanner session health endpoint using active-device validation", () => {
    expect(serverSource).toContain('app.post("/api/scanner-session"');
    expect(serverSource).toContain("verifyScannerWorkerSession");
    expect(serverSource).toContain("worker.activeDeviceToken !== deviceToken");
  });

  it("checks scanner session health before starting image compression and upload", () => {
    const healthCheckIndex = submitOrderSource.indexOf('fetch("/api/scanner-session"');
    const compressionIndex = submitOrderSource.indexOf("const compressed = await compressImage(file)");
    expect(healthCheckIndex).toBeGreaterThan(-1);
    expect(compressionIndex).toBeGreaterThan(healthCheckIndex);
  });

  it("shows a clear in-control session-checking state", () => {
    expect(submitOrderSource).toContain("isCheckingScannerSession");
    expect(submitOrderSource).toContain('"Checking session..."');
  });
});
