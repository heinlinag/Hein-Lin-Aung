import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stockHistorySource = readFileSync(
  resolve(process.cwd(), "client/src/pages/StockHistory.tsx"),
  "utf8",
);

describe("Stock History order details", () => {
  it("stores the selected order and opens a dedicated full-detail dialog", () => {
    expect(stockHistorySource).toContain("const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)");
    expect(stockHistorySource).toContain("function OrderDetailDialog");
    expect(stockHistorySource).toContain("{selectedOrderDetails && <OrderDetailDialog");
    expect(stockHistorySource).toContain("Production Order Details");
  });

  it("opens details from desktop rows and mobile cards", () => {
    expect(stockHistorySource).toContain("<tr key={order.id} onClick={() => setSelectedOrderDetails(order)}");
    expect(stockHistorySource).toContain('<div key={order.id} onClick={() => setSelectedOrderDetails(order)} role="button" tabIndex={0}');
  });

  it("keeps row action controls isolated from the detail trigger", () => {
    expect(stockHistorySource).toContain("event.stopPropagation(); setUsedUpdateOrder(order);");
    expect(stockHistorySource).toContain("event.stopPropagation();\n                            if (userLevel === \"1\")");
    expect(stockHistorySource).toContain("Close order details");
  });

  it("labels scanner-created orders as Auto Scanner and manual orders as Manual Entry", () => {
    expect(stockHistorySource).toContain('order.submittedVia === "scanner"');
    expect(stockHistorySource).toContain('isScannerOrder ? "Auto Scanner" : "Manual Entry"');
  });

  it("keeps submission-method text inside Production Order Details without visual row badges", () => {
    expect(stockHistorySource).toContain('<span className="text-[10px] font-bold text-slate-400">Submission method</span>');
    expect(stockHistorySource).not.toContain("function SubmissionMethodBadge");
    expect(stockHistorySource).not.toContain("<ScanLine size={10} />");
    expect(stockHistorySource).not.toContain("<PenLine size={10} />");
  });

  it("shows order-specific Input and Output activity inside Production Order Details", () => {
    expect(stockHistorySource).toContain("const orderActivityUsageQuery = trpc.orders.getUsage.useQuery()");
    expect(stockHistorySource).toContain("const orderActivityAdjustmentsQuery = trpc.orders.getQrScanHistory.useQuery()");
    expect(stockHistorySource).toContain(".filter(entry => entry.orderID === order.orderID)");
    expect(stockHistorySource).toContain(".filter(log => log.orderId === order.orderID && log.action === \"balance_update\"");
    expect(stockHistorySource).toContain("Input / Output Activity");
    expect(stockHistorySource).toContain("Initial stock added");
    expect(stockHistorySource).toContain("Stock movement for this production order");
  });

  it("preserves the original Add Stock NPRM quantity and displays a compact running balance", () => {
    expect(stockHistorySource).toContain("initialQty: number");
    expect(stockHistorySource).toContain("const originalInputQty = order.initialQty ?? order.qty");
    expect(stockHistorySource).not.toContain("const initialInputQty = Math.max(0");
    expect(stockHistorySource).toContain("runningBalance: Math.max(0, runningBalance += activity.quantityDelta)");
    expect(stockHistorySource).toContain('title="Balance after this movement"');
    expect(stockHistorySource).toContain("Bal. {activity.runningBalance} pcs");
  });

  it("reserves NPRM Modify Order usage during pending and in-process states and labels approved output", () => {
    expect(stockHistorySource).toContain("const orderActivityRequestsQuery = trpc.pendingRequests.list.useQuery({})");
    expect(stockHistorySource).toContain("const nprmUsageRequests = (orderActivityRequestsQuery.data ?? []).flatMap");
    expect(stockHistorySource).toContain("const pendingUsageQty = nprmUsageRequests");
    expect(stockHistorySource).toContain("const inProcessUsageQty = nprmUsageRequests");
    expect(stockHistorySource).toContain("const availableQty = Math.max(0, recordedCurrentQty - pendingUsageQty - inProcessUsageQty)");
    expect(stockHistorySource).toContain("Used for Job ${request.jobNo} · ${request.usageQty} pcs");
    expect(stockHistorySource).toContain('activity.activityStatus === "in_process" ? "In Process" : activity.activityStatus');
  });

  it("hides Added Date from the desktop table while retaining it in Production Order Details", () => {
    expect(stockHistorySource).toContain('{ label: "Added", value: new Date(order.createdAt).toLocaleString() }');
    expect(stockHistorySource).not.toContain('"BQ","Date", activeTab === "out_of_stock"');
    expect(stockHistorySource).not.toContain('<td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>');
  });
});
