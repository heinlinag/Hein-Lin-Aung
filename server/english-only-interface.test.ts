import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MYANMAR_SCRIPT = /[\u1000-\u109F]/u;

function collectClientSource(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectClientSource(path);
    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("English-only user interface", () => {
  it("does not contain Myanmar-script text in client application source", () => {
    const clientSourceFiles = collectClientSource(resolve(process.cwd(), "client/src"));
    const filesWithMyanmarText = clientSourceFiles.filter(file => MYANMAR_SCRIPT.test(readFileSync(file, "utf8")));
    expect(filesWithMyanmarText).toEqual([]);
  });
});
