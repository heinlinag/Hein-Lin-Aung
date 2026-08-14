import { describe, expect, it } from "vitest";
import { mapSitemapCiHistoryEntry, mapSitemapCiWorkflowRun, SITEMAP_CI_REPOSITORY, SITEMAP_CI_WORKFLOW_FILE } from "./githubCiStatus";
import fs from "node:fs";
import path from "node:path";

describe("Admin Sitemap CI status", () => {
  it("maps the latest GitHub workflow result into clear admin-visible states", () => {
    expect(mapSitemapCiWorkflowRun()).toMatchObject({ status: "awaiting_run", workflowConfigured: true });
    expect(mapSitemapCiWorkflowRun({ status: "queued" })).toMatchObject({ status: "running" });
    expect(mapSitemapCiWorkflowRun({ status: "completed", conclusion: "success" })).toMatchObject({ status: "passed" });
    expect(mapSitemapCiWorkflowRun({ status: "completed", conclusion: "failure" })).toMatchObject({ status: "failed" });
  });

  it("uses the Stock Dash repository and Sitemap Validation workflow", () => {
    const passed = mapSitemapCiWorkflowRun({ status: "completed", conclusion: "success" });
    expect(SITEMAP_CI_REPOSITORY).toBe("heinlinag/Hein-Lin-Aung");
    expect(SITEMAP_CI_WORKFLOW_FILE).toBe("sitemap-validation.yml");
    expect(passed.workflowUrl).toContain("heinlinag/Hein-Lin-Aung");
    expect(passed.workflowUrl).toContain("sitemap-validation.yml");
  });

  it("installs the package-managed pnpm before enabling the GitHub Actions pnpm cache", () => {
    const workflow = fs.readFileSync(path.resolve(import.meta.dirname, "../.github/workflows/sitemap-validation.yml"), "utf8");
    expect(workflow.indexOf("uses: pnpm/action-setup@v4")).toBeLessThan(workflow.indexOf("uses: actions/setup-node@v4"));
    expect(workflow).not.toContain("version: 10");
  });

  it("maps recent workflow runs into dashboard history rows", () => {
    expect(mapSitemapCiHistoryEntry({ status: "completed", conclusion: "success", head_branch: "stock-dash", head_sha: "abcdef123456" }))
      .toMatchObject({ status: "passed", branch: "stock-dash", commit: "abcdef1" });
    expect(mapSitemapCiHistoryEntry({ status: "completed", conclusion: "failure" }))
      .toMatchObject({ status: "failed" });
    expect(mapSitemapCiHistoryEntry({ status: "in_progress" }))
      .toMatchObject({ status: "running" });
  });

  it("renders a visual status badge with refresh and workflow actions in the Admin dashboard", () => {
    const adminPanel = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/AdminPanel.tsx"), "utf8");
    const badge = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/components/SitemapCiStatusBadge.tsx"), "utf8");
    expect(adminPanel).toContain("SitemapCiStatusBadge");
    expect(badge).toContain("Sitemap CI Passed");
    expect(badge).toContain("Refresh Sitemap CI status");
    expect(badge).toContain("View workflow");
    expect(badge).toContain("Recent Sitemap CI Runs");
    expect(badge).toContain('role="alert"');
    expect(adminPanel).toContain("history={sitemapCiQuery.data?.history}");
    expect(adminPanel).toContain("trpc.system.getSitemapCiStatus.useQuery");
  });
});
