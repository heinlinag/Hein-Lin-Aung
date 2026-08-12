import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminPanelSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/AdminPanel.tsx"),
  "utf8",
);

describe("Admin Workers desktop identity", () => {
  it("shows the stored profile picture in each desktop worker row", () => {
    expect(adminPanelSource).toContain("w.profilePicture ? (");
    expect(adminPanelSource).toContain('src={w.profilePicture}');
    expect(adminPanelSource).toContain('alt={`${w.displayName || w.name} profile`}');
  });

  it("uses a name-initial fallback avatar and prioritizes display names", () => {
    expect(adminPanelSource).toContain('(w.displayName || w.name || "U").slice(0, 1).toUpperCase()');
    expect(adminPanelSource).toContain('{w.displayName || w.name}');
  });

  it("opens a full-size preview only for workers with a stored profile image", () => {
    expect(adminPanelSource).toContain("const [profilePreview, setProfilePreview] = useState<Worker | null>(null)");
    expect(adminPanelSource).toContain("onClick={() => setProfilePreview(w)}");
    expect(adminPanelSource).toContain("{profilePreview?.profilePicture && (");
    expect(adminPanelSource).toContain("profile picture full size");
    expect(adminPanelSource).toContain("Close profile image preview");
  });
});
