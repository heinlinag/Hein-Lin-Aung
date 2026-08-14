import { AlertTriangle, CheckCircle2, Clock, GitBranch, Loader2, RefreshCw, XCircle } from "lucide-react";

type SitemapCiStatus = "passed" | "failed" | "running" | "awaiting_run" | "not_configured" | "unavailable";

export function SitemapCiStatusBadge({
  status,
  message,
  updatedAt,
  branch,
  commit,
  workflowUrl,
  runUrl,
  history,
  isLoading,
  onRefresh,
}: {
  status?: SitemapCiStatus;
  message?: string;
  updatedAt?: string | null;
  branch?: string | null;
  commit?: string | null;
  workflowUrl?: string;
  runUrl?: string | null;
  history?: Array<{
    status: "passed" | "failed" | "running";
    conclusion: string | null;
    runUrl: string | null;
    updatedAt: string | null;
    branch: string | null;
    commit: string | null;
    message: string;
  }>;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const presentation = {
    passed: { label: "Sitemap CI Passed", icon: CheckCircle2, accent: "text-emerald-700", iconBg: "bg-emerald-100", border: "border-emerald-200", background: "bg-emerald-50/70" },
    failed: { label: "Sitemap CI Failed", icon: XCircle, accent: "text-rose-700", iconBg: "bg-rose-100", border: "border-rose-200", background: "bg-rose-50/80" },
    running: { label: "Sitemap CI Running", icon: Loader2, accent: "text-sky-700", iconBg: "bg-sky-100", border: "border-sky-200", background: "bg-sky-50/80" },
    awaiting_run: { label: "CI Awaiting First Run", icon: Clock, accent: "text-amber-700", iconBg: "bg-amber-100", border: "border-amber-200", background: "bg-amber-50/80" },
    not_configured: { label: "CI Awaiting Repository Sync", icon: GitBranch, accent: "text-slate-700", iconBg: "bg-slate-100", border: "border-slate-200", background: "bg-slate-50" },
    unavailable: { label: "CI Status Unavailable", icon: AlertTriangle, accent: "text-slate-700", iconBg: "bg-slate-100", border: "border-slate-200", background: "bg-slate-50" },
  } as const;
  const state = presentation[status ?? "unavailable"];
  const Icon = state.icon;
  const detailTime = updatedAt ? new Date(updatedAt).toLocaleString() : "Not available yet";
  const destination = runUrl ?? workflowUrl;

  return (
    <section className={`admin-light-surface rounded-2xl border p-4 lg:p-5 ${state.background} ${state.border}`} aria-label="Sitemap CI validation status">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${state.iconBg} ${state.accent}`}>
            <Icon size={19} className={status === "running" || isLoading ? "animate-spin" : ""} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-sm font-extrabold ${state.accent}`}>{state.label}</p>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${state.border} ${state.accent}`}>GitHub Actions</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">{isLoading ? "Checking the latest repository workflow result…" : message}</p>
            <p className="mt-1 text-[11px] text-slate-500">Last update: {detailTime}{branch ? ` · ${branch}` : ""}{commit ? ` · ${commit}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {destination && <a href={destination} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">View workflow</a>}
          <button onClick={onRefresh} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700" title="Refresh Sitemap CI status">
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>
      {status === "failed" && (
        <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-white/80 p-3 text-sm text-rose-800">
          <span className="font-extrabold">Action required.</span> Sitemap validation failed on the latest live check. Review the workflow details, correct the issue, then refresh this panel.
        </div>
      )}

      {history && history.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white/80">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-extrabold text-slate-900">Recent Sitemap CI Runs</p>
              <p className="mt-0.5 text-xs text-slate-500">The latest ten GitHub Actions runs for the synced Stock Dash branch.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{history.length} runs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Result</th>
                  <th className="px-4 py-2.5 font-bold">Branch</th>
                  <th className="px-4 py-2.5 font-bold">Commit</th>
                  <th className="px-4 py-2.5 font-bold">Updated</th>
                  <th className="px-4 py-2.5 text-right font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((run, index) => {
                  const runTone = presentation[run.status];
                  return (
                    <tr key={`${run.runUrl ?? "run"}-${run.updatedAt ?? index}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${runTone.border} ${runTone.accent}`}>{run.status}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{run.branch ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">{run.commit ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{run.updatedAt ? new Date(run.updatedAt).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {run.runUrl ? <a href={run.runUrl} target="_blank" rel="noreferrer" className="font-bold text-indigo-700 hover:text-indigo-900">Open</a> : <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
