import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const migrationSource = readFileSync(resolve(process.cwd(), "drizzle/0051_order_initial_qty.sql"), "utf8");

describe("immutable initial Add Stock NPRM quantity", () => {
  it("persists the original submitted quantity separately from the live stock balance", () => {
    expect(schemaSource).toContain('initialQty: int("initialQty").notNull()');
    expect(routerSource).toContain("initialQty: input.qty");
    expect(dbSource).toContain("initialQty: orders.initialQty");
  });

  it("backfills historical original quantities from recorded output and balance adjustments", () => {
    expect(migrationSource).toContain("UPDATE `orders` o");
    expect(migrationSource).toContain("FROM `usageHistory`");
    expect(migrationSource).toContain("FROM `qrScanLog`");
    expect(migrationSource).toContain("o.`qty` + COALESCE(u.`totalUsedQty`, 0) - COALESCE(a.`totalAdjustmentQty`, 0)");
  });
});
