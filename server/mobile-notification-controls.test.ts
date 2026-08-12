import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appLayoutSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AppLayout.tsx"),
  "utf8",
);

describe("Mobile notification controls", () => {
  it("hides the header notification control below the sm breakpoint", () => {
    expect(appLayoutSource).toContain('className="relative hidden p-2 rounded-xl transition-colors hover:bg-gray-100 sm:block"');
    expect(appLayoutSource).toContain('aria-label="Notifications"');
  });

  it("keeps Alerts available from the mobile More drawer", () => {
    expect(appLayoutSource).toContain('{ href: "/notifications", label: "Alerts",        icon: <Bell size={19} /> }');
  });
});
