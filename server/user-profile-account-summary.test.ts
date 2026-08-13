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

  it("uses a cohesive light-mode workspace across profile surfaces and dialogs", () => {
    expect(profileSource).toContain("Full-page light workspace");
    expect(profileSource).toContain('background: "linear-gradient(155deg, #f8fafc 0%, #eef2ff 48%, #f8fafc 100%)"');
    expect(profileSource).toContain('background: "#ffffff", border: "1px solid #e2e8f0"');
    expect(profileSource).toContain("Account Activity History");
    expect(profileSource).toContain('border: "1px solid #cbd5e1"');
    expect(profileSource).toContain('style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}');
  });

  it("places the requested core account details inside Account Summary before profile completion", () => {
    const summaryStart = profileSource.indexOf("Account Summary");
    const detailsStart = profileSource.indexOf("Account Details");
    const completionStart = profileSource.indexOf("Profile Completion");
    expect(detailsStart).toBeGreaterThan(summaryStart);
    expect(detailsStart).toBeLessThan(completionStart);
    expect(profileSource).toContain('label="Display Name"');
    expect(profileSource).toContain('label="Employee ID"');
    expect(profileSource).toContain('label="Department"');
    expect(profileSource).toContain('label="Access Level"');
    expect(profileSource).toContain('label="Member Since"');
  });

  it("provides cooldown-aware quick edit shortcuts for Display Name and Employee ID", () => {
    expect(profileSource).toContain("Quick edit ${label}");
    expect(profileSource).toContain("onEdit={startEditName}");
    expect(profileSource).toContain("editDisabled={nameRemaining > 0}");
    expect(profileSource).toContain("onEdit={startEditId}");
    expect(profileSource).toContain("editDisabled={idRemaining > 0}");
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
    expect(profileSource).toContain("Your account will be automatically suspended if no verified device activity is recorded for 30 days.");
    expect(profileSource).toContain("If no activity is recorded for 30 days");
    expect(profileSource).toContain("trpc.workers.getAccountStatus.useQuery");
    expect(profileSource).toContain("Last device activity");
    expect(profileSource).toContain("Account activity status");
  });

  it("shows each worker only their own inactivity warnings and account status history", () => {
    expect(profileSource).toContain("trpc.profile.getInactivityHistory.useQuery");
    expect(profileSource).toContain("Account Activity History");
    expect(profileSource).toContain("Past inactivity warnings and account status changes");
    expect(profileSource).toContain("No inactivity events recorded");
  });
});
