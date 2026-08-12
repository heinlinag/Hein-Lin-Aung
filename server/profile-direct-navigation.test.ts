import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AppLayout.tsx"),
  "utf8",
);

describe("Direct profile navigation", () => {
  it("removes the profile quick panel and its open state", () => {
    expect(layoutSource).not.toContain("ProfileDropdown");
    expect(layoutSource).not.toContain("profileOpen");
    expect(layoutSource).not.toContain("profileRef");
  });

  it("routes both desktop and mobile profile controls directly to My Profile", () => {
    const profileNavigationOccurrences = layoutSource.match(/navigate\("\/user-profile"\)/g) ?? [];
    expect(profileNavigationOccurrences).toHaveLength(2);
    expect(layoutSource).toContain('aria-label="Open My Profile"');
  });
});
