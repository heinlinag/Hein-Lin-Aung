import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/AdminPanel.tsx"), "utf8");

describe("Admin mobile modal stability", () => {
  it("moves all critical Worker and Order dialogs into a document-level stable portal", () => {
    expect(source).toContain('function StableAdminModalLayer');
    expect(source).toContain('createPortal(');
    expect(source).toContain('aria-label="Add Worker"');
    expect(source).toContain('aria-label="Edit Worker"');
    expect(source).toContain('aria-label="Delete Worker"');
    expect(source).toContain('aria-label="Delete Order"');
    expect(source).toContain('aria-label="Used Update"');
    expect((source.match(/<StableAdminModalLayer>/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(source).toMatch(/\{showAdd && \(\s*<StableAdminModalLayer>/);
    expect(source).toMatch(/\{editTarget && \(\s*<StableAdminModalLayer>/);
    expect(source).toMatch(/\{deleteTarget && \(\s*<StableAdminModalLayer>/);
    expect(source).toMatch(/\{usedUpdateTarget && \(\s*<StableAdminModalLayer>/);
  });

  it("uses mobile-safe viewport sizing and a high-priority modal layer", () => {
    expect(source).toContain('z-[500]');
    expect(source).toContain('min-h-[100dvh]');
    expect(source).toContain('max-h-[calc(100dvh-8rem)]');
    expect(source).toContain('sm:max-w-md');
    expect(source).toContain('translateZ(0)');
  });

  it("removes backdrop-filter compositing from all remaining Admin modal overlays", () => {
    expect(source).toContain('.admin-light .fixed.inset-0.backdrop-blur-sm');
    expect(source).toContain('backdrop-filter:none !important');
    expect(source).toContain('[style*="backdrop-filter"],.admin-light [style*="backdropFilter"]');
  });

  it("settles the Worker swipe card before opening Edit or Delete modal state", () => {
    expect(source).toContain("const completeSwipeAction");
    expect(source).toContain("setRevealed(false)");
    expect(source).toContain("setOffsetX(0)");
    expect(source).toContain("window.setTimeout(() => {");
    expect(source).toContain("}, 280)");
    expect(source).toContain("completeSwipeAction(onEdit)");
    expect(source).toContain("completeSwipeAction(onDelete)");
    expect(source).toContain('background: "#ffffff"');
  });
});
