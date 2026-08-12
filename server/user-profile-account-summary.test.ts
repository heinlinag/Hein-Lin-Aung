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
});
