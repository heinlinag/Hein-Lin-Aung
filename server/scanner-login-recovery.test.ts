import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const submitOrderSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/SubmitOrder.tsx"),
  "utf8",
);

describe("AI Scanner session recovery", () => {
  it("stores a failed session-check message for the scanner upload screen", () => {
    expect(submitOrderSource).toContain("scannerSessionError");
    expect(submitOrderSource).toContain("setScannerSessionError(message)");
    expect(submitOrderSource).toContain("Scanner session check failed");
  });

  it("clears the stale worker session and redirects to Login", () => {
    expect(submitOrderSource).toContain('logoutWorker(); navigate("/login")');
    expect(submitOrderSource).toContain("Go to Login");
  });
});
