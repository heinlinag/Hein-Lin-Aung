import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chatSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Chat.tsx"),
  "utf8",
);
const layoutSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AppLayout.tsx"),
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

  it("hides only the shared application header for the Messages workspace", () => {
    expect(chatSource).toContain("<AppLayout pageTitle=\"Messages\" headerActions={mobileHeaderActions} fullHeight hideAppHeader>");
    expect(layoutSource).toContain("hideAppHeader?: boolean;");
    expect(layoutSource).toContain("hideAppHeader = false");
    expect(layoutSource).toContain("!hideAppHeader && <header");
  });

  it("renders Send Alert above the mobile chat thread through a document-level portal", () => {
    expect(chatSource).toContain('import { createPortal } from "react-dom";');
    expect(chatSource).toContain('createPortal(');
    expect(chatSource).toContain('z-[220]');
    expect(chatSource).toContain('document.body');
    expect(chatSource).toContain('max-h-[calc(100dvh-8rem)]');
  });

  it("uses stored worker profile pictures across Message avatars with initial fallbacks", () => {
    expect(chatSource).toContain("profilePicture?: string | null");
    expect(chatSource).toContain('profilePicture && !isGroup');
    expect(chatSource).toContain('alt={`${name} profile`}');
    expect(chatSource).toContain('profilePicture={conv.otherWorker?.profilePicture}');
    expect(chatSource).toContain('profilePicture={memberProfileByID.get(msg.senderID)}');
    expect(chatSource).toContain('profilePicture={m.worker?.profilePicture}');
  });
});
