import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const submitOrderSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/SubmitOrder.tsx"),
  "utf8",
);

describe("AI Scanner camera permission guide", () => {
  it("tracks camera permission states and requests browser camera access from the action button", () => {
    expect(submitOrderSource).toContain('useState<"prompt" | "granted" | "denied" | "unsupported">("prompt")');
    expect(submitOrderSource).toContain("navigator.mediaDevices.getUserMedia");
    expect(submitOrderSource).toContain("stream.getTracks().forEach(track => track.stop())");
  });

  it("explains first-use permission and provides a denied-permission Manual mode fallback", () => {
    expect(submitOrderSource).toContain("First time using the camera?");
    expect(submitOrderSource).toContain("Camera permission is blocked");
    expect(submitOrderSource).toContain("Use Manual Mode");
  });

  it("keeps Upload Image available as a fallback when the camera is unavailable", () => {
    expect(submitOrderSource).toContain("Camera is not available on this device");
    expect(submitOrderSource).toContain("Upload Image");
  });
});
