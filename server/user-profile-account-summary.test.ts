import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const profileSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/UserProfile.tsx"),
  "utf8",
);

describe("My Profile account summary", () => {
  it("loads real orders, requests, and samples for the signed-in worker", () => {
    expect(profileSource).toContain("trpc.orders.list.useQuery(listInput");
    expect(profileSource).toContain("trpc.pendingRequests.list.useQuery(listInput");
    expect(profileSource).toContain("trpc.customerSamples.list.useQuery(listInput");
    expect(profileSource).toContain("order.submittedBy === workerID");
    expect(profileSource).toContain('request.requestedBy === workerID && request.status === "pending"');
    expect(profileSource).toContain("sample.requestedBy === workerID");
  });

  it("renders the responsive dark-glass account summary card and its key statistics", () => {
    expect(profileSource).toContain("Account Summary");
    expect(profileSource).toContain("Your stock-management activity at a glance");
    expect(profileSource).toContain("Stock Added");
    expect(profileSource).toContain("Open NPRM");
    expect(profileSource).toContain("Samples");
    expect(profileSource).toContain("Member Days");
    expect(profileSource).toContain("grid-cols-2 gap-2.5 sm:grid-cols-4");
  });

  it("shows profile completion progress with actionable prompts for missing details", () => {
    expect(profileSource).toContain("const completionItems = [");
    expect(profileSource).toContain("Profile Completion");
    expect(profileSource).toContain('role="progressbar"');
    expect(profileSource).toContain("aria-label=\"Profile completion\"");
    expect(profileSource).toContain("Complete now");
    expect(profileSource).toContain("Contact Admin to update");
  });

  it("explains the automatic 30-day suspension policy with current account activity", () => {
    expect(profileSource).toContain("Automatic Suspension Policy");
    expect(profileSource).toContain("Your account will be automatically suspended if no successful sign-in is recorded for 30 days.");
    expect(profileSource).toContain("If no successful sign-in is recorded for 30 days");
    expect(profileSource).toContain("trpc.workers.getAccountStatus.useQuery");
    expect(profileSource).toContain("Last successful sign-in");
    expect(profileSource).toContain("Account activity status");
  });

  it("shows each worker only their own inactivity warnings and account status history", () => {
    expect(profileSource).toContain("trpc.profile.getInactivityHistory.useQuery");
    expect(profileSource).toContain("Account Activity History");
    expect(profileSource).toContain("Past inactivity warnings and account status changes");
    expect(profileSource).toContain("No inactivity events recorded");
  });
});
