export const SITEMAP_CI_REPOSITORY = "heinlinag/Hein-Lin-Aung";
export const SITEMAP_CI_WORKFLOW_FILE = "sitemap-validation.yml";

type GitHubWorkflowRun = {
  status?: string | null;
  conclusion?: string | null;
  html_url?: string | null;
  updated_at?: string | null;
  head_branch?: string | null;
  head_sha?: string | null;
};

type GitHubWorkflowRunsResponse = {
  workflow_runs?: GitHubWorkflowRun[];
};

export type SitemapCiStatus = "passed" | "failed" | "running" | "awaiting_run" | "not_configured" | "unavailable";

export type SitemapCiStatusResult = {
  status: SitemapCiStatus;
  workflowConfigured: boolean;
  workflowUrl: string;
  runUrl: string | null;
  updatedAt: string | null;
  branch: string | null;
  commit: string | null;
  message: string;
};

const workflowUrl = `https://github.com/${SITEMAP_CI_REPOSITORY}/actions/workflows/${SITEMAP_CI_WORKFLOW_FILE}`;
const GITHUB_API_URL = `https://api.github.com/repos/${SITEMAP_CI_REPOSITORY}/actions/workflows/${SITEMAP_CI_WORKFLOW_FILE}/runs?per_page=1`;
const CACHE_TTL_MS = 60_000;

let cachedResult: SitemapCiStatusResult | null = null;
let cachedAt = 0;

export function mapSitemapCiWorkflowRun(run?: GitHubWorkflowRun): SitemapCiStatusResult {
  if (!run) {
    return {
      status: "awaiting_run",
      workflowConfigured: true,
      workflowUrl,
      runUrl: null,
      updatedAt: null,
      branch: null,
      commit: null,
      message: "The workflow is ready and awaiting its first repository run.",
    };
  }

  const shared = {
    workflowConfigured: true,
    workflowUrl,
    runUrl: run.html_url ?? null,
    updatedAt: run.updated_at ?? null,
    branch: run.head_branch ?? null,
    commit: run.head_sha?.slice(0, 7) ?? null,
  };

  if (run.status !== "completed") {
    return {
      ...shared,
      status: "running",
      message: "Sitemap CI validation is currently running.",
    };
  }

  if (run.conclusion === "success") {
    return {
      ...shared,
      status: "passed",
      message: "Sitemap CI validation passed successfully.",
    };
  }

  return {
    ...shared,
    status: "failed",
    message: "The latest Sitemap CI validation requires attention.",
  };
}

export async function getSitemapCiStatus(force = false): Promise<SitemapCiStatusResult> {
  if (!force && cachedResult && Date.now() - cachedAt < CACHE_TTL_MS) return cachedResult;

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Stock-Dash-Sitemap-CI-Status",
      },
    });

    if (response.status === 404) {
      cachedResult = {
        status: "not_configured",
        workflowConfigured: false,
        workflowUrl,
        runUrl: null,
        updatedAt: null,
        branch: null,
        commit: null,
        message: "The workflow is awaiting repository sync before its first live CI run.",
      };
    } else if (!response.ok) {
      cachedResult = {
        status: "unavailable",
        workflowConfigured: false,
        workflowUrl,
        runUrl: null,
        updatedAt: null,
        branch: null,
        commit: null,
        message: `GitHub CI status is temporarily unavailable (HTTP ${response.status}).`,
      };
    } else {
      const payload = (await response.json()) as GitHubWorkflowRunsResponse;
      cachedResult = mapSitemapCiWorkflowRun(payload.workflow_runs?.[0]);
    }
  } catch {
    cachedResult = {
      status: "unavailable",
      workflowConfigured: false,
      workflowUrl,
      runUrl: null,
      updatedAt: null,
      branch: null,
      commit: null,
      message: "GitHub CI status could not be reached. Please try again shortly.",
    };
  }

  cachedAt = Date.now();
  return cachedResult;
}
