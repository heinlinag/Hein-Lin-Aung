import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8",
);

describe("Mobile Home Dashboard hero", () => {
  it("hides the hero below sm while preserving it on sm and larger screens", () => {
    expect(homeSource).toContain('className="relative hidden overflow-hidden sm:block"');
  });

  it("keeps the AnnouncementBanner after the mobile-hidden hero", () => {
    expect(homeSource).toContain("<AnnouncementBanner />");
  });
});
