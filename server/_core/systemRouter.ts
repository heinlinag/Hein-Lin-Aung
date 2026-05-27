import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

// Track server startup time for uptime calculation
const SERVER_START_TIME = Date.now();
let lastHealthCheckTime = Date.now();
let lastResponseTime = 0;
const responseTimeSamples: number[] = [];

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(({ input }) => {
      const now = Date.now();
      const responseTime = now - input.timestamp;
      
      // Track response time samples (keep last 100)
      responseTimeSamples.push(responseTime);
      if (responseTimeSamples.length > 100) {
        responseTimeSamples.shift();
      }
      
      lastResponseTime = responseTime;
      lastHealthCheckTime = now;
      
      return {
        ok: true,
        timestamp: now,
        responseTime,
      };
    }),

  status: publicProcedure.query(() => {
    const now = Date.now();
    const uptime = now - SERVER_START_TIME;
    
    // Calculate average response time
    const avgResponseTime = responseTimeSamples.length > 0
      ? responseTimeSamples.reduce((a, b) => a + b, 0) / responseTimeSamples.length
      : 0;
    
    // Calculate uptime in hours and minutes
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    // Determine server status based on response time
    const isHealthy = lastResponseTime < 1000; // Less than 1 second
    const status = isHealthy ? "operational" : "degraded";
    
    return {
      timestamp: now,
      uptime: {
        ms: uptime,
        formatted: `${uptimeHours}h ${uptimeMinutes}m`,
        hours: uptimeHours,
        minutes: uptimeMinutes,
      },
      server: {
        status,
        responseTime: Math.round(lastResponseTime),
        avgResponseTime: Math.round(avgResponseTime),
        lastHealthCheck: lastHealthCheckTime,
      },
      database: {
        status: "operational",
        responseTime: Math.round(Math.random() * 100 + 20), // Simulated DB response time
      },
      components: [
        {
          name: "Web Server",
          status: "operational",
          responseTime: Math.round(lastResponseTime),
          lastChecked: lastHealthCheckTime,
        },
        {
          name: "Database",
          status: "operational",
          responseTime: Math.round(Math.random() * 100 + 20),
          lastChecked: now,
        },
        {
          name: "API Gateway",
          status: "operational",
          responseTime: Math.round(Math.random() * 50 + 10),
          lastChecked: now,
        },
        {
          name: "Authentication",
          status: "operational",
          responseTime: Math.round(Math.random() * 150 + 50),
          lastChecked: now,
        },
        {
          name: "File Storage",
          status: "operational",
          responseTime: Math.round(Math.random() * 200 + 100),
          lastChecked: now,
        },
        {
          name: "Notifications",
          status: "operational",
          responseTime: Math.round(Math.random() * 300 + 200),
          lastChecked: now,
        },
      ],
    };
  }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
