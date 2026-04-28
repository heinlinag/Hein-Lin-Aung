import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageOpen, RefreshCw } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-serif text-base text-muted-foreground">No orders found</p>
        <p className="font-sans text-xs text-muted-foreground/60 mt-1">
          Orders will appear here once submitted.
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
              <th className="font-sans text-xs font-semibold text-foreground text-left pb-3">BQ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                <td className="py-3 pr-3 font-sans text-sm text-foreground font-medium">{order.orderID}</td>
                <td className="py-3 pr-3">
                  <Badge variant="outline" className="font-sans text-xs border-border">
                    {order.fluteType}
                  </Badge>
                </td>
                <td className="py-3 pr-3 font-sans text-sm text-foreground">{order.sizeW}×{order.sizeL} mm</td>
                <td className="py-3 pr-3 font-sans text-sm text-foreground">{order.qty.toLocaleString()} pcs</td>
                <td className="py-3 font-sans text-xs text-muted-foreground max-w-[200px] truncate" title={order.bqComment}>
                  {order.bqComment}
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
              <p className="font-sans text-xs text-muted-foreground">Order ID</p>
              <p className="font-sans font-medium text-foreground text-sm">{order.orderID}</p>
            </div>
            <div className="flex items-start justify-between">
              <p className="font-sans text-xs text-muted-foreground">Flute Type</p>
              <Badge variant="outline" className="font-sans text-xs border-border">
                {order.fluteType}
              </Badge>
            </div>
            <div className="flex items-start justify-between">
              <p className="font-sans text-xs text-muted-foreground">Size</p>
              <p className="font-sans text-sm text-foreground">{order.sizeW}×{order.sizeL} mm</p>
            </div>
            <div className="flex items-start justify-between">
              <p className="font-sans text-xs text-muted-foreground">Qty</p>
              <p className="font-sans text-sm text-foreground">{order.qty.toLocaleString()} pcs</p>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="font-sans text-xs text-muted-foreground mb-1">BQ</p>
              <p className="font-sans text-xs text-foreground break-words">{order.bqComment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StockHistory() {
  const [activeTab, setActiveTab] = useState<"current" | "out_of_stock">("current");
  const utils = trpc.useUtils();

  const currentQuery = trpc.orders.list.useQuery({ status: "current" });
  const outOfStockQuery = trpc.orders.list.useQuery({ status: "out_of_stock" });

  const currentOrders = (currentQuery.data ?? []) as Order[];
  const outOfStockOrders = (outOfStockQuery.data ?? []) as Order[];

  const handleRefresh = () => {
    utils.orders.list.invalidate();
  };

  return (
    <div className="w-full px-4 py-6 md:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
                Stock History
              </h1>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                All submitted flute board orders.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <div>
              <p className="font-sans text-xs text-muted-foreground">Current</p>
              <p className="font-serif text-2xl font-semibold text-foreground">
                {currentOrders.length}
              </p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="font-sans text-xs text-muted-foreground">Out of Stock</p>
              <p className="font-serif text-2xl font-semibold text-foreground">
                {outOfStockOrders.length}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "current" | "out_of_stock")}>
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto pb-0 gap-0 p-0">
            <TabsTrigger
              value="current"
              className="font-sans text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
            >
              Current Stock
              {currentOrders.length > 0 && (
                <span className="ml-2 font-sans text-xs bg-secondary text-foreground rounded px-1.5 py-0.5">
                  {currentOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="out_of_stock"
              className="font-sans text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4 text-muted-foreground data-[state=active]:text-foreground"
            >
              Out of Stock
              {outOfStockOrders.length > 0 && (
                <span className="ml-2 font-sans text-xs bg-secondary text-foreground rounded px-1.5 py-0.5">
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
    </div>
  );
}
