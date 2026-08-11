import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const submitOrderSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/SubmitOrder.tsx"),
  "utf8",
);
const scanRouteSource = readFileSync(
  resolve(process.cwd(), "server/_core/index.ts"),
  "utf8",
);

describe("AI Scanner worker authentication", () => {
  it("uses the saved browser device token when an existing worker session lacks its token field", () => {
    expect(submitOrderSource).toContain('worker?.deviceToken ?? localStorage.getItem("gspp_device_token") ?? ""');
    expect(submitOrderSource).toContain('formData.append("workerID", worker.workerID)');
    expect(submitOrderSource).toContain('formData.append("deviceToken", scannerDeviceToken)');
  });

  it("keeps server-side validation of the worker active-device token", () => {
    expect(scanRouteSource).toContain("worker.activeDeviceToken !== deviceToken");
    expect(scanRouteSource).toContain("Scanner session expired. Please sign out and sign in again.");
  });

  it("gives the worker a recovery message instead of the ambiguous login error", () => {
    expect(submitOrderSource).toContain("Scanner session needs refreshing. Please sign out and sign in again.");
    expect(scanRouteSource).toContain("Scanner session missing. Please sign out and sign in again.");
  });
});
