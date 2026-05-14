import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateUsageTrackingId } from "./db";

describe("generateUsageTrackingId", () => {
  beforeEach(() => {
    // Mock Date to 13 May 2026 at 20:26
    const mockDate = new Date(2026, 4, 13, 20, 26, 0); // Month is 0-indexed
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should generate 11-character tracking ID from Job No", () => {
    const trackingId = generateUsageTrackingId("A-206");
    expect(trackingId).toHaveLength(11);
    expect(trackingId).toMatch(/^[A-Z0-9]{11}$/);
  });

  it("should format as Job No (4 chars) + Time (4 chars) + Random (3 chars)", () => {
    const trackingId = generateUsageTrackingId("A-206");
    // Format: A206 + 2026 + XXX (random)
    expect(trackingId.substring(0, 4)).toBe("A206");
    expect(trackingId.substring(4, 8)).toBe("2026");
    expect(trackingId.substring(8, 11)).toMatch(/^\d{3}$/);
  });

  it("should handle Job No with spaces", () => {
    const trackingId = generateUsageTrackingId("A - 206");
    expect(trackingId.substring(0, 4)).toBe("A206");
    expect(trackingId.substring(4, 8)).toBe("2026");
  });

  it("should uppercase lowercase Job No", () => {
    const trackingId = generateUsageTrackingId("a-206");
    expect(trackingId.substring(0, 4)).toBe("A206");
  });

  it("should pad short Job No with zeros", () => {
    const trackingId = generateUsageTrackingId("B-1");
    expect(trackingId.substring(0, 4)).toBe("00B1");
    expect(trackingId.substring(4, 8)).toBe("2026");
  });

  it("should take last 4 characters of long Job No", () => {
    const trackingId = generateUsageTrackingId("ABCD-206");
    expect(trackingId.substring(0, 4)).toBe("D206");
  });

  it("should handle Job No without hyphens", () => {
    const trackingId = generateUsageTrackingId("A206");
    expect(trackingId.substring(0, 4)).toBe("A206");
    expect(trackingId.substring(4, 8)).toBe("2026");
  });

  it("should generate random suffix each time", () => {
    const id1 = generateUsageTrackingId("A-206");
    const id2 = generateUsageTrackingId("A-206");
    
    // Same Job No and time, but different random suffix
    expect(id1.substring(0, 8)).toBe(id2.substring(0, 8));
    expect(id1.substring(8, 11)).not.toBe(id2.substring(8, 11));
  });

  it("should handle numeric Job No", () => {
    const trackingId = generateUsageTrackingId("123");
    expect(trackingId.substring(0, 4)).toBe("0123");
    expect(trackingId.substring(4, 8)).toBe("2026");
  });
});
