import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Lock, Plus, Trash2, RefreshCw, Loader2, Users, Package, History, ClipboardList, CheckCircle2, XCircle, Clock, FileDown, FileSpreadsheet, TrendingUp, AlertTriangle, Inbox, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LOGO_URL = "/manus-storage/gspp-logo_988a5ce5.png";
const ADMIN_PASSWORD = "Qwer@7090heinann";

type Worker = { id: number; workerID: string; name: string; department: string; userLevel: "1" | "2"; createdAt: Date };
type Order = {
  id: number; orderID: string; fluteType: string; sizeW: number; sizeL: number;
  qty: number; bqComment: string; status: "current" | "out_of_stock"; submittedBy: string | null; createdAt: Date;
};

// ─── Workers Tab ───────────────────────────────────────────────────────────────
function WorkersTab() {
  const utils = trpc.useUtils();
  const workersQuery = trpc.workers.list.useQuery();
  const workers = (workersQuery.data ?? []) as Worker[];

  const [showAdd, setShowAdd] = useState(false);
  const [newWorkerID, setNewWorkerID] = useState("");
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newUserLevel, setNewUserLevel] = useState<"1" | "2">("2");
  const [addError, setAddError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);

  // Edit state
  const [editTarget, setEditTarget] = useState<Worker | null>(null);
  const [editWorkerID, setEditWorkerID] = useState("");
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editUserLevel, setEditUserLevel] = useState<"1" | "2">("2");
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
    try {
      await deleteWorker.mutateAsync({ id: deleteTarget.id, adminPassword: ADMIN_PASSWORD });
      toast.success("Worker deleted.");
      utils.workers.list.invalidate();
      setDeleteTarget(null);
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${w.userLevel === "1" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>Lv.{w.userLevel}</span>
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
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${w.userLevel === "1" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>Level {w.userLevel}</span>
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
                    onClick={() => setNewUserLevel("2")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${newUserLevel === "2" ? "bg-green-100 border-green-400 text-green-700" : "border-border text-muted-foreground hover:bg-gray-50"}`}
                  >
                    Level 2
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{newUserLevel === "1" ? "Level 1: Actions require Level 2 approval" : "Level 2: Can approve/cancel Level 1 requests"}</p>
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
                      <button type="button" onClick={() => setEditUserLevel("2")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${editUserLevel === "2" ? "bg-green-100 border-green-400 text-green-700" : "border-border text-muted-foreground hover:bg-gray-50"}`}>Level 2</button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{editUserLevel === "1" ? "Level 1: Actions require Level 2 approval" : "Level 2: Can approve/cancel Level 1 requests"}</p>
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
            <h3 className="font-bold text-foreground mb-2">Delete Worker</h3>
            <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.workerID})?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleteWorker.isPending} className="flex-1 bg-destructive text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteWorker.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
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
    const data = orders.map(o => ({
      "Order ID": o.orderID,
      "Flute Type": o.fluteType,
      "Width (mm)": o.sizeW,
      "Length (mm)": o.sizeL,
      "Qty (pcs)": o.qty,
      "BQ Comment": o.bqComment,
      "Status": o.status === "current" ? "Current Stock" : "Out of Stock",
      "Submitted By": o.submittedBy ?? "-",
      "Date": new Date(o.createdAt).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `PP4_Orders_${new Date().toISOString().slice(0,10)}.xlsx`);
  });
}

