import { useState } from "react";
import { ContactMessagesTab } from "@/components/ContactMessagesTab";
import { AnnouncementsTab } from "@/components/AnnouncementsTab";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Lock, Plus, Trash2, RefreshCw, Loader2, Users, Package, History, ClipboardList, CheckCircle2, XCircle, Clock, FileSpreadsheet, TrendingUp, AlertTriangle, Inbox, Pencil, Zap, LogOut, Megaphone, Wrench, ShieldAlert, Power } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LOGO_URL = "/manus-storage/gspp_logo_new_2db75f16.png";
const ADMIN_PASSWORD = "Qwer@7090heinann";

type Worker = { id: number; workerID: string; name: string; department: string; userLevel: "1" | "1.1" | "2"; createdAt: Date };
type Order = {
  id: number; orderID: string; trackingId?: string; fluteType: string; sizeW: number; sizeL: number;
  qty: number; bqComment: string; status: "current" | "out_of_stock"; submittedBy: string | null; createdAt: Date;
};

function RefreshButton({ onRefresh, size = 15 }: { onRefresh: () => void | Promise<void>; size?: number }) {
  const [spinning, setSpinning] = useState(false);
  return (
    <button
      onClick={async () => { setSpinning(true); await onRefresh(); setTimeout(() => setSpinning(false), 700); }}
      className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded"
      title="Refresh"
    >
      <RefreshCw size={size} className={spinning ? "animate-spin" : "transition-transform"} />
    </button>
  );
}

