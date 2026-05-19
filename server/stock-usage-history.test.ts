import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, getUsageHistoryByOrderID, logUsageHistory } from "./db";

describe("Stock Usage History Display", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
  });

  it("should return empty array for order with no usage history", async () => {
    const history = await getUsageHistoryByOrderID("TEST-NO-HISTORY");
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(0);
  });

  it("should return usage history for an order with job usage", async () => {
    // Log a usage record
    await logUsageHistory({
      jobNo: "12345678",
      usedQty: 30,
      orderID: "TEST-ORDER-001",
      fluteType: "B",
      bqComment: "TEST-BQ",
      purpose: "job",
      orderId: 999,
      newQty: 120,
      masterCard: "PABC00001A",
      boardSizeW: 546,
      boardSizeL: 1016,
      scores: "184 275 184",
    });

    const history = await getUsageHistoryByOrderID("TEST-ORDER-001");
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].orderID).toBe("TEST-ORDER-001");
    expect(history[0].usedQty).toBe(30);
    expect(history[0].purpose).toBe("job");
    expect(history[0].jobNo).toBe("12345678");
    expect(history[0].masterCard).toBe("PABC00001A");
  });

  it("should return usage history for an order with old stock usage", async () => {
    // Log an old stock usage record
    await logUsageHistory({
      jobNo: null,
      usedQty: 66,
      orderID: "TEST-ORDER-002",
      fluteType: "BA",
      bqComment: "TEST-BQ-2",
      purpose: "old_stock",
      orderId: 999,
      newQty: 0,
    });

    const history = await getUsageHistoryByOrderID("TEST-ORDER-002");
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].orderID).toBe("TEST-ORDER-002");
    expect(history[0].usedQty).toBe(66);
    expect(history[0].purpose).toBe("old_stock");
    expect(history[0].jobNo).toBeNull();
  });

  it("should return multiple usage records for same order in reverse chronological order", async () => {
    const orderID = "TEST-ORDER-003";

    // Log first usage
    await logUsageHistory({
      jobNo: "11111111",
      usedQty: 15,
      orderID,
      fluteType: "B",
      bqComment: "TEST-BQ",
      purpose: "job",
      orderId: 999,
      newQty: 135,
      masterCard: "CARD-001",
      boardSizeW: 500,
      boardSizeL: 1000,
    });

    // Log second usage
    await logUsageHistory({
      jobNo: "22222222",
      usedQty: 40,
      orderID,
      fluteType: "B",
      bqComment: "TEST-BQ",
      purpose: "job",
      orderId: 999,
      newQty: 95,
      masterCard: "CARD-002",
      boardSizeW: 600,
      boardSizeL: 1200,
    });

    const history = await getUsageHistoryByOrderID(orderID);
    expect(history.length).toBeGreaterThanOrEqual(2);
    
    // Should be in reverse chronological order (newest first)
    const recordsForOrder = history.filter(h => h.orderID === orderID);
    if (recordsForOrder.length >= 2) {
      expect(new Date(recordsForOrder[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(recordsForOrder[1].createdAt).getTime()
      );
    }
  });

  it("should include all required fields in usage history", async () => {
    const orderID = "TEST-ORDER-004";
    
    await logUsageHistory({
      jobNo: "33333333",
      usedQty: 25,
      orderID,
      fluteType: "BA",
      bqComment: "LR140MP115LR140",
      purpose: "job",
      orderId: 999,
      newQty: 126,
      masterCard: "PABC00001A",
      boardSizeW: 546,
      boardSizeL: 1016,
      scores: "184 275",
    });

    const history = await getUsageHistoryByOrderID(orderID);
    const record = history.find(h => h.orderID === orderID);
    
    expect(record).toBeDefined();
    expect(record?.id).toBeDefined();
    expect(record?.jobNo).toBe("33333333");
    expect(record?.usedQty).toBe(25);
    expect(record?.orderID).toBe(orderID);
    expect(record?.fluteType).toBe("BA");
    expect(record?.bqComment).toBe("LR140MP115LR140");
    expect(record?.purpose).toBe("job");
    expect(record?.masterCard).toBe("PABC00001A");
    expect(record?.boardSizeW).toBe(546);
    expect(record?.boardSizeL).toBe(1016);
    expect(record?.scores).toBe("184 275");
    expect(record?.createdAt).toBeDefined();
  });

  it("should calculate correct current quantity from usage history", async () => {
    const orderID = "TEST-ORDER-005";
    const initialQty = 151;

    // Log multiple usages
    await logUsageHistory({
      jobNo: "10000001",
      usedQty: 30,
      orderID,
      fluteType: "B",
      bqComment: "TEST",
      purpose: "job",
      orderId: 999,
      newQty: 121,
    });

    await logUsageHistory({
      jobNo: "10000002",
      usedQty: 15,
      orderID,
      fluteType: "B",
      bqComment: "TEST",
      purpose: "job",
      orderId: 999,
      newQty: 106,
    });

    await logUsageHistory({
      jobNo: "10000003",
      usedQty: 40,
      orderID,
      fluteType: "B",
      bqComment: "TEST",
      purpose: "job",
      orderId: 999,
      newQty: 66,
    });

    await logUsageHistory({
      jobNo: null,
      usedQty: 66,
      orderID,
      fluteType: "B",
      bqComment: "TEST",
      purpose: "old_stock",
      orderId: 999,
      newQty: 0,
    });

    const history = await getUsageHistoryByOrderID(orderID);
    const recordsForOrder = history.filter(h => h.orderID === orderID);
    
    // Calculate current qty: initialQty - sum of all usedQty
    const totalUsed = recordsForOrder.reduce((sum, h) => sum + h.usedQty, 0);
    const currentQty = Math.max(0, initialQty - totalUsed);

    // Should have at least 4 records from this test
    expect(recordsForOrder.length).toBeGreaterThanOrEqual(4);
    // Total used should be at least 151 (30 + 15 + 40 + 66)
    expect(totalUsed).toBeGreaterThanOrEqual(151);
    // Current qty should be 0 (capped at 0)
    expect(currentQty).toBe(0);
  });
});
