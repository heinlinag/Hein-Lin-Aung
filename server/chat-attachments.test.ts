import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const serverSource = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");
const chatSource = readFileSync(resolve(process.cwd(), "client/src/pages/Chat.tsx"), "utf8");

describe("Chat attachment sharing", () => {
  it("persists attachment metadata without storing file bytes in the database", () => {
    expect(schemaSource).toContain('export const chatAttachments = mysqlTable("chatAttachments"');
    expect(schemaSource).toContain('storageKey: varchar("storageKey"');
    expect(schemaSource).toContain('messageType: mysqlEnum("messageType", ["dm", "group"])');
    expect(schemaSource).not.toMatch(/chatAttachments[\s\S]{0,900}\b(blob|binary)\s*\(/i);
  });

  it("accepts worker-authenticated, size-limited supported uploads through the chat upload route", () => {
    expect(serverSource).toContain('app.post("/api/chat-upload"');
    expect(serverSource).toContain("verifyScannerWorkerSession(workerID, deviceToken)");
    expect(serverSource).toContain("fileSize: 10 * 1024 * 1024");
    expect(serverSource).toContain("chatAttachmentMimeTypes");
    expect(serverSource).toContain("storagePut(`chat-attachments/");
  });

  it("stores attachments for both message types and restricts downloads to active chat members", () => {
    expect(routerSource).toContain("getAttachmentDownload: publicProcedure");
    expect(routerSource).toContain("worker.activeDeviceToken !== input.deviceToken");
    expect(routerSource).toContain("You do not have access to this attachment");
    expect(routerSource).toContain('messageType: "dm"');
    expect(routerSource).toContain('messageType: "group"');
    expect(routerSource).toContain("storageGetSignedUrl(attachment.storageKey)");
  });

  it("provides file selection, upload progress, removable previews, and download cards in both composers", () => {
    expect(chatSource).toContain("function AttachmentPicker");
    expect(chatSource).toContain("function MessageAttachmentCard");
    expect(chatSource).toContain("Uploading ${uploadProgress}%");
    expect(chatSource).toContain("AttachmentPicker attachment={attachment.pending}");
    expect(chatSource).toContain("/api/chat-upload");
    expect(chatSource).toContain("MessageAttachmentCard attachment={msg.attachment}");
  });
});
