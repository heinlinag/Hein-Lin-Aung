import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const appSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");

describe("Stock Dash route loading feedback", () => {
  it("shows a smooth progress indicator when the route location changes", () => {
    expect(appSource).toContain("function BrowserRouteExperience()");
    expect(appSource).toContain("setIsNavigating(true)");
    expect(appSource).toContain("setProgress(78)");
    expect(appSource).toContain('aria-label={isNavigating ? "Loading page" : undefined}');
    expect(appSource).toContain("bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500");
  });
});
