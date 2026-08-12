import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chatSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Chat.tsx"),
  "utf8",
);

describe("Messages interface redesign", () => {
  it("provides a responsive dark-glass desktop workspace and mobile panel", () => {
    expect(chatSource).toContain(".chat-shell");
    expect(chatSource).toContain(".chat-mobile-panel");
    expect(chatSource).toContain("rounded-[28px] border border-white/10 shadow-2xl");
    expect(chatSource).toContain("chat-mobile-panel flex md:hidden");
  });

  it("upgrades conversation discovery and state hierarchy", () => {
    expect(chatSource).toContain("chat-sidebar-head");
    expect(chatSource).toContain("Team inbox");
    expect(chatSource).toContain("chat-list-item");
    expect(chatSource).toContain("Connected workspace");
    expect(chatSource).toContain("Keep stock conversations in one focused place");
  });

  it("uses improved thread canvases and elevated composers for direct and group messages", () => {
    expect(chatSource).toContain("chat-thread-header");
    expect(chatSource).toContain("chat-message-canvas");
    expect(chatSource).toContain("chat-composer");
    expect(chatSource).toContain("chat-send-button");
    expect(chatSource).toContain("chat-group-send-button");
  });
});
