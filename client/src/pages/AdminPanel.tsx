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
      setError("Incorrect password.");
    }
  };

  return (
    <div className="w-full px-4 py-6 md:py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Enter the administrator password to access user and order management.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-sans text-sm font-medium text-foreground">
              <Lock className="inline h-3.5 w-3.5 mr-1.5" />
              Admin Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
              placeholder="Enter password"
              className="font-sans text-sm h-10 bg-card border-border"
              autoFocus
            />
            {error && <p className="font-sans text-xs text-destructive">{error}</p>}
          </div>
          <Button
            onClick={handleLogin}
            disabled={loginMutation.isPending}
            className="w-full font-sans text-sm font-medium h-10 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loginMutation.isPending ? "Verifying…" : "Access Admin Panel"}
          </Button>
        </div>
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
      toast.success("Worker added.");
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
    <div className="w-full px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-serif text-xl font-semibold text-foreground">Workers</p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              {workers.length} registered worker{workers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            className="font-sans text-xs font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserCheck className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="font-serif text-base text-muted-foreground">No workers registered</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-3">Worker ID</th>
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-3">Name</th>
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-3">Department</th>
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(w => (
                    <tr key={w.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="py-3 pr-3 font-sans text-sm font-medium text-foreground">{w.workerID}</td>
                      <td className="py-3 pr-3 font-sans text-sm text-foreground">{w.name}</td>
                      <td className="py-3 pr-3">
                        <Badge variant="outline" className="font-sans text-xs border-border">
                          {w.department}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => setDeleteTarget(w)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-2">
              {workers.map(w => (
                <div key={w.id} className="p-4 bg-card border border-border rounded-md space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">Worker ID</p>
                      <p className="font-sans font-medium text-foreground text-sm">{w.workerID}</p>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(w)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-start justify-between">
                    <p className="font-sans text-xs text-muted-foreground">Name</p>
                    <p className="font-sans text-sm text-foreground">{w.name}</p>
                  </div>
                  <div className="flex items-start justify-between">
                    <p className="font-sans text-xs text-muted-foreground">Department</p>
                    <Badge variant="outline" className="font-sans text-xs border-border">
                      {w.department}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add Worker Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-sm bg-card">
            <DialogHeader>
              <DialogTitle className="font-serif text-lg">Add Worker</DialogTitle>
              <DialogDescription className="font-sans text-xs text-muted-foreground">
                Register a new worker.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="font-sans text-sm font-medium text-foreground">Worker ID</Label>
                <Input value={newWorkerID} onChange={e => { setNewWorkerID(e.target.value); setAddError(""); }} placeholder="W-001" className="font-sans text-sm h-10" />
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-sm font-medium text-foreground">Name</Label>
                <Input value={newName} onChange={e => { setNewName(e.target.value); setAddError(""); }} placeholder="Full name" className="font-sans text-sm h-10" />
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-sm font-medium text-foreground">Department</Label>
                <Input value={newDept} onChange={e => { setNewDept(e.target.value); setAddError(""); }} placeholder="Production" className="font-sans text-sm h-10" />
              </div>
              {addError && <p className="font-sans text-xs text-destructive">{addError}</p>}
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="font-sans text-xs font-medium h-9">Cancel</Button>
              <Button onClick={handleAdd} disabled={addWorker.isPending} className="font-sans text-xs font-medium h-9 bg-primary text-primary-foreground hover:bg-primary/90">
                {addWorker.isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Worker Confirm */}
        <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent className="bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-lg">Delete Worker</AlertDialogTitle>
              <AlertDialogDescription className="font-sans text-xs text-muted-foreground">
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-sans text-xs font-medium h-9">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="font-sans text-xs font-medium h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleteWorker.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
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
    } catch (err: any) {
      setDeleteError(err?.message ?? "Failed to delete order.");
    }
  };

  const handleStatusChange = async (order: Order, newStatus: "current" | "out_of_stock") => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status: newStatus, adminPassword: ADMIN_PASSWORD });
      toast.success("Status updated.");
      utils.orders.list.invalidate();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update status.");
    }
  };

  return (
    <div className="w-full px-4 py-6 md:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-serif text-xl font-semibold text-foreground">All Orders</p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              {orders.length} total order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => utils.orders.list.invalidate()}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PackageOpen className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="font-serif text-base text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-2">Order ID</th>
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-2">Flute</th>
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-2">Size</th>
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-2">Qty</th>
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-2">Status</th>
                    <th className="font-sans text-xs font-semibold text-foreground text-left pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="py-3 pr-2 font-sans text-sm font-medium text-foreground">{order.orderID}</td>
                      <td className="py-3 pr-2">
                        <Badge variant="outline" className="font-sans text-xs border-border">
                          {order.fluteType}
                        </Badge>
                      </td>
                      <td className="py-3 pr-2 font-sans text-sm text-foreground">{order.sizeW}×{order.sizeL}</td>
                      <td className="py-3 pr-2 font-sans text-sm text-foreground">{order.qty}</td>
                      <td className="py-3 pr-2">
                        <button
                          onClick={() => handleStatusChange(order, order.status === "current" ? "out_of_stock" : "current")}
                          disabled={updateStatus.isPending}
                          className="transition-opacity hover:opacity-70"
                        >
                          <Badge
                            variant={order.status === "current" ? "default" : "secondary"}
                            className={`font-sans text-xs cursor-pointer ${order.status === "current" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                          >
                            {order.status === "current" ? "Current" : "Out"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => { setDeleteTarget(order); setConfirmWorkerID(""); setDeleteError(""); }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-2">
              {orders.map(order => (
                <div key={order.id} className="p-4 bg-card border border-border rounded-md space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">Order ID</p>
                      <p className="font-sans font-medium text-foreground text-sm">{order.orderID}</p>
                    </div>
                    <button
                      onClick={() => { setDeleteTarget(order); setConfirmWorkerID(""); setDeleteError(""); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-start justify-between">
                    <p className="font-sans text-xs text-muted-foreground">Flute Type</p>
                    <Badge variant="outline" className="font-sans text-xs border-border">
                      {order.fluteType}
                    </Badge>
                  </div>
                  <div className="flex items-start justify-between">
                    <p className="font-sans text-xs text-muted-foreground">Size</p>
                    <p className="font-sans text-sm text-foreground">{order.sizeW}×{order.sizeL}</p>
                  </div>
                  <div className="flex items-start justify-between">
                    <p className="font-sans text-xs text-muted-foreground">Qty</p>
                    <p className="font-sans text-sm text-foreground">{order.qty}</p>
                  </div>
                  <div className="flex items-start justify-between pt-2 border-t border-border">
                    <p className="font-sans text-xs text-muted-foreground">Status</p>
                    <button
                      onClick={() => handleStatusChange(order, order.status === "current" ? "out_of_stock" : "current")}
                      disabled={updateStatus.isPending}
                      className="transition-opacity hover:opacity-70"
                    >
                      <Badge
                        variant={order.status === "current" ? "default" : "secondary"}
                        className={`font-sans text-xs cursor-pointer ${order.status === "current" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                      >
                        {order.status === "current" ? "Current" : "Out"}
                      </Badge>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Delete Order Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) { setDeleteTarget(null); setConfirmWorkerID(""); setDeleteError(""); } }}>
          <DialogContent className="max-w-sm bg-card">
            <DialogHeader>
              <DialogTitle className="font-serif text-lg">Delete Order</DialogTitle>
              <DialogDescription className="font-sans text-xs text-muted-foreground">
                Enter a Worker ID to confirm deletion of order <strong>{deleteTarget?.orderID}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="font-sans text-sm font-medium text-foreground">Worker ID</Label>
                <Input
                  value={confirmWorkerID}
                  onChange={e => { setConfirmWorkerID(e.target.value); setDeleteError(""); }}
                  onKeyDown={e => { if (e.key === "Enter") handleDeleteOrder(); }}
                  placeholder="Enter Worker ID"
                  className="font-sans text-sm h-10"
                  autoFocus
                />
                {deleteError && <p className="font-sans text-xs text-destructive">{deleteError}</p>}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => { setDeleteTarget(null); setConfirmWorkerID(""); setDeleteError(""); }} className="font-sans text-xs font-medium h-9">
                Cancel
              </Button>
              <Button
                onClick={handleDeleteOrder}
                disabled={deleteOrder.isPending}
                className="font-sans text-xs font-medium h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteOrder.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
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
    <div className="w-full">
      <div className="px-4 py-6 md:py-8 border-b border-border">
        <div className="max-w-5xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground font-sans mt-1">
              Manage workers and orders.
            </p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="font-sans text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2"
          >
            Lock
          </button>
        </div>
      </div>

      <div className="px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="workers">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto pb-0 gap-0 p-0">
              <TabsTrigger
                value="workers"
                className="font-sans text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
              >
                Workers
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="font-sans text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
              >
                Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workers" className="mt-0 -mx-4 md:mx-0">
              <WorkersTab />
            </TabsContent>
            <TabsContent value="orders" className="mt-0 -mx-4 md:mx-0">
              <OrdersTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
