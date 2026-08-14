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

export type SitemapCiHistoryEntry = {
  status: Extract<SitemapCiStatus, "passed" | "failed" | "running">;
  conclusion: string | null;
  runUrl: string | null;
  updatedAt: string | null;
  branch: string | null;
  commit: string | null;
  message: string;
};

export type SitemapCiStatusResult = {
  status: SitemapCiStatus;
  workflowConfigured: boolean;
  workflowUrl: string;
  runUrl: string | null;
  updatedAt: string | null;
  branch: string | null;
  commit: string | null;
  message: string;
  history: SitemapCiHistoryEntry[];
};

const workflowUrl = `https://github.com/${SITEMAP_CI_REPOSITORY}/actions/workflows/${SITEMAP_CI_WORKFLOW_FILE}`;
const GITHUB_API_URL = `https://api.github.com/repos/${SITEMAP_CI_REPOSITORY}/actions/workflows/${SITEMAP_CI_WORKFLOW_FILE}/runs?per_page=10`;
const CACHE_TTL_MS = 60_000;

let cachedResult: SitemapCiStatusResult | null = null;
let cachedAt = 0;

function runStatus(run: GitHubWorkflowRun): Extract<SitemapCiStatus, "passed" | "failed" | "running"> {
  if (run.status !== "completed") return "running";
  return run.conclusion === "success" ? "passed" : "failed";
}

export function mapSitemapCiHistoryEntry(run: GitHubWorkflowRun): SitemapCiHistoryEntry {
  const status = runStatus(run);
  const conclusion = run.conclusion ?? null;
  return {
    status,
    conclusion,
    runUrl: run.html_url ?? null,
    updatedAt: run.updated_at ?? null,
    branch: run.head_branch ?? null,
    commit: run.head_sha?.slice(0, 7) ?? null,
    message: status === "passed"
      ? "Validation passed successfully."
      : status === "running"
        ? "Validation is currently running."
        : `Validation ${conclusion ?? "did not complete successfully"}.`,
  };
}

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
      history: [],
    };
  }

  const entry = mapSitemapCiHistoryEntry(run);
  return {
    status: entry.status,
    workflowConfigured: true,
    workflowUrl,
    runUrl: entry.runUrl,
    updatedAt: entry.updatedAt,
    branch: entry.branch,
    commit: entry.commit,
    message: entry.status === "passed"
      ? "Sitemap CI validation passed successfully."
      : entry.status === "running"
        ? "Sitemap CI validation is currently running."
        : "The latest Sitemap CI validation requires attention.",
    history: [entry],
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
        history: [],
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
        history: [],
      };
    } else {
      const payload = (await response.json()) as GitHubWorkflowRunsResponse;
      const history = (payload.workflow_runs ?? []).map(mapSitemapCiHistoryEntry);
      cachedResult = {
        ...mapSitemapCiWorkflowRun(payload.workflow_runs?.[0]),
        history,
      };
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
      history: [],
    };
  }

  cachedAt = Date.now();
  return cachedResult;
}
