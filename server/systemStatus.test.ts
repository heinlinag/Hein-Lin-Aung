import { describe, it, expect, beforeEach, vi } from 'vitest';
import { systemRouter } from './_core/systemRouter';

describe('System Status & Health Procedures', () => {
  describe('health procedure', () => {
    it('should return ok status with response time', async () => {
      const caller = systemRouter.createCaller({} as any);
      const timestamp = Date.now();
      const result = await caller.health({ timestamp });
      
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.timestamp).toBeGreaterThanOrEqual(timestamp);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate response time correctly', async () => {
      const caller = systemRouter.createCaller({} as any);
      const timestamp = Date.now() - 100; // 100ms ago
      const result = await caller.health({ timestamp });
      
      expect(result.responseTime).toBeGreaterThanOrEqual(100);
    });

    it('should reject negative timestamp', async () => {
      const caller = systemRouter.createCaller({} as any);
      
      try {
        await caller.health({ timestamp: -1 });
        expect.fail('Should have thrown an error');
      } catch (err: any) {
        expect(err.message).toContain('timestamp cannot be negative');
      }
    });
  });

  describe('status procedure', () => {
    it('should return complete status object', async () => {
      const caller = systemRouter.createCaller({} as any);
      const result = await caller.status();
      
      expect(result).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.uptime).toBeDefined();
      expect(result.server).toBeDefined();
      expect(result.database).toBeDefined();
      expect(result.components).toBeDefined();
    });

    it('should include uptime information', async () => {
      const caller = systemRouter.createCaller({} as any);
      const result = await caller.status();
      
      expect(result.uptime.ms).toBeGreaterThanOrEqual(0);
      expect(result.uptime.formatted).toMatch(/^\d+h \d+m$/);
      expect(result.uptime.hours).toBeGreaterThanOrEqual(0);
      expect(result.uptime.minutes).toBeGreaterThanOrEqual(0);
      expect(result.uptime.minutes).toBeLessThan(60);
    });

    it('should include server status with response time', async () => {
      const caller = systemRouter.createCaller({} as any);
      const result = await caller.status();
      
      expect(result.server.status).toMatch(/^(operational|degraded|down)$/);
      expect(result.server.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.server.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(result.server.lastHealthCheck).toBeGreaterThan(0);
    });

    it('should include database status', async () => {
      const caller = systemRouter.createCaller({} as any);
      const result = await caller.status();
      
      expect(result.database.status).toBe('operational');
      expect(result.database.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should include system components', async () => {
      const caller = systemRouter.createCaller({} as any);
      const result = await caller.status();
      
      expect(result.components).toBeInstanceOf(Array);
      expect(result.components.length).toBeGreaterThan(0);
      
      result.components.forEach(component => {
        expect(component.name).toBeDefined();
        expect(component.status).toMatch(/^(operational|degraded|down)$/);
        expect(component.responseTime).toBeGreaterThanOrEqual(0);
        expect(component.lastChecked).toBeGreaterThan(0);
      });
    });

    it('should have Web Server component', async () => {
      const caller = systemRouter.createCaller({} as any);
      const result = await caller.status();
      
      const webServer = result.components.find(c => c.name === 'Web Server');
      expect(webServer).toBeDefined();
      expect(webServer?.status).toBe('operational');
    });

    it('should have Database component', async () => {
      const caller = systemRouter.createCaller({} as any);
      const result = await caller.status();
      
      const database = result.components.find(c => c.name === 'Database');
      expect(database).toBeDefined();
      expect(database?.status).toBe('operational');
    });

    it('should have all required components', async () => {
      const caller = systemRouter.createCaller({} as any);
      const result = await caller.status();
      
      const requiredComponents = [
        'Web Server',
        'Database',
        'API Gateway',
        'Authentication',
        'File Storage',
        'Notifications',
      ];
      
      requiredComponents.forEach(name => {
        const component = result.components.find(c => c.name === name);
        expect(component).toBeDefined();
      });
    });

    it('should determine operational status based on response time', async () => {
      const caller = systemRouter.createCaller({} as any);
      
      // Call health first to populate response time
      await caller.health({ timestamp: Date.now() });
      
      const result = await caller.status();
      
      if (result.server.responseTime < 1000) {
        expect(result.server.status).toBe('operational');
      }
    });
  });
});
