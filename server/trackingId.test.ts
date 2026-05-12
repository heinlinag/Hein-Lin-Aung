import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateTrackingId } from './db';

describe('generateTrackingId', () => {
  beforeEach(() => {
    // Mock current date: May 13, 2026, 20:26
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 13, 20, 26, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate tracking ID with orderID suffix', () => {
    const trackingId = generateTrackingId('A-206');
    // Format: PP4 + DDMMYY + HHMM + OrderID Suffix (14 chars total)
    // Expected: PP4 + 130526 + 2026 + A206 = PP41305262026A206
    expect(trackingId).toBe('PP41305262026A206');
  });

  it('should handle orderID with different formats', () => {
    const trackingId1 = generateTrackingId('A206');
    expect(trackingId1).toBe('PP41305262026A206');

    const trackingId2 = generateTrackingId('B-123');
    expect(trackingId2).toBe('PP41305262026B123');
  });

  it('should pad orderID suffix to 4 digits', () => {
    const trackingId = generateTrackingId('A-1');
    expect(trackingId).toBe('PP4130526202600A1');
  });

  it('should use default suffix when orderID is not provided', () => {
    const trackingId = generateTrackingId();
    expect(trackingId).toBe('PP413052620260000');
  });

  it('should extract last 4 characters from long orderID', () => {
    const trackingId = generateTrackingId('ABCD-12345');
    expect(trackingId).toBe('PP413052620262345');
  });

  it('should handle uppercase conversion', () => {
    const trackingId = generateTrackingId('a-206');
    expect(trackingId).toBe('PP41305262026A206');
  });

  it('should handle orderID with spaces', () => {
    const trackingId = generateTrackingId('A - 206');
    expect(trackingId).toBe('PP41305262026A206');
  });
});
