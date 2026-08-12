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
});