// ─── Workers Tab ───────────────────────────────────────────────────────────────
function WorkersTab() {
  const utils = trpc.useUtils();
  const workersQuery = trpc.workers.list.useQuery();
  const workers = (workersQuery.data ?? []) as Worker[];

  const [showAdd, setShowAdd] = useState(false);
  const [newWorkerID, setNewWorkerID] = useState("");
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newUserLevel, setNewUserLevel] = useState<"1" | "1.1" | "2">("2");
  const [addError, setAddError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [deleteVerifyPassword, setDeleteVerifyPassword] = useState("");

  // Edit state
  const [editTarget, setEditTarget] = useState<Worker | null>(null);
  const [editWorkerID, setEditWorkerID] = useState("");
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editUserLevel, setEditUserLevel] = useState<"1" | "1.1" | "2">("2");
  const [editConfirmID, setEditConfirmID] = useState("");
  const [editStep, setEditStep] = useState<"form" | "confirm">("form");
  const [editError, setEditError] = useState("");

  const addWorker = trpc.workers.add.useMutation();
  const deleteWorker = trpc.workers.delete.useMutation();
  const updateWorker = trpc.workers.update.useMutation();

  const openEdit = (w: Worker) => {
    setEditTarget(w);
    setEditWorkerID(w.workerID);
    setEditName(w.name);
    setEditDept(w.department);
    setEditUserLevel(w.userLevel);
    setEditConfirmID("");
    setEditStep("form");
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (editStep === "form") {
      if (!editWorkerID.trim() || !editName.trim() || !editDept.trim()) {
        setEditError("All fields are required.");
        return;
      }
      setEditStep("confirm");
      setEditError("");
      return;
    }
    // Confirm step
    if (editConfirmID.trim() !== editWorkerID.trim()) {
      setEditError("Employee ID does not match. Please re-enter the Employee ID to confirm.");
      return;
    }
    try {
      await updateWorker.mutateAsync({
        id: editTarget.id,
        workerID: editWorkerID.trim(),
        name: editName.trim(),
        department: editDept.trim(),
        userLevel: editUserLevel,
        confirmWorkerID: editConfirmID.trim(),
        adminPassword: ADMIN_PASSWORD,
      });
      toast.success("Worker updated successfully.");
      utils.workers.list.invalidate();
      setEditTarget(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setEditError(e?.message ?? "Failed to update worker.");
    }
  };

  const handleAdd = async () => {
    setAddError("");
    if (!newWorkerID.trim() || !newName.trim() || !newDept.trim()) {
      setAddError("All fields are required.");
      return;
    }
    try {
      await addWorker.mutateAsync({ workerID: newWorkerID.trim(), name: newName.trim(), department: newDept.trim(), userLevel: newUserLevel, adminPassword: ADMIN_PASSWORD });
      toast.success("Worker added.");
      utils.workers.list.invalidate();
      setShowAdd(false);
      setNewWorkerID(""); setNewName(""); setNewDept(""); setNewUserLevel("2");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setAddError(e?.message ?? "Failed to add worker.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteVerifyPassword !== ADMIN_PASSWORD) {
      toast.error("Incorrect admin password. Please try again.");
      return;
    }
    try {
      await deleteWorker.mutateAsync({ id: deleteTarget.id, adminPassword: ADMIN_PASSWORD });
      toast.success("Worker deleted successfully.");
      utils.workers.list.invalidate();
      setDeleteTarget(null);
      setDeleteVerifyPassword("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to delete worker.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{workers.length} registered worker{workers.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={13} /> Add Worker
        </button>
      </div>

      {workersQuery.isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No workers registered</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Employee ID</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Name</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Department</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Level</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {workers.map(w => (
                  <tr key={w.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 text-sm font-semibold text-primary">{w.workerID}</td>
                    <td className="py-3 pr-4 text-sm text-foreground">{w.name}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{w.department}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${w.userLevel === "1" ? "bg-orange-100 text-orange-700" : w.userLevel === "1.1" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>Lv.{w.userLevel}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(w)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit worker">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(w)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete worker">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {workers.map(w => (
              <div key={w.id} className="p-4 bg-white border border-border rounded-xl shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Employee ID</p>
                    <p className="text-sm font-bold text-primary">{w.workerID}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(w)} className="text-muted-foreground hover:text-primary p-1" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteTarget(w)} className="text-muted-foreground hover:text-destructive p-1" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground text-xs">Name</span>
                  <span className="text-foreground font-medium">{w.name}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted-foreground text-xs">Department</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{w.department}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted-foreground text-xs">User Level</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${w.userLevel === "1" ? "bg-orange-100 text-orange-700" : w.userLevel === "1.1" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>Level {w.userLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Worker Dialog */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-foreground mb-4">Add Worker</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Employee ID</label>
                <input type="text" value={newWorkerID} onChange={e => { setNewWorkerID(e.target.value); setAddError(""); }} placeholder="e.g. DN156" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Name</label>
                <input type="text" value={newName} onChange={e => { setNewName(e.target.value); setAddError(""); }} placeholder="Full name" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Department</label>
                <input type="text" value={newDept} onChange={e => { setNewDept(e.target.value); setAddError(""); }} placeholder="e.g. Production" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">User Level</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserLevel("1")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${newUserLevel === "1" ? "bg-orange-100 border-orange-400 text-orange-700" : "border-border text-muted-foreground hover:bg-gray-50"}`}
                  >
                    Level 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserLevel("1.1")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${newUserLevel === "1.1" ? "bg-purple-100 border-purple-400 text-purple-700" : "border-border text-muted-foreground hover:bg-gray-50"}`}
                  >
                    Level 1.1
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserLevel("2")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${newUserLevel === "2" ? "bg-green-100 border-green-400 text-green-700" : "border-border text-muted-foreground hover:bg-gray-50"}`}
                  >
                    Level 2
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{newUserLevel === "1" ? "Level 1: Actions require Level 2 approval" : newUserLevel === "1.1" ? "Level 1.1: Can process-approve Level 1 requests (Level 2 gives final approval)" : "Level 2: Can approve/cancel Level 1 requests"}</p>
              </div>
              {addError && <p className="text-xs text-destructive">{addError}</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowAdd(false); setAddError(""); }} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={addWorker.isPending} className="flex-1 gspp-gradient text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {addWorker.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Worker Dialog */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            {editStep === "form" ? (
              <>
                <h3 className="font-bold text-foreground mb-1">Edit Worker</h3>
                <p className="text-xs text-muted-foreground mb-4">Update details for <strong>{editTarget.workerID}</strong></p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Employee ID</label>
                    <input type="text" value={editWorkerID} onChange={e => { setEditWorkerID(e.target.value.toUpperCase()); setEditError(""); }} placeholder="e.g. DN156" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Name</label>
                    <input type="text" value={editName} onChange={e => { setEditName(e.target.value); setEditError(""); }} placeholder="Full name" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Department</label>
                    <input type="text" value={editDept} onChange={e => { setEditDept(e.target.value); setEditError(""); }} placeholder="e.g. Production" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">User Level</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditUserLevel("1")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${editUserLevel === "1" ? "bg-orange-100 border-orange-400 text-orange-700" : "border-border text-muted-foreground hover:bg-gray-50"}`}>Level 1</button>
                      <button type="button" onClick={() => setEditUserLevel("1.1")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${editUserLevel === "1.1" ? "bg-purple-100 border-purple-400 text-purple-700" : "border-border text-muted-foreground hover:bg-gray-50"}`}>Level 1.1</button>
                      <button type="button" onClick={() => setEditUserLevel("2")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${editUserLevel === "2" ? "bg-green-100 border-green-400 text-green-700" : "border-border text-muted-foreground hover:bg-gray-50"}`}>Level 2</button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{editUserLevel === "1" ? "Level 1: Actions require Level 2 approval" : editUserLevel === "1.1" ? "Level 1.1: Can process-approve Level 1 requests (Level 2 gives final approval)" : "Level 2: Can approve/cancel Level 1 requests"}</p>
                  </div>
                  {editError && <p className="text-xs text-destructive">{editError}</p>}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setEditTarget(null)} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">Cancel</button>
                  <button onClick={handleEditSave} className="flex-1 gspp-gradient text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90">Next →</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold text-foreground mb-1">Confirm Update</h3>
                <p className="text-sm text-muted-foreground mb-4">To confirm, please re-enter the Employee ID <strong className="text-primary">{editWorkerID}</strong> below.</p>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Re-enter Employee ID</label>
                  <input
                    type="text"
                    value={editConfirmID}
                    onChange={e => { setEditConfirmID(e.target.value.toUpperCase()); setEditError(""); }}
                    placeholder={`Type ${editWorkerID} to confirm`}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  {editError && <p className="text-xs text-destructive mt-2">{editError}</p>}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setEditStep("form"); setEditError(""); }} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">← Back</button>
                  <button
                    onClick={handleEditSave}
                    disabled={updateWorker.isPending || editConfirmID.trim() !== editWorkerID.trim()}
                    className="flex-1 gspp-gradient text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updateWorker.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-destructive" />
              <h3 className="font-bold text-foreground">Delete Worker - Verification Required</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. You are about to permanently delete <strong>{deleteTarget.name}</strong> ({deleteTarget.workerID}) from the system.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-700 font-semibold mb-2">⚠️ Enter admin password to confirm:</p>
              <input
                type="password"
                value={deleteVerifyPassword}
                onChange={e => setDeleteVerifyPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleDelete()}
                placeholder="Admin password"
                className="w-full border border-red-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteVerifyPassword(""); }} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleteWorker.isPending || !deleteVerifyPassword} className="flex-1 bg-destructive text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteWorker.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export Helpers ───────────────────────────────────────────────────────────
function exportToExcel(orders: Order[]) {
  import("xlsx").then(XLSX => {
    const wb = XLSX.utils.book_new();
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    function buildSheet(subset: Order[], sheetLabel: string) {
      const HEADERS = ["No.", "Production Order", "Flute Type", "Width (mm)", "Length (mm)", "Size (W×L)", "Qty (pcs)", "BQ Comment", "Submitted By", "Date Submitted"];
      const rows: (string | number)[][] = [
        [`PP4 Manual Slitter — Stock History Report`],
        [`Sheet: ${sheetLabel}`],
        [`Generated: ${dateStr} ${timeStr}`],
        [`Total Records: ${subset.length}`],
        [],
        HEADERS,
        ...subset.map((o, i) => [
          i + 1,
          o.orderID,
          o.fluteType,
          o.sizeW,
          o.sizeL,
          `${o.sizeW}×${o.sizeL}`,
          o.qty,
          o.bqComment,
          o.submittedBy ?? "-",
          new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        ]),
        [],
        ["", "", "", "", "", "TOTAL QTY", subset.reduce((s, o) => s + o.qty, 0), "", "", ""],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [
        { wch: 5 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 13 },
        { wch: 13 }, { wch: 10 }, { wch: 24 }, { wch: 16 }, { wch: 16 },
      ];
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } },
      ];
      return ws;
    }

    const current = orders.filter(o => o.status === "current");
    const outOfStock = orders.filter(o => o.status === "out_of_stock");
    XLSX.utils.book_append_sheet(wb, buildSheet(current, "Current Stock"), "Current Stock");
    XLSX.utils.book_append_sheet(wb, buildSheet(outOfStock, "Out of Stock"), "Out of Stock");
    XLSX.writeFile(wb, `PP4_StockHistory_${now.toISOString().slice(0, 10)}.xlsx`);
  });
}
// ─── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab() {
  const utils = trpc.useUtils();
  const ordersQuery = trpc.orders.list.useQuery({});
  const orders = (ordersQuery.data ?? []) as Order[];

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [confirmWorkerID, setConfirmWorkerID] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [usedUpdateTarget, setUsedUpdateTarget] = useState<Order | null>(null);
  const [usedQty, setUsedQty] = useState("");
  const [jobNo, setJobNo] = useState("");
  const [masterCard, setMasterCard] = useState("");
  const [boardSizeW, setBoardSizeW] = useState("");
  const [boardSizeL, setBoardSizeL] = useState("");
  const [scores, setScores] = useState("");
  const [usedUpdateError, setUsedUpdateError] = useState("");
  const [usedUpdateStep, setUsedUpdateStep] = useState<"type" | "confirm">("type");
  const [usedUpdateType, setUsedUpdateType] = useState<"old_stock" | "job_no">("job_no");

  const deleteOrder = trpc.orders.delete.useMutation();
  const updateStatus = trpc.orders.updateStatus.useMutation();
  const logUsage = trpc.orders.logUsage.useMutation();

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    if (!confirmWorkerID.trim()) { setDeleteError("Employee ID required."); return; }
    try {
      await deleteOrder.mutateAsync({ id: deleteTarget.id, orderID: deleteTarget.orderID, fluteType: deleteTarget.fluteType, sizeW: deleteTarget.sizeW, sizeL: deleteTarget.sizeL, qty: deleteTarget.qty, bqComment: deleteTarget.bqComment, workerID: confirmWorkerID.trim(), adminPassword: ADMIN_PASSWORD });
      toast.success("Order deleted.");
      utils.orders.list.invalidate();
      setDeleteTarget(null);
      setConfirmWorkerID("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDeleteError(e?.message ?? "Failed to delete order.");
    }
  };

  const handleStatusChange = async (order: Order, newStatus: "current" | "out_of_stock") => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status: newStatus, adminPassword: ADMIN_PASSWORD });
      toast.success("Status updated.");
      utils.orders.list.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to update status.");
    }
  };

  const handleUsedUpdate = async () => {
    if (!usedUpdateTarget) return;
    setUsedUpdateError("");
    if (usedUpdateStep === "type") {
      if (usedUpdateType === "job_no") {
        if (!jobNo.trim()) { setUsedUpdateError("Job No is required."); return; }
        if (!masterCard.trim()) { setUsedUpdateError("Master Card is required."); return; }
        if (!boardSizeW.trim() || !boardSizeL.trim()) { setUsedUpdateError("Board Size is required."); return; }
      } else {
        if (!usedQty.trim() || isNaN(Number(usedQty))) { setUsedUpdateError("Valid Used Qty is required."); return; }
      }
      setUsedUpdateStep("confirm");
      return;
    }
    try {
      if (usedUpdateType === "job_no") {
        await logUsage.mutateAsync({
          jobNo: jobNo.trim(),
          usedQty: 0,
          orderID: usedUpdateTarget.orderID,
          fluteType: usedUpdateTarget.fluteType,
          bqComment: usedUpdateTarget.bqComment,
          purpose: "job",
          orderId: usedUpdateTarget.id,
          newQty: usedUpdateTarget.qty,
          performedBy: "ADMIN",
          masterCard: masterCard.trim(),
          boardSizeW: Number(boardSizeW),
          boardSizeL: Number(boardSizeL),
          scores: scores.trim() || null,
        });
      } else {
        await logUsage.mutateAsync({
          jobNo: null,
          usedQty: Number(usedQty),
          orderID: usedUpdateTarget.orderID,
          fluteType: usedUpdateTarget.fluteType,
          bqComment: usedUpdateTarget.bqComment,
          purpose: "old_stock",
          orderId: usedUpdateTarget.id,
          newQty: 0,
          performedBy: "ADMIN",
        });
      }
      toast.success(usedUpdateType === "job_no" ? "Job No usage logged." : "Old Stock cleared.");
      utils.orders.list.invalidate();
      setUsedUpdateTarget(null);
      setUsedUpdateStep("type");
      setJobNo("");
      setUsedQty("");
      setMasterCard("");
      setBoardSizeW("");
      setBoardSizeL("");
      setScores("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setUsedUpdateError(e?.message ?? "Failed to update usage.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{orders.length} total order{orders.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(orders)}
            disabled={orders.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-40"
            title="Download Excel (Current Stock + Out of Stock sheets)"
          >
            <FileSpreadsheet size={13} /> Download Excel
          </button>
          <RefreshButton onRefresh={() => utils.orders.list.invalidate()} />
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Tracking ID","Production Order","Flute","Size","Qty","BQ","Submitted By","Date","Status",""].map(h => (
                    <th key={h} className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-3">
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded font-mono font-bold">{order.trackingId || "—"}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm font-semibold text-primary">{order.orderID}</td>
                    <td className="py-3 pr-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Flute : {order.fluteType}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm text-foreground font-mono">{order.sizeW}×{order.sizeL}</td>
                    <td className="py-3 pr-3 text-sm text-foreground">{order.qty}</td>
                    <td className="py-3 pr-3 max-w-[160px]">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono truncate block">{order.bqComment}</span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">{order.submittedBy ?? "-"}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="py-3 pr-3">
                      <button
                        onClick={() => handleStatusChange(order, order.status === "current" ? "out_of_stock" : "current")}
                        disabled={updateStatus.isPending}
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-opacity hover:opacity-70 ${order.status === "current" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {order.status === "current" ? "Current" : "Out"}
                      </button>
                    </td>
                    <td className="py-3 flex gap-1">
                      <button onClick={() => { setUsedUpdateTarget(order); setUsedUpdateStep("type"); setUsedUpdateType("job_no"); setJobNo(""); setUsedQty(""); setMasterCard(""); setBoardSizeW(""); setBoardSizeL(""); setScores(""); setUsedUpdateError(""); }} className="text-muted-foreground hover:text-blue-600 transition-colors" title="Used Update">
                        <Zap size={14} />
                      </button>
                      <button onClick={() => { setDeleteTarget(order); setConfirmWorkerID(""); setDeleteError(""); }} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {orders.map(order => (
              <div key={order.id} className="p-4 bg-white border border-border rounded-xl shadow-sm space-y-2">
                {order.trackingId && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded font-mono font-bold inline-block">Ref: {order.trackingId}</span>}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Production Order</p>
                    <p className="text-sm font-bold text-primary">{order.orderID}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Flute</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Flute : {order.fluteType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Size</span>
                  <span className="text-sm font-mono text-foreground">{order.sizeW}×{order.sizeL}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Qty</span>
                  <span className="text-sm text-foreground">{order.qty}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">BQ</p>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono break-all">{order.bqComment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Submitted By</span>
                  <span className="text-xs text-foreground">{order.submittedBy ?? "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <button
                    onClick={() => handleStatusChange(order, order.status === "current" ? "out_of_stock" : "current")}
                    disabled={updateStatus.isPending}
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-opacity hover:opacity-70 ${order.status === "current" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {order.status === "current" ? "Current" : "Out"}
                  </button>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setUsedUpdateTarget(order); setUsedUpdateStep("type"); setUsedUpdateType("job_no"); setJobNo(""); setUsedQty(""); setMasterCard(""); setBoardSizeW(""); setBoardSizeL(""); setScores(""); setUsedUpdateError(""); }} className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <Zap size={13} /> Used Update
                  </button>
                  <button onClick={() => { setDeleteTarget(order); setConfirmWorkerID(""); setDeleteError(""); }} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Order Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-foreground mb-2">Delete Order</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter an Employee ID to confirm deletion of order <strong className="text-foreground">{deleteTarget.orderID}</strong>.
            </p>
            <input
              type="text"
              value={confirmWorkerID}
              onChange={e => { setConfirmWorkerID(e.target.value); setDeleteError(""); }}
              onKeyDown={e => e.key === "Enter" && handleDeleteOrder()}
              placeholder="Employee ID"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive mb-1"
              autoFocus
            />
            {deleteError && <p className="text-xs text-destructive mb-2">{deleteError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setDeleteTarget(null); setConfirmWorkerID(""); setDeleteError(""); }} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteOrder} disabled={deleteOrder.isPending} className="flex-1 bg-destructive text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Used Update Dialog */}
      {usedUpdateTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-foreground mb-4">Used Update - {usedUpdateTarget.orderID}</h3>

            {usedUpdateStep === "type" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Update Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUsedUpdateType("job_no")}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${
                        usedUpdateType === "job_no"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-foreground hover:bg-gray-200"
                      }`}
                    >
                      Job No
                    </button>
                    <button
                      onClick={() => setUsedUpdateType("old_stock")}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${
                        usedUpdateType === "old_stock"
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-foreground hover:bg-gray-200"
                      }`}
                    >
                      Old Stock
                    </button>
                  </div>
                </div>

                {usedUpdateType === "job_no" ? (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1 block">Job No <span className="text-red-600">*</span></label>
                      <input
                        type="text"
                        value={jobNo}
                        onChange={e => { setJobNo(e.target.value.toUpperCase()); setUsedUpdateError(""); }}
                        placeholder="Enter Job No"
                        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1 block">Master Card <span className="text-red-600">*</span></label>
                      <input
                        type="text"
                        value={masterCard}
                        onChange={e => { setMasterCard(e.target.value.toUpperCase()); setUsedUpdateError(""); }}
                        placeholder="Enter Master Card"
                        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1 block">Width <span className="text-red-600">*</span></label>
                        <input
                          type="number"
                          value={boardSizeW}
                          onChange={e => { setBoardSizeW(e.target.value); setUsedUpdateError(""); }}
                          placeholder="W"
                          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1 block">Length <span className="text-red-600">*</span></label>
                        <input
                          type="number"
                          value={boardSizeL}
                          onChange={e => { setBoardSizeL(e.target.value); setUsedUpdateError(""); }}
                          placeholder="L"
                          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1 block">Scores (optional)</label>
                      <input
                        type="text"
                        value={scores}
                        onChange={e => { setScores(e.target.value); setUsedUpdateError(""); }}
                        placeholder="Enter Scores"
                        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Used Qty <span className="text-red-600">*</span></label>
                    <input
                      type="number"
                      value={usedQty}
                      onChange={e => { setUsedQty(e.target.value); setUsedUpdateError(""); }}
                      placeholder="Enter quantity used"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}

                {usedUpdateError && <p className="text-xs text-destructive">{usedUpdateError}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setUsedUpdateTarget(null);
                      setUsedUpdateStep("type");
                      setJobNo("");
                      setUsedQty("");
                      setMasterCard("");
                      setBoardSizeW("");
                      setBoardSizeL("");
                      setScores("");
                      setUsedUpdateError("");
                    }}
                    className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUsedUpdate}
                    disabled={logUsage.isPending}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {logUsage.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900 font-semibold mb-2">Confirm {usedUpdateType === "job_no" ? "Job No" : "Old Stock"} Update</p>
                  {usedUpdateType === "job_no" ? (
                    <div className="space-y-1 text-xs text-blue-800">
                      <p><strong>Job No:</strong> {jobNo}</p>
                      <p><strong>Master Card:</strong> {masterCard}</p>
                      <p><strong>Board Size:</strong> {boardSizeW}×{boardSizeL} mm</p>
                      {scores && <p><strong>Scores:</strong> {scores}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-blue-800"><strong>Used Qty:</strong> {usedQty} pcs</p>
                  )}
                </div>

                {usedUpdateError && <p className="text-xs text-destructive">{usedUpdateError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={() => setUsedUpdateStep("type")}
                    className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUsedUpdate}
                    disabled={logUsage.isPending}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {logUsage.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Deleted Logs Tab ─────────────────────────────────────────────────────────
type DeletedLog = {
  id: number; orderID: string; fluteType: string; sizeW: number; sizeL: number;
  qty: number; bqComment: string; deletedBy: string; deletedAt: Date;
};

function DeletedLogsTab() {
  const utils = trpc.useUtils();
  const logsQuery = trpc.orders.getDeletedLogs.useQuery();
  const logs = (logsQuery.data ?? []) as DeletedLog[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{logs.length} deleted record{logs.length !== 1 ? "s" : ""}</p>
        <RefreshButton onRefresh={() => utils.orders.getDeletedLogs.invalidate()} />
      </div>

      {logsQuery.isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No deleted records yet</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Production Order","Flute","Size","Qty","BQ","Deleted By","Deleted At"].map(h => (
                    <th key={h} className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-3 text-sm font-semibold text-red-600">{log.orderID}</td>
                    <td className="py-3 pr-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Flute : {log.fluteType}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm font-mono">{log.sizeW}×{log.sizeL}</td>
                    <td className="py-3 pr-3 text-sm">{log.qty} pcs</td>
                    <td className="py-3 pr-3 max-w-[160px]">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono truncate block">{log.bqComment}</span>
                    </td>
                    <td className="py-3 pr-3 text-xs font-semibold text-foreground">{log.deletedBy}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(log.deletedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {logs.map(log => (
              <div key={log.id} className="p-4 bg-red-50 border border-red-100 rounded-xl shadow-sm space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Production Order</p>
                    <p className="text-sm font-bold text-red-600">{log.orderID}</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Deleted</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Flute : {log.fluteType}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{log.sizeW}×{log.sizeL} mm</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{log.qty} pcs</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">BQ</p>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono break-all">{log.bqComment}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-100">
                  <div>
                    <p className="text-xs text-muted-foreground">Deleted By</p>
                    <p className="text-xs font-semibold text-foreground">{log.deletedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Deleted At</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.deletedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Pending Requests Tab ─────────────────────────────────────────────────────
type PendingReq = {
  id: number; type: "delete" | "used_update"; orderId: number; orderSnapshot: string;
  requestedBy: string; workerName: string; actionData: string | null;
  status: "pending" | "approved" | "cancelled"; reviewedBy: string | null;
  reviewedAt: Date | null; createdAt: Date;
};
function PendingRequestsTab() {
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "cancelled">("pending");
  const [processingId, setProcessingId] = useState<number | null>(null);
  // Cancel reason dialog
  const [cancelDialog, setCancelDialog] = useState<{ id: number } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  // Approve with qty dialog
  const [approveDialog, setApproveDialog] = useState<{ id: number; requestedQty: number | null; isDelete: boolean } | null>(null);
  const [approvedQtyInput, setApprovedQtyInput] = useState("");

  // Process Approve dialog
  const [processDialog, setProcessDialog] = useState<{ id: number; requestedQty: number | null } | null>(null);
  const [processQtyInput, setProcessQtyInput] = useState("");
  const listQuery = trpc.pendingRequests.list.useQuery({ status: statusFilter });
  const requests = (listQuery.data ?? []) as PendingReq[];
  const approveMut = trpc.pendingRequests.approve.useMutation({
    onSuccess: () => { utils.pendingRequests.list.invalidate(); toast.success("Request approved!"); },
    onError: (e) => toast.error(e.message),
  });
  const cancelMut = trpc.pendingRequests.cancel.useMutation({
    onSuccess: () => { utils.pendingRequests.list.invalidate(); toast.success("Request cancelled."); },
    onError: (e) => toast.error(e.message),
  });
  const processApproveMut = trpc.pendingRequests.processApprove.useMutation({
    onSuccess: () => { utils.pendingRequests.list.invalidate(); toast.success("Request marked as In Process!"); },
    onError: (e) => toast.error(e.message),
  });
  const handleApprove = async (id: number, approvedQty?: number) => {
    setProcessingId(id);
    try { await approveMut.mutateAsync({ id, reviewerWorkerID: "ADMIN", approvedQty }); } finally { setProcessingId(null); }
  };
  const handleCancel = async (id: number, reason: string) => {
    setProcessingId(id);
    try { await cancelMut.mutateAsync({ id, reviewerWorkerID: "ADMIN", cancelReason: reason }); } finally { setProcessingId(null); }
  };
  const handleProcessApprove = async (id: number, processedQty?: number) => {
    setProcessingId(id);
    try { await processApproveMut.mutateAsync({ id, reviewerWorkerID: "ADMIN", processApprovedQty: processedQty }); } finally { setProcessingId(null); }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Pending Requests</h2>
        <RefreshButton onRefresh={() => utils.pendingRequests.list.invalidate()} />
      </div>
      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {(["pending", "approved", "cancelled"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${statusFilter === s ? (s === "pending" ? "bg-orange-500 text-white" : s === "approved" ? "bg-green-600 text-white" : "bg-gray-500 text-white") : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}
          >{s}</button>
        ))}
      </div>
      {listQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">No {statusFilter} requests</div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const snapshot = (() => { try { return JSON.parse(req.orderSnapshot); } catch { return {}; } })();
            const action = (() => { try { return req.actionData ? JSON.parse(req.actionData) : {}; } catch { return {}; } })();
            const isPending = req.status === "pending";
            return (
              <div key={req.id} className="border border-border rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${req.type === "delete" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                      {req.type === "delete" ? <Trash2 size={10} /> : <RefreshCw size={10} />}
                      {req.type === "delete" ? "Delete" : "Used Update"}
                    </span>
                    <span className={`ml-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${req.status === "pending" ? "bg-orange-100 text-orange-700" : req.status === "approved" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {req.status === "pending" ? <Clock size={10} /> : req.status === "approved" ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {req.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                  <div><span className="text-muted-foreground">Production Order: </span><span className="font-semibold">{snapshot.orderID ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">Requested by: </span><span className="font-semibold">{req.workerName} ({req.requestedBy})</span></div>
                  {req.type === "used_update" && action.usedQty && (
                    <div><span className="text-muted-foreground">Use Qty: </span><span className="font-semibold text-blue-700">{action.usedQty} pcs</span></div>
                  )}
                  {req.type === "used_update" && action.jobNo && (
                    <div><span className="text-muted-foreground">Job No: </span><span className="font-semibold font-mono">{action.jobNo}</span></div>
                  )}
                  {req.type === "used_update" && action.masterCard && (
                    <div><span className="text-muted-foreground">Master Card: </span><span className="font-semibold font-mono">{action.masterCard}</span></div>
                  )}
                  {req.type === "used_update" && (action.boardSizeW || action.boardSizeL) && (
                    <div><span className="text-muted-foreground">Board Size: </span><span className="font-semibold">{action.boardSizeW ?? "—"}×{action.boardSizeL ?? "—"} mm</span></div>
                  )}
                  {req.type === "used_update" && action.scores && (
                    <div className="col-span-2"><span className="text-muted-foreground">Scores: </span><span className="font-semibold font-mono">{action.scores}</span></div>
                  )}
                  {(req as any).processApprovedBy && (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">⚙ In Process</span>
                      <span className="text-xs text-muted-foreground">by {(req as any).processApprovedBy}</span>
                    </div>
                  )}
                  {req.reviewedBy && (
                    <div className="col-span-2"><span className="text-muted-foreground">Reviewed by: </span><span className="font-semibold">{req.reviewedBy}</span></div>
                  )}
                </div>
                {isPending && (
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <button onClick={() => { setCancelDialog({ id: req.id }); setCancelReason(""); }} disabled={processingId === req.id}
                      className="flex-1 min-w-[80px] border border-border rounded-lg py-2 text-xs font-semibold text-muted-foreground hover:bg-gray-50 hover:text-destructive transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <XCircle size={12} /> Cancel
                    </button>
                    {req.type === "used_update" && !(req as any).processApprovedBy && (
                      <button onClick={() => { const aq = action.usedQty ?? null; setProcessDialog({ id: req.id, requestedQty: aq }); setProcessQtyInput(aq ? String(aq) : ""); }} disabled={processingId === req.id}
                        className="flex-1 min-w-[80px] bg-purple-600 text-white rounded-lg py-2 text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                        {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <span>⚙</span>}
                        Process
                      </button>
                    )}
                    <button onClick={() => { const aq = req.type === "used_update" ? (action.usedQty ?? null) : null; setApproveDialog({ id: req.id, requestedQty: aq, isDelete: req.type === "delete" }); setApprovedQtyInput(aq ? String(aq) : ""); }} disabled={processingId === req.id}
                      className="flex-1 min-w-[80px] bg-green-600 text-white rounded-lg py-2 text-xs font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                      {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Reason Dialog */}
      {cancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Cancel Request</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">Please provide a reason for cancelling this request.</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Enter cancel reason..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setCancelDialog(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button
                  onClick={async () => { if (!cancelReason.trim()) { toast.error("Cancel reason is required."); return; } const id = cancelDialog.id; setCancelDialog(null); await handleCancel(id, cancelReason.trim()); }}
                  disabled={!cancelReason.trim()}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >Confirm Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve with Qty Dialog */}
      {approveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Approve Request</h3>
              </div>
              {!approveDialog.isDelete && approveDialog.requestedQty !== null && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Requested Qty: <strong>{approveDialog.requestedQty} pcs</strong></p>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Approved Qty (optional — leave blank to use requested)</label>
                  <input
                    type="number"
                    min={1}
                    value={approvedQtyInput}
                    onChange={e => setApprovedQtyInput(e.target.value)}
                    placeholder={String(approveDialog.requestedQty)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
              )}
              {approveDialog.isDelete && <p className="text-sm text-gray-600 mb-4">Are you sure you want to approve this delete request? This action cannot be undone.</p>}
              <div className="flex gap-3">
                <button onClick={() => setApproveDialog(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button
                  onClick={async () => { const id = approveDialog.id; const aq = approvedQtyInput ? parseInt(approvedQtyInput) : undefined; setApproveDialog(null); await handleApprove(id, aq); }}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700"
                >Confirm Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Process Approve Dialog */}
      {processDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 text-lg">⚙</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base">Approve Request (process approved request)</h3>
              </div>
              {processDialog.requestedQty !== null && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Requested Qty: <strong>{processDialog.requestedQty} pcs</strong></p>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Approved Qty (optional — leave blank to use requested)</label>
                  <input
                    type="number"
                    min={1}
                    value={processQtyInput}
                    onChange={e => setProcessQtyInput(e.target.value)}
                    placeholder={String(processDialog.requestedQty)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mb-4">This marks the request as "In Process". Level 2 final approval is still required.</p>
              <div className="flex gap-3">
                <button onClick={() => setProcessDialog(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button
                  onClick={async () => { const id = processDialog.id; const pq = processQtyInput ? parseInt(processQtyInput) : undefined; setProcessDialog(null); await handleProcessApprove(id, pq); }}
                  className="flex-1 bg-purple-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-purple-700"
                >Confirm Process</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { logoutAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"workers" | "orders" | "deleted_logs" | "pending_requests" | "contact_messages" | "announcements" | "maintenance">("workers");
  const maintenanceQuery = trpc.system.getMaintenanceStatus.useQuery(undefined, { refetchInterval: 10000 });
  const setMaintenanceMutation = trpc.system.setMaintenanceMode.useMutation({
    onSuccess: (data) => {
      maintenanceQuery.refetch();
      toast.success(data.maintenanceMode ? "Maintenance Mode ON — Users will see maintenance page" : "Maintenance Mode OFF — App is live");
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [, navigate] = useLocation();

  const statsQuery = trpc.orders.adminStats.useQuery(undefined, { refetchInterval: 30000 });
  const stats = statsQuery.data;

  const tabs = [
    { id: "workers" as const, label: "Workers", icon: <Users size={16} />, color: "blue" },
    { id: "orders" as const, label: "Orders", icon: <Package size={16} />, color: "green" },
    { id: "deleted_logs" as const, label: "Deleted Logs", icon: <History size={16} />, color: "red" },
    { id: "pending_requests" as const, label: "Requests", icon: <ClipboardList size={16} />, color: "orange" },
    { id: "contact_messages" as const, label: "Messages", icon: <Inbox size={16} />, color: "purple" },
    { id: "announcements" as const, label: "Announcements", icon: <Megaphone size={16} />, color: "indigo" },
    { id: "maintenance" as const, label: "Maintenance", icon: <Wrench size={16} />, color: "red" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Premium Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-all flex-shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <img src={LOGO_URL} alt="GSPP" className="h-7 w-7 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-gray-900">Admin Panel</h1>
            <p className="text-[10px] lg:text-xs text-gray-500 font-medium">System Management & Configuration</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-green-50 border border-green-200/50 rounded-xl px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-green-700">Admin Active</span>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 text-xs lg:text-sm border border-red-200 px-3 py-2 rounded-xl font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all shadow-sm"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Maintenance Mode Warning Banner */}
      {maintenanceQuery.data?.maintenanceMode && (
        <div className="bg-red-600 text-white">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldAlert size={14} className="text-white" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">MAINTENANCE ON</span>
                <span className="text-xs font-medium text-red-100">All workers are currently seeing the maintenance page. Turn OFF when done.</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("maintenance")}
              className="flex-shrink-0 text-xs font-bold bg-white text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Manage
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Package size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase tracking-wide">Current</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 leading-none mt-0.5">
                  {statsQuery.isLoading ? "..." : (stats?.totalCurrent ?? 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-md shadow-gray-500/20 group-hover:scale-105 transition-transform">
                <Inbox size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase tracking-wide">Out of Stock</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 leading-none mt-0.5">
                  {statsQuery.isLoading ? "..." : (stats?.totalOutOfStock ?? 0)}
                </p>
              </div>
            </div>
          </div>
          <div onClick={() => setActiveTab("pending_requests")} className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-orange-200">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ${(stats?.pendingRequests ?? 0) > 0 ? "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20" : "bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-500/10"}`}>
                <ClipboardList size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase tracking-wide">Pending</p>
                <p className={`text-xl lg:text-2xl font-bold leading-none mt-0.5 ${(stats?.pendingRequests ?? 0) > 0 ? "text-orange-600" : "text-gray-900"}`}>
                  {statsQuery.isLoading ? "..." : (stats?.pendingRequests ?? 0)}
                </p>
              </div>
            </div>
          </div>
          <div onClick={() => setActiveTab("orders")} className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-amber-200">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ${(stats?.lowStockCount ?? 0) > 0 ? "bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/20" : "bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-500/10"}`}>
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase tracking-wide">Low Stock</p>
                <p className={`text-xl lg:text-2xl font-bold leading-none mt-0.5 ${(stats?.lowStockCount ?? 0) > 0 ? "text-amber-600" : "text-gray-900"}`}>
                  {statsQuery.isLoading ? "..." : (stats?.lowStockCount ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        <div className="flex gap-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-1.5 overflow-x-auto shadow-sm">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            const colorMap: Record<string, string> = {
              blue: isActive ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              green: isActive ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              red: isActive ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              orange: isActive ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              purple: isActive ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
            };
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 lg:px-4 py-2.5 text-xs lg:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${colorMap[t.color]}`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-6">
          {activeTab === "workers" && <WorkersTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "deleted_logs" && <DeletedLogsTab />}
          {activeTab === "pending_requests" && <PendingRequestsTab />}
          {activeTab === "contact_messages" && <ContactMessagesTab />}
          {activeTab === "announcements" && <AnnouncementsTab />}
          {activeTab === "maintenance" && (
            <div className="max-w-xl mx-auto py-8 space-y-6">
              {/* Status card */}
              <div className={`rounded-2xl border-2 p-6 shadow-sm transition-all ${
                maintenanceQuery.data?.maintenanceMode
                  ? "border-red-300 bg-red-50"
                  : "border-green-300 bg-green-50"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-md ${
                    maintenanceQuery.data?.maintenanceMode
                      ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20"
                      : "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20"
                  }`}>
                    {maintenanceQuery.data?.maintenanceMode
                      ? <ShieldAlert size={26} className="text-white" />
                      : <Power size={26} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">Maintenance Mode</h2>
                    <p className={`text-sm font-semibold mt-0.5 ${
                      maintenanceQuery.data?.maintenanceMode ? "text-red-600" : "text-green-600"
                    }`}>
                      {maintenanceQuery.data?.maintenanceMode ? "🔴 Currently ON — App is under maintenance" : "🟢 Currently OFF — App is live"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom message */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                <label className="text-sm font-semibold text-gray-700 block">Custom Maintenance Message (optional)</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  rows={3}
                  placeholder="e.g. Estimated downtime: 15 minutes. Thank you for your patience."
                  value={maintenanceMsg}
                  onChange={e => setMaintenanceMsg(e.target.value)}
                />
                <p className="text-xs text-gray-400">Leave empty to show the default English message.</p>
              </div>

              {/* Toggle buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setMaintenanceMutation.mutate({ enabled: true, message: maintenanceMsg, adminPassword: ADMIN_PASSWORD })}
                  disabled={setMaintenanceMutation.isPending || maintenanceQuery.data?.maintenanceMode === true}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {setMaintenanceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                  Turn ON Maintenance
                </button>
                <button
                  onClick={() => setMaintenanceMutation.mutate({ enabled: false, message: "", adminPassword: ADMIN_PASSWORD })}
                  disabled={setMaintenanceMutation.isPending || maintenanceQuery.data?.maintenanceMode === false}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {setMaintenanceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                  Turn OFF Maintenance
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Admin users can still access the app while maintenance mode is ON.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <LogOut size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Confirm Logout</h3>
                <p className="text-xs text-gray-500">Admin Session</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Are you sure you want to logout from the Admin Panel? Your admin session will be terminated.</p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logoutAdmin();
                  navigate("/login?tab=admin");
                  setShowLogoutConfirm(false);
                  toast.success("Logged out successfully");
                }}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl py-2.5 text-sm font-bold hover:from-red-600 hover:to-rose-700 transition-all shadow-md shadow-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
