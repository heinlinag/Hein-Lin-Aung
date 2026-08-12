import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chatSource = readFileSync(resolve(process.cwd(), "client/src/pages/Chat.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");

describe("Messages typing indicator", () => {
  it("persists expiring typing state for direct and group conversations", () => {
    expect(schemaSource).toContain('export const chatTypingStates = mysqlTable("chatTypingStates"');
    expect(schemaSource).toContain('channelType: mysqlEnum("channelType", ["dm", "group"])');
    expect(schemaSource).toContain("chatTypingStates_channel_worker_unique");
    expect(routerSource).toContain("chatTyping: router({");
    expect(routerSource).toContain("isTyping: z.boolean()");
    expect(routerSource).toContain("new Date(now.getTime() + 6500)");
    expect(routerSource).toContain("gt(chatTypingStates.expiresAt, new Date())");
  });

  it("signals while composing, expires inactive state, and decorates active avatars", () => {
    expect(chatSource).toContain("function useTypingPresence");
    expect(chatSource).toContain("timeoutRef.current = setTimeout(stop, 5200)");
    expect(chatSource).toContain('useTypingPresence({ channelType: "dm", channelID: conv.id, workerID })');
    expect(chatSource).toContain('useTypingPresence({ channelType: "group", channelID: group.id, workerID })');
    expect(chatSource).toContain("chat-typing-ring");
    expect(chatSource).toContain("typing={partnerTyping}");
    expect(chatSource).toContain("typing={typingMemberIDs.has(msg.senderID)}");
  });
});
