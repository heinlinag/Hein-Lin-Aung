import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PackageOpen, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Order = {
  id: number;
  orderID: string;
  fluteType: string;
  sizeW: number;
  sizeL: number;
  qty: number;
  bqComment: string;
  status: "current" | "out_of_stock";
  submittedBy: string | null;
  createdAt: Date;
};

function OrderTable({ orders, loading, searchTerm, bqFilter, onDelete }: { orders: Order[]; loading: boolean; searchTerm: string; bqFilter: string; onDelete: (order: Order) => void }) {
  const filteredOrders = orders.filter(order =>
    (order.orderID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.fluteType.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (bqFilter === "" || order.bqComment.toLowerCase().includes(bqFilter.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-serif text-base text-muted-foreground">
          {searchTerm || bqFilter ? "No orders match your search" : "No orders found"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-3">Order ID</th>
              <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-3">Flute Type</th>
              <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-3">Size (W×L)</th>
              <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-3">Qty</th>
              <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-3">Submitted</th>
              <th className="font-sans text-xs font-semibold text-foreground text-left pb-3 pr-3">BQ</th>
              <th className="font-sans text-xs font-semibold text-foreground text-left pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                <td className="py-3 pr-3 font-sans text-sm text-foreground font-medium">{order.orderID}</td>
                <td className="py-3 pr-3 font-sans text-sm text-foreground">
                  <span className="font-medium">Flute : {order.fluteType}</span>
                </td>
                <td className="py-3 pr-3 font-sans text-sm text-foreground">{order.sizeW}×{order.sizeL} mm</td>
                <td className="py-3 pr-3 font-sans text-sm text-foreground">{order.qty.toLocaleString()} pcs</td>
                <td className="py-3 pr-3 font-sans text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td className="py-3 pr-3 font-sans text-xs max-w-[150px] truncate" title={order.bqComment}>
                  <span className="bg-yellow-100 text-yellow-900 px-2 py-1 rounded inline-block">
                    {order.bqComment}
                  </span>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => onDelete(order)}
                    className="text-red-600 hover:text-red-700 transition-colors p-1"
                    title="Delete order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {filteredOrders.map(order => (
          <div key={order.id} className="p-4 bg-card border border-border rounded-md space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-xs text-muted-foreground">Order ID</p>
                <p className="font-sans font-medium text-foreground text-sm">{order.orderID}</p>
              </div>
              <span className="font-sans font-medium text-foreground">Flute : {order.fluteType}</span>
            </div>
            <div className="flex items-start justify-between">
              <p className="font-sans text-xs text-muted-foreground">Size</p>
              <p className="font-sans text-sm text-foreground">{order.sizeW}×{order.sizeL} mm</p>
            </div>
            <div className="flex items-start justify-between">
              <p className="font-sans text-xs text-muted-foreground">Qty</p>
              <p className="font-sans text-sm text-foreground">{order.qty.toLocaleString()} pcs</p>
            </div>
            <div className="flex items-start justify-between">
              <p className="font-sans text-xs text-muted-foreground">Submitted</p>
              <p className="font-sans text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="font-sans text-xs text-muted-foreground">BQ</p>
              <p className="font-sans text-xs mt-1 break-words bg-yellow-100 text-yellow-900 px-2 py-1 rounded inline-block">{order.bqComment}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => onDelete(order)}
                className="text-red-600 hover:text-red-700 transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ order, open, onOpenChange, onConfirm }: { order: Order | null; open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (workerID: string) => void }) {
  const [workerID, setWorkerID] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Order</DialogTitle>
          <DialogDescription>
            Enter your Worker ID to confirm deletion of order {order?.orderID}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Worker ID"
            value={workerID}
            onChange={e => setWorkerID(e.target.value)}
            className="font-sans"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (workerID.trim()) {
                onConfirm(workerID);
                setWorkerID("");
                onOpenChange(false);
              } else {
                toast.error("Please enter your Worker ID");
              }
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StockHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bqFilter, setBqFilter] = useState("");
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const currentOrders = trpc.orders.list.useQuery({ status: "current" });
  const outOfStockOrders = trpc.orders.list.useQuery({ status: "out_of_stock" });
  const deleteFromHistory = trpc.orders.deleteFromHistory.useMutation();
  const utils = trpc.useUtils();

  const handleDeleteConfirm = async (workerID: string) => {
    if (!deleteOrder) return;
    try {
      await deleteFromHistory.mutateAsync({
        id: deleteOrder.id,
        workerID,
      });
      toast.success("Order deleted successfully");
      utils.orders.list.invalidate();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete order");
    }
  };

  return (
    <div className="w-full">
      <div className="px-4 py-6 md:py-8 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
            Stock History
          </h1>
          <p className="text-sm text-muted-foreground font-sans mt-1">
            View all submitted orders organized by status.
          </p>
        </div>
      </div>

      <div className="px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Search Bars */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by Order ID or Flute Type..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 font-sans text-sm h-10 bg-card border-border"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter by BQ Comment..."
                value={bqFilter}
                onChange={e => setBqFilter(e.target.value)}
                className="pl-10 font-sans text-sm h-10 bg-card border-border"
              />
            </div>
          </div>

          <Tabs defaultValue="current">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto pb-0 gap-0 p-0">
              <TabsTrigger
                value="current"
                className="font-sans text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
              >
                Current Stock
              </TabsTrigger>
              <TabsTrigger
                value="out_of_stock"
                className="font-sans text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
              >
                Out of Stock
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-0 -mx-4 md:mx-0">
              <OrderTable
                orders={(currentOrders.data as Order[]) || []}
                loading={currentOrders.isLoading}
                searchTerm={searchTerm}
                bqFilter={bqFilter}
                onDelete={(order) => {
                  setDeleteOrder(order);
                  setShowDeleteDialog(true);
                }}
              />
            </TabsContent>

            <TabsContent value="out_of_stock" className="mt-0 -mx-4 md:mx-0">
              <OrderTable
                orders={(outOfStockOrders.data as Order[]) || []}
                loading={outOfStockOrders.isLoading}
                searchTerm={searchTerm}
                bqFilter={bqFilter}
                onDelete={(order) => {
                  setDeleteOrder(order);
                  setShowDeleteDialog(true);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DeleteConfirmDialog
        order={deleteOrder}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
