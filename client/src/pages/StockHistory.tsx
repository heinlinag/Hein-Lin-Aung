import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageOpen } from "lucide-react";

type Order = {
  id: number;
  orderID: string;
  fluteType: string;
  sizeW: number;
  sizeL: number;
  qty: number;
  bqComment: string;
  status: "current" | "out_of_stock";
  submittedBy: string;
  createdAt: Date;
};

function OrderTable({ orders, loading }: { orders: Order[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageOpen className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="font-serif text-lg text-muted-foreground">No orders found</p>
        <p className="font-sans text-xs text-muted-foreground/60 mt-1">
          Orders will appear here once submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="editorial-label text-left pb-3 pr-4 text-foreground">Order ID</th>
            <th className="editorial-label text-left pb-3 pr-4 text-foreground">Flute Type</th>
            <th className="editorial-label text-left pb-3 pr-4 text-foreground">Size (W×L)</th>
            <th className="editorial-label text-left pb-3 pr-4 text-foreground">Qty</th>
            <th className="editorial-label text-left pb-3 pr-4 text-foreground">BQ</th>
            <th className="editorial-label text-left pb-3 text-foreground">Submitted By</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, idx) => (
            <tr
              key={order.id}
              className="border-b border-border hover:bg-accent/40 transition-colors"
            >
              <td className="py-3.5 pr-4 font-sans text-xs font-medium text-foreground">
                {order.orderID}
              </td>
              <td className="py-3.5 pr-4">
                <Badge
                  variant="outline"
                  className="font-sans text-xs font-medium border-foreground/30 text-foreground"
                >
                  {order.fluteType}
                </Badge>
              </td>
              <td className="py-3.5 pr-4 font-sans text-xs text-foreground">
                {order.sizeW} × {order.sizeL} mm
              </td>
              <td className="py-3.5 pr-4 font-sans text-xs text-foreground">
                {order.qty.toLocaleString()} pcs
              </td>
              <td className="py-3.5 pr-4 font-sans text-xs text-foreground max-w-[200px] truncate" title={order.bqComment}>
                {order.bqComment}
              </td>
              <td className="py-3.5 font-sans text-xs text-muted-foreground">
                {order.submittedBy}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StockHistory() {
  const [activeTab, setActiveTab] = useState<"current" | "out_of_stock">("current");

  const currentQuery = trpc.orders.list.useQuery({ status: "current" });
  const outOfStockQuery = trpc.orders.list.useQuery({ status: "out_of_stock" });

  const currentOrders = (currentQuery.data ?? []) as Order[];
  const outOfStockOrders = (outOfStockQuery.data ?? []) as Order[];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-10">
        <div className="border-t-2 border-foreground pt-4 mb-1">
          <p className="editorial-label">Inventory</p>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Stock History
        </h1>
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <p className="text-muted-foreground text-sm font-body">
            All submitted flute board orders and their current stock status.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-sans text-xs text-muted-foreground">Current</p>
              <p className="font-serif text-xl font-bold leading-none">
                {currentOrders.length}
              </p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-right">
              <p className="font-sans text-xs text-muted-foreground">Out of Stock</p>
              <p className="font-serif text-xl font-bold leading-none">
                {outOfStockOrders.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "current" | "out_of_stock")}>
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto pb-0 gap-0 p-0">
          <TabsTrigger
            value="current"
            className="font-sans text-xs tracking-widest uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
          >
            Current Stock
            {currentOrders.length > 0 && (
              <span className="ml-2 font-sans text-xs bg-foreground text-background rounded-full px-1.5 py-0.5 leading-none">
                {currentOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="out_of_stock"
            className="font-sans text-xs tracking-widest uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
          >
            Out of Stock
            {outOfStockOrders.length > 0 && (
              <span className="ml-2 font-sans text-xs bg-muted-foreground text-background rounded-full px-1.5 py-0.5 leading-none">
                {outOfStockOrders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-0">
          <OrderTable orders={currentOrders} loading={currentQuery.isLoading} />
        </TabsContent>

        <TabsContent value="out_of_stock" className="mt-0">
          <OrderTable orders={outOfStockOrders} loading={outOfStockQuery.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
