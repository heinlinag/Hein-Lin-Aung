import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const adminSource = readFileSync(resolve(process.cwd(), "client/src/pages/AdminPanel.tsx"), "utf8");
const geolocationSource = readFileSync(resolve(process.cwd(), "server/ipGeolocation.ts"), "utf8");

describe("Admin Worker Session device details", () => {
  it("persists the active device identity and activity timestamps for workers", () => {
    expect(schemaSource).toContain('activeDeviceToken: varchar("activeDeviceToken"');
    expect(schemaSource).toContain('activeDeviceName: varchar("activeDeviceName"');
    expect(schemaSource).toContain('activeDeviceIP: varchar("activeDeviceIP"');
    expect(schemaSource).toContain('activeLoginAt: timestamp("activeLoginAt")');
    expect(schemaSource).toContain('lastSeenAt: timestamp("lastSeenAt")');
  });

  it("resolves approximate public-IP locations during activation and persists country, region, and city", () => {
    expect(schemaSource).toContain('activeDeviceCountry: varchar("activeDeviceCountry"');
    expect(schemaSource).toContain('activeDeviceRegion: varchar("activeDeviceRegion"');
    expect(schemaSource).toContain('activeDeviceCity: varchar("activeDeviceCity"');
    expect(routerSource).toContain('resolveSignInLocation(ip)');
    expect(routerSource).toContain('setWorkerActiveDevice(input.workerID, input.deviceToken, input.deviceName, ip, signInLocation)');
    expect(geolocationSource).toContain("https://ipwho.is/");
    expect(geolocationSource).toContain("isPublicIPAddress");
  });

  it("keeps normal logout separate from password-protected Administrator revocation", () => {
    expect(routerSource).toContain('deactivateDevice: publicProcedure');
    expect(routerSource).toContain('revokeDevice: publicProcedure');
    expect(routerSource).toContain('adminPassword: z.string().min(1)');
    expect(routerSource).toContain('Invalid admin password');
    expect(routerSource).toContain('Session Revoked By Administrator');
    expect(routerSource).toContain('clearWorkerActiveDevice(input.workerID)');
  });

  it("shows device status, identity, activity, and a confirmation-based revoke action in Worker Sessions", () => {
    expect(adminSource).toContain('Active Device');
    expect(adminSource).toContain('Last Activity');
    expect(adminSource).toContain('activeDeviceName');
    expect(adminSource).toContain('activeDeviceIP');
    expect(adminSource).toContain('lastSeenAt');
    expect(adminSource).toContain('trpc.workers.revokeDevice.useMutation()');
    expect(adminSource).toContain('Revoke active session?');
    expect(adminSource).toContain('Revoke session');
    expect(adminSource).toContain('onRevokeDevice={setRevokeDeviceTarget}');
    expect(adminSource).toContain('Approx. location:');
    expect(adminSource).toContain('activeDeviceCountry');
    expect(adminSource).toContain('activeDeviceRegion');
    expect(adminSource).toContain('activeDeviceCity');
  });
});
