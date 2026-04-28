import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Lock, Plus, Trash2, RefreshCw, Loader2, ShieldCheck, Users, Package } from "lucide-react";

const LOGO_URL = "/manus-storage/gspp-logo_988a5ce5.png";
const ADMIN_PASSWORD = "Qwer@7090heinann";

type Worker = { id: number; workerID: string; name: string; department: string; createdAt: Date };
type Order = {
  id: number; orderID: string; fluteType: string; sizeW: number; sizeL: number;
  qty: number; bqComment: string; status: "current" | "out_of_stock"; submittedBy: string | null; createdAt: Date;
};

// ─── Admin Login Gate ──────────────────────────────────────────────────────────
function AdminLoginGate({ onLogin }: { onLogin: (user: { workerID: string; name: string }) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = trpc.admin.login.useMutation();
  const [, navigate] = useLocation();

  const handleLogin = async () => {
    setError("");
    try {
      await loginMutation.mutateAsync({ password });
      onLogin({ workerID: "admin", name: "Administrator" });
    } catch {
      setError("Incorrect password.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
        </div>
      </header>
      <main className="container py-10">
        <div className="max-w-sm mx-auto">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full gspp-gradient flex items-center justify-center mb-4">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Administrator Access</h2>
            <p className="text-sm text-muted-foreground mt-1 text-center">Enter the admin password to continue.</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Admin password"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              className="w-full gspp-gradient text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              Access Admin Panel
            </button>
          </div>
        </div>
      </main>
    </div>
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
  const [addError, setAddError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);

  const addWorker = trpc.workers.add.useMutation();
  const deleteWorker = trpc.workers.delete.useMutation();

  const handleAdd = async () => {
    setAddError("");
    if (!newWorkerID.trim() || !newName.trim() || !newDept.trim()) {
      setAddError("All fields are required.");
      return;
    }
    try {
      await addWorker.mutateAsync({ workerID: newWorkerID.trim(), name: newName.trim(), department: newDept.trim(), adminPassword: ADMIN_PASSWORD });
      toast.success("Worker added.");
      utils.workers.list.invalidate();
      setShowAdd(false);
      setNewWorkerID(""); setNewName(""); setNewDept("");
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
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Worker ID</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Name</th>
                  <th className="text-xs font-semibold text-muted-foreground text-left pb-3 pr-4">Department</th>
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
                    <td className="py-3">
                      <button onClick={() => setDeleteTarget(w)} className="text-muted-foreground hover:text-destructive transition-colors">
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
            {workers.map(w => (
              <div key={w.id} className="p-4 bg-white border border-border rounded-xl shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Worker ID</p>
                    <p className="text-sm font-bold text-primary">{w.workerID}</p>
                  </div>
                  <button onClick={() => setDeleteTarget(w)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground text-xs">Name</span>
                  <span className="text-foreground font-medium">{w.name}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted-foreground text-xs">Department</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{w.department}</span>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Worker ID</label>
                <input type="text" value={newWorkerID} onChange={e => { setNewWorkerID(e.target.value); setAddError(""); }} placeholder="e.g. DN156" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Name</label>
                <input type="text" value={newName} onChange={e => { setNewName(e.target.value); setAddError(""); }} placeholder="Full name" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Department</label>
                <input type="text" value={newDept} onChange={e => { setNewDept(e.target.value); setAddError(""); }} placeholder="Production" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
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
    if (!confirmWorkerID.trim()) { setDeleteError("Worker ID required."); return; }
    try {
      await deleteOrder.mutateAsync({ id: deleteTarget.id, workerID: confirmWorkerID.trim(), adminPassword: ADMIN_PASSWORD });
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
        <button onClick={() => utils.orders.list.invalidate()} className="text-muted-foreground hover:text-foreground p-1 transition-colors" title="Refresh">
          <RefreshCw size={15} />
        </button>
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
              Enter a Worker ID to confirm deletion of order <strong className="text-foreground">{deleteTarget.orderID}</strong>.
            </p>
            <input
              type="text"
              value={confirmWorkerID}
              onChange={e => { setConfirmWorkerID(e.target.value); setDeleteError(""); }}
              onKeyDown={e => e.key === "Enter" && handleDeleteOrder()}
              placeholder="Worker ID"
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

// ─── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ workerID: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"workers" | "orders">("workers");
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return <AdminLoginGate onLogin={(user) => { setCurrentUser(user); setIsAuthenticated(true); }} />;
  }

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
            {currentUser && (
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-foreground">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground">Administrator</div>
              </div>
            )}
            <button
              onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }}
              className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors"
            >
              <Lock size={12} /> Lock
            </button>
          </div>
        </div>
      </header>

      {/* Admin Banner */}
      <div className="gspp-gradient text-white py-2 px-4 text-center text-xs">
        Logged in as <strong>{currentUser?.name ?? "Administrator"}</strong> — Admin Access
      </div>

      <main className="container py-6">
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
        </div>

        {activeTab === "workers" && <WorkersTab />}
        {activeTab === "orders" && <OrdersTab />}
      </main>
    </div>
  );
}
