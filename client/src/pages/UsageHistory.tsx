import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Loader2, History, ChevronDown, ChevronUp } from "lucide-react";
import AppLayout from "@/components/AppLayout";

type UsageEntry = {
  id: number;
  jobNo: string | null;
  usedQty: number;
  orderID: string;
  fluteType: string;
  bqComment: string;
  purpose: "job" | "old_stock";
  createdAt: Date;
  masterCard?: string | null;
  boardSizeW?: number | null;
  boardSizeL?: number | null;
  scores?: string | null;
  submittedBy?: string | null;
};

function MobileCard({ entry }: { entry: UsageEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasExtra = entry.masterCard || entry.boardSizeW || entry.scores;
  return (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-foreground text-base">
                {entry.jobNo || <span className="text-muted-foreground italic text-sm">No Job No</span>}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                entry.purpose === "job" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
              }`}>
                {entry.purpose === "job" ? "Job No" : "Old Stock"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <span className="font-bold text-primary text-lg shrink-0">{entry.usedQty} pcs</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="text-muted-foreground text-xs">Order ID</span>
            <div className="font-semibold text-foreground">{entry.orderID}</div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Flute</span>
            <div>
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                Flute : {entry.fluteType}
              </span>
            </div>
          </div>
        </div>
        <div className="mb-2">
          <span className="text-muted-foreground text-xs block mb-1">BQ</span>
          <BQBadge value={entry.bqComment} />
        </div>
        {entry.submittedBy && (
          <div className="text-xs text-muted-foreground mt-1">By: <span className="font-medium text-foreground">{entry.submittedBy}</span></div>
        )}
      </div>
      {hasExtra && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <span>Job Details</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expanded && (
            <div className="px-4 pb-4 pt-3 bg-blue-50/50 grid grid-cols-2 gap-2 text-sm border-t border-blue-100">
              {entry.masterCard && (
                <div>
                  <span className="text-xs text-muted-foreground">Master Card</span>
                  <div className="font-mono font-semibold text-foreground">{entry.masterCard}</div>
                </div>
              )}
              {(entry.boardSizeW || entry.boardSizeL) && (
                <div>
                  <span className="text-xs text-muted-foreground">Board Size</span>
                  <div className="font-semibold text-foreground">{entry.boardSizeW ?? "—"}×{entry.boardSizeL ?? "—"} mm</div>
                </div>
              )}
              {entry.scores && (
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground">Scores</span>
                  <div className="font-mono text-foreground">{entry.scores}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BQBadge({ value }: { value: string }) {
  return <span className="bq-highlight">{value}</span>;
}

export default function UsageHistory() {
  const [search, setSearch] = useState("");

  const usageHistory = trpc.orders.getUsage.useQuery();
  const entries = (usageHistory.data as UsageEntry[] | undefined) || [];

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    return (
      !q ||
      e.orderID.toLowerCase().includes(q) ||
      (e.jobNo && e.jobNo.includes(q)) ||
      e.fluteType.toLowerCase().includes(q) ||
      e.bqComment.toLowerCase().includes(q) ||
      (e.masterCard && e.masterCard.toLowerCase().includes(q)) ||
      (e.submittedBy && e.submittedBy.toLowerCase().includes(q))
    );
  });

  return (
    <AppLayout pageTitle="Usage History">
      <main className="container lg:max-w-none lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Usage History</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{entries.length} records total</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Order ID, Job No, Master Card, Employee ID..."
            className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {usageHistory.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <History size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No usage records found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job No</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Used Qty</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order ID</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Flute</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">BQ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Master Card</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Board Size</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scores</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">By</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(entry => (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">
                          {entry.jobNo || <span className="text-muted-foreground italic">—</span>}
                        </td>
                        <td className="px-4 py-3 font-bold text-primary">{entry.usedQty} pcs</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{entry.orderID}</td>
                        <td className="px-4 py-3">
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                            Flute : {entry.fluteType}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <BQBadge value={entry.bqComment} />
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">
                          {entry.masterCard || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {(entry.boardSizeW && entry.boardSizeL)
                            ? <span className="font-medium">{entry.boardSizeW}×{entry.boardSizeL} <span className="text-xs text-muted-foreground">mm</span></span>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">
                          {entry.scores || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
                          {entry.submittedBy || <span className="italic">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            entry.purpose === "job" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                          }`}>
                            {entry.purpose === "job" ? "Job No" : "Old Stock"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()}
                          <div>{new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(entry => (
                <MobileCard key={entry.id} entry={entry} />
              ))}
            </div>
          </>
        )}
      </main>
    </AppLayout>
  );
}
