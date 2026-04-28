import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Lock, Plus, Trash2, UserCheck, PackageOpen, RefreshCw } from "lucide-react";

const ADMIN_PASSWORD = "Qwer@7090heinann";

type Worker = { id: number; workerID: string; name: string; department: string; createdAt: Date };
type Order = {
  id: number; orderID: string; fluteType: string; sizeW: number; sizeL: number;
  qty: number; bqComment: string; status: "current" | "out_of_stock"; submittedBy: string; createdAt: Date;
};

// ─── Admin Login Gate ─────────────────────────────────────────────────────────

function AdminLoginGate({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = trpc.admin.login.useMutation();

  const handleLogin = async () => {
    setError("");
    try {
      await loginMutation.mutateAsync({ password });
      onLogin();
    } catch {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="mb-10">
        <div className="border-t-2 border-foreground pt-4 mb-1">
          <p className="editorial-label">Restricted Access</p>
        </div>
        <h1 className="font-serif text-4xl font-bold tracking-tight mb-3">
          Admin Panel
        </h1>
        <div className="border-t border-border pt-3">
          <p className="text-muted-foreground text-sm font-body">
            Enter the administrator password to access user management and order controls.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="editorial-label text-foreground">
            <Lock className="inline h-3 w-3 mr-1" />
            Admin Password
          </Label>
          <Input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
            placeholder="Enter admin password"
            className="font-sans text-sm h-10 bg-card border-border"
            autoFocus
          />
          {error && <p className="font-sans text-xs text-destructive">{error}</p>}
        </div>
        <Button
          onClick={handleLogin}
          disabled={loginMutation.isPending}
          className="w-full font-sans text-xs tracking-widest uppercase h-10 bg-foreground text-background hover:bg-foreground/90"
        >
          {loginMutation.isPending ? "Verifying…" : "Access Admin Panel"}
        </Button>
      </div>
    </div>
  );
}

// ─── Workers Tab ─────────────────────────────────────────────────────────────

function WorkersTab() {
  const utils = trpc.useUtils();
  const workersQuery = trpc.workers.list.useQuery();
  const workers = (workersQuery.data ?? []) as Worker[];

  const [showAddDialog, setShowAddDialog] = useState(false);
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
      toast.success("Worker added successfully.");
      utils.workers.list.invalidate();
      setShowAddDialog(false);
      setNewWorkerID(""); setNewName(""); setNewDept("");
    } catch (err: any) {
      setAddError(err?.message ?? "Failed to add worker.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWorker.mutateAsync({ id: deleteTarget.id, adminPassword: ADMIN_PASSWORD });
      toast.success("Worker deleted.");
      utils.workers.list.invalidate();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete worker.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-serif text-xl font-semibold">Workers</p>
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            {workers.length} registered worker{workers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          size="sm"
          className="font-sans text-xs tracking-widest uppercase h-9 px-5 bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Worker
        </Button>
      </div>

      {workersQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded" />)}
        </div>
      ) : workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserCheck className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="font-serif text-base text-muted-foreground">No workers registered</p>
          <p className="font-sans text-xs text-muted-foreground/60 mt-1">Add workers to allow order submission.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground">
                <th className="editorial-label text-left pb-3 pr-4 text-foreground">Worker ID</th>
                <th className="editorial-label text-left pb-3 pr-4 text-foreground">Name</th>
                <th className="editorial-label text-left pb-3 pr-4 text-foreground">Department</th>
                <th className="editorial-label text-left pb-3 text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id} className="border-b border-border hover:bg-accent/40 transition-colors">
                  <td className="py-3.5 pr-4 font-sans text-xs font-medium">{w.workerID}</td>
                  <td className="py-3.5 pr-4 font-body text-sm">{w.name}</td>
                  <td className="py-3.5 pr-4">
                    <Badge variant="outline" className="font-sans text-xs border-border text-muted-foreground">
                      {w.department}
                    </Badge>
                  </td>
                  <td className="py-3.5">
                    <button
                      onClick={() => setDeleteTarget(w)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete worker"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Worker Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add Worker</DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Register a new worker to allow order submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="editorial-label text-foreground">Worker ID</Label>
              <Input value={newWorkerID} onChange={e => { setNewWorkerID(e.target.value); setAddError(""); }} placeholder="e.g. W-001" className="font-sans text-sm h-10" />
            </div>
            <div className="space-y-2">
              <Label className="editorial-label text-foreground">Name</Label>
              <Input value={newName} onChange={e => { setNewName(e.target.value); setAddError(""); }} placeholder="Full name" className="font-sans text-sm h-10" />
            </div>
            <div className="space-y-2">
              <Label className="editorial-label text-foreground">Department</Label>
              <Input value={newDept} onChange={e => { setNewDept(e.target.value); setAddError(""); }} placeholder="e.g. Production" className="font-sans text-sm h-10" />
            </div>
            {addError && <p className="font-sans text-xs text-destructive">{addError}</p>}
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="font-sans text-xs tracking-widest uppercase h-9">Cancel</Button>
            <Button onClick={handleAdd} disabled={addWorker.isPending} className="font-sans text-xs tracking-widest uppercase h-9 bg-foreground text-background hover:bg-foreground/90">
              {addWorker.isPending ? "Adding…" : "Add Worker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Worker Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">Delete Worker</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-xs text-muted-foreground">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.workerID})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans text-xs tracking-widest uppercase h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="font-sans text-xs tracking-widest uppercase h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteWorker.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Orders Tab ──────────────────────────────────────────────────────────────

function OrdersTab() {
  const utils = trpc.useUtils();
  const ordersQuery = trpc.orders.list.useQuery({});
  const orders = (ordersQuery.data ?? []) as Order[];

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [confirmWorkerID, setConfirmWorkerID] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [statusTarget, setStatusTarget] = useState<Order | null>(null);

  const deleteOrder = trpc.orders.delete.useMutation();
  const updateStatus = trpc.orders.updateStatus.useMutation();

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    if (!confirmWorkerID.trim()) { setDeleteError("Worker ID is required for confirmation."); return; }
    try {
      await deleteOrder.mutateAsync({ id: deleteTarget.id, workerID: confirmWorkerID.trim(), adminPassword: ADMIN_PASSWORD });
      toast.success("Order deleted.");
      utils.orders.list.invalidate();
      setDeleteTarget(null);
      setConfirmWorkerID("");
    } catch (err: any) {
      setDeleteError(err?.message ?? "Failed to delete order.");
    }
  };

  const handleStatusChange = async (order: Order, newStatus: "current" | "out_of_stock") => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status: newStatus, adminPassword: ADMIN_PASSWORD });
      toast.success("Order status updated.");
      utils.orders.list.invalidate();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update status.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-serif text-xl font-semibold">All Orders</p>
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            {orders.length} total order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => utils.orders.list.invalidate()}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {ordersQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="font-serif text-base text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground">
                <th className="editorial-label text-left pb-3 pr-3 text-foreground">Order ID</th>
                <th className="editorial-label text-left pb-3 pr-3 text-foreground">Flute Type</th>
                <th className="editorial-label text-left pb-3 pr-3 text-foreground">Size (W×L)</th>
                <th className="editorial-label text-left pb-3 pr-3 text-foreground">Qty</th>
                <th className="editorial-label text-left pb-3 pr-3 text-foreground">BQ</th>
                <th className="editorial-label text-left pb-3 pr-3 text-foreground">Status</th>
                <th className="editorial-label text-left pb-3 text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-border hover:bg-accent/40 transition-colors">
                  <td className="py-3 pr-3 font-sans text-xs font-medium">{order.orderID}</td>
                  <td className="py-3 pr-3">
                    <Badge variant="outline" className="font-sans text-xs border-border text-foreground">
                      {order.fluteType}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 font-sans text-xs">{order.sizeW}×{order.sizeL}</td>
                  <td className="py-3 pr-3 font-sans text-xs">{order.qty} pcs</td>
                  <td className="py-3 pr-3 font-sans text-xs max-w-[140px] truncate" title={order.bqComment}>{order.bqComment}</td>
                  <td className="py-3 pr-3">
                    <button
                      onClick={() => handleStatusChange(order, order.status === "current" ? "out_of_stock" : "current")}
                      disabled={updateStatus.isPending}
                      className="transition-opacity hover:opacity-70"
                      title="Toggle status"
                    >
                      <Badge
                        variant={order.status === "current" ? "default" : "secondary"}
                        className={`font-sans text-xs cursor-pointer ${order.status === "current" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
                      >
                        {order.status === "current" ? "Current" : "Out of Stock"}
                      </Badge>
                    </button>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => { setDeleteTarget(order); setConfirmWorkerID(""); setDeleteError(""); }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete order"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Order Dialog — requires Worker ID confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) { setDeleteTarget(null); setConfirmWorkerID(""); setDeleteError(""); } }}>
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Delete Order</DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              To confirm deletion of order <strong>{deleteTarget?.orderID}</strong>, enter a valid Worker ID below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="editorial-label text-foreground">Worker ID Confirmation</Label>
              <Input
                value={confirmWorkerID}
                onChange={e => { setConfirmWorkerID(e.target.value); setDeleteError(""); }}
                onKeyDown={e => { if (e.key === "Enter") handleDeleteOrder(); }}
                placeholder="Enter Worker ID to confirm"
                className="font-sans text-sm h-10"
                autoFocus
              />
              {deleteError && <p className="font-sans text-xs text-destructive">{deleteError}</p>}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setConfirmWorkerID(""); setDeleteError(""); }} className="font-sans text-xs tracking-widest uppercase h-9">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteOrder}
              disabled={deleteOrder.isPending}
              className="font-sans text-xs tracking-widest uppercase h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrder.isPending ? "Deleting…" : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminLoginGate onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-10">
        <div className="border-t-2 border-foreground pt-4 mb-1">
          <p className="editorial-label">Administrator</p>
        </div>
        <div className="flex items-start justify-between">
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Admin Panel
          </h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="editorial-label text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            Lock
          </button>
        </div>
        <div className="border-t border-border pt-3">
          <p className="text-muted-foreground text-sm font-body">
            Manage workers, view all orders, and control stock status.
          </p>
        </div>
      </div>

      <Tabs defaultValue="workers">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto pb-0 gap-0 p-0">
          <TabsTrigger
            value="workers"
            className="font-sans text-xs tracking-widest uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
          >
            Workers
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="font-sans text-xs tracking-widest uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
          >
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workers" className="mt-8">
          <WorkersTab />
        </TabsContent>
        <TabsContent value="orders" className="mt-8">
          <OrdersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