function exportToPDF(orders: Order[]) {
  import("jspdf").then(({ jsPDF }) => {
    import("jspdf-autotable").then(() => {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("PP4 Manual Slitter — Orders Report", 14, 15);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
        startY: 27,
        head: [["Order ID", "Flute", "W×L (mm)", "Qty", "BQ Comment", "Status", "Submitted By", "Date"]],
        body: orders.map(o => [
          o.orderID,
          o.fluteType,
          `${o.sizeW}×${o.sizeL}`,
          o.qty,
          o.bqComment,
          o.status === "current" ? "Current" : "Out of Stock",
          o.submittedBy ?? "-",
          new Date(o.createdAt).toLocaleDateString(),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });
      doc.save(`PP4_Orders_${new Date().toISOString().slice(0,10)}.pdf`);
    });
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

  const deleteOrder = trpc.orders.delete.useMutation();
  const updateStatus = trpc.orders.updateStatus.useMutation();

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{orders.length} total order{orders.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(orders)}
            disabled={orders.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-40"
            title="Export to Excel"
          >
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button
            onClick={() => exportToPDF(orders)}
            disabled={orders.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
            title="Export to PDF"
          >
            <FileDown size={13} /> PDF
          </button>
          <button onClick={() => utils.orders.list.invalidate()} className="text-muted-foreground hover:text-foreground p-1 transition-colors" title="Refresh">
            <RefreshCw size={15} />
          </button>
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
                  {["Order ID","Flute","Size","Qty","BQ","Submitted By","Date","Status",""].map(h => (
                    <th key={h} className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-border hover:bg-gray-50 transition-colors">
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
                    <td className="py-3">
                      <button onClick={() => { setDeleteTarget(order); setConfirmWorkerID(""); setDeleteError(""); }} className="text-muted-foreground hover:text-destructive transition-colors">
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
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="text-sm font-bold text-primary">{order.orderID}</p>
                  </div>
                  <button onClick={() => { setDeleteTarget(order); setConfirmWorkerID(""); setDeleteError(""); }} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 size={15} />
                  </button>
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
        <button onClick={() => utils.orders.getDeletedLogs.invalidate()} className="text-muted-foreground hover:text-foreground p-1 transition-colors" title="Refresh">
          <RefreshCw size={15} />
        </button>
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
                  {["Order ID","Flute","Size","Qty","BQ","Deleted By","Deleted At"].map(h => (
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
                    <p className="text-xs text-muted-foreground">Order ID</p>
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
  const handleApprove = async (id: number, approvedQty?: number) => {
    setProcessingId(id);
    try { await approveMut.mutateAsync({ id, reviewerWorkerID: "ADMIN", approvedQty }); } finally { setProcessingId(null); }
  };
  const handleCancel = async (id: number, reason: string) => {
    setProcessingId(id);
    try { await cancelMut.mutateAsync({ id, reviewerWorkerID: "ADMIN", cancelReason: reason }); } finally { setProcessingId(null); }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Pending Requests</h2>
        <button onClick={() => utils.pendingRequests.list.invalidate()} className="text-muted-foreground hover:text-foreground p-1"><RefreshCw size={15} /></button>
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
                  <div><span className="text-muted-foreground">Order ID: </span><span className="font-semibold">{snapshot.orderID ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">Requested by: </span><span className="font-semibold">{req.workerName} ({req.requestedBy})</span></div>
                  {req.type === "used_update" && action.usedQty && (
                    <div><span className="text-muted-foreground">Use Qty: </span><span className="font-semibold text-blue-700">{action.usedQty} pcs</span></div>
                  )}
                  {req.type === "used_update" && action.jobNo && (
                    <div><span className="text-muted-foreground">Job No: </span><span className="font-semibold font-mono">{action.jobNo}</span></div>
                  )}
                  {req.reviewedBy && (
                    <div className="col-span-2"><span className="text-muted-foreground">Reviewed by: </span><span className="font-semibold">{req.reviewedBy}</span></div>
                  )}
                </div>
                {isPending && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setCancelDialog({ id: req.id }); setCancelReason(""); }} disabled={processingId === req.id}
                      className="flex-1 border border-border rounded-lg py-2 text-xs font-semibold text-muted-foreground hover:bg-gray-50 hover:text-destructive transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <XCircle size={12} /> Cancel
                    </button>
                    <button onClick={() => { const aq = req.type === "used_update" ? (action.usedQty ?? null) : null; setApproveDialog({ id: req.id, requestedQty: aq, isDelete: req.type === "delete" }); setApprovedQtyInput(aq ? String(aq) : ""); }} disabled={processingId === req.id}
                      className="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
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
    </div>
  );
}
// ─── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { logoutAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"workers" | "orders" | "deleted_logs" | "pending_requests">("workers");
  const [, navigate] = useLocation();

  const statsQuery = trpc.orders.adminStats.useQuery(undefined, { refetchInterval: 30000 });
  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10 shadow-sm">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground p-1">
            <ArrowLeft size={20} />
          </button>
          <img src={LOGO_URL} alt="GSPP" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">PP4 Manual Slitter</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-foreground">Administrator</div>
              <div className="text-xs text-muted-foreground">Admin Access</div>
            </div>
            <button
              onClick={() => { logoutAdmin(); navigate("/login?tab=admin"); }}
              className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors"
            >
              <Lock size={12} /> Lock
            </button>
          </div>
        </div>
      </header>

      {/* Admin Banner */}
      <div className="gspp-gradient text-white py-2 px-4 text-center text-xs">
        Logged in as <strong>Administrator</strong> — Admin Access
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 border-b border-border">
        <div className="container lg:max-w-none lg:px-8 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Current Orders */}
            <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Current Orders</p>
                <p className="text-2xl font-bold text-foreground leading-none mt-0.5">
                  {statsQuery.isLoading ? <span className="text-base text-muted-foreground">…</span> : (stats?.totalCurrent ?? 0)}
                </p>
              </div>
            </div>
            {/* Out of Stock */}
            <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Inbox size={18} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Out of Stock</p>
                <p className="text-2xl font-bold text-foreground leading-none mt-0.5">
                  {statsQuery.isLoading ? <span className="text-base text-muted-foreground">…</span> : (stats?.totalOutOfStock ?? 0)}
                </p>
              </div>
            </div>
            {/* Pending Requests */}
            <div
              className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:border-orange-300 transition-colors"
              onClick={() => setActiveTab("pending_requests")}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${(stats?.pendingRequests ?? 0) > 0 ? "bg-orange-100" : "bg-gray-100"}`}>
                <ClipboardList size={18} className={(stats?.pendingRequests ?? 0) > 0 ? "text-orange-600" : "text-gray-500"} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Requests</p>
                <p className={`text-2xl font-bold leading-none mt-0.5 ${(stats?.pendingRequests ?? 0) > 0 ? "text-orange-600" : "text-foreground"}`}>
                  {statsQuery.isLoading ? <span className="text-base text-muted-foreground">…</span> : (stats?.pendingRequests ?? 0)}
                </p>
              </div>
            </div>
            {/* Low Stock */}
            <div
              className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:border-amber-300 transition-colors"
              onClick={() => setActiveTab("orders")}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${(stats?.lowStockCount ?? 0) > 0 ? "bg-amber-100" : "bg-gray-100"}`}>
                <AlertTriangle size={18} className={(stats?.lowStockCount ?? 0) > 0 ? "text-amber-600" : "text-gray-500"} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Low Stock (≤{stats?.lowStockThreshold ?? 50})</p>
                <p className={`text-2xl font-bold leading-none mt-0.5 ${(stats?.lowStockCount ?? 0) > 0 ? "text-amber-600" : "text-foreground"}`}>
                  {statsQuery.isLoading ? <span className="text-base text-muted-foreground">…</span> : (stats?.lowStockCount ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container lg:max-w-none lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("workers")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "workers" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Users size={15} /> Workers
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Package size={15} /> Orders
          </button>
          <button
            onClick={() => setActiveTab("deleted_logs")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "deleted_logs" ? "border-red-500 text-red-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <History size={15} /> Deleted Logs
          </button>
          <button
            onClick={() => setActiveTab("pending_requests")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === "pending_requests" ? "border-orange-500 text-orange-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <ClipboardList size={15} /> Requests
          </button>
        </div>

        {activeTab === "workers" && <WorkersTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "deleted_logs" && <DeletedLogsTab />}
        {activeTab === "pending_requests" && <PendingRequestsTab />}
      </main>
    </div>
  );
}
