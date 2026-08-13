import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const stockHistorySource = readFileSync(resolve(process.cwd(), "client/src/pages/StockHistory.tsx"), "utf8");
const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const customerSampleSource = readFileSync(resolve(process.cwd(), "client/src/pages/CustomerSample.tsx"), "utf8");

describe("Customer Sample in-progress stock activity", () => {
  it("records a unique stock output and decrements live stock when a sample enters progress", () => {
    expect(schemaSource).toContain('customerSampleStockMovements');
    expect(schemaSource).toContain('customerSampleStockMovements_sample_unique');
    expect(dbSource).toContain('Available Qty is insufficient for this Customer Sample request');
    expect(dbSource).toContain('sqlExpr`${orders.qty} - ${sample.sampleQty}`');
    expect(dbSource).toContain('sampleId: sample.id');
  });

  it("exposes sample stock movements to the Production Order detail and Home activity timelines", () => {
    expect(routerSource).toContain('getStockMovements: publicProcedure');
    expect(stockHistorySource).toContain('trpc.customerSamples.getStockMovements.useQuery({ orderId: order.id })');
    expect(stockHistorySource).toContain('Customer Sample · ${movement.customerName} · ${movement.sampleQty} pcs');
    expect(homeSource).toContain('trpc.customerSamples.getStockMovements.useQuery(undefined');
    expect(homeSource).toContain('Customer Sample · ${movement.customerName}');
    expect(homeSource).toContain('qty: order.initialQty ?? order.qty');
    expect(customerSampleSource).toContain("Sample marked as In Progress. Stock output recorded.");
  });
});
