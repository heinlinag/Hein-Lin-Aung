import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appLayoutSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AppLayout.tsx"),
  "utf8",
);

describe("Mobile header logo container", () => {
  it("uses a white logo container rather than the previous blue gradient", () => {
    expect(appLayoutSource).toContain(
      "rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm",
    );
    expect(appLayoutSource).not.toContain(
      "rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm",
    );
  });
});
