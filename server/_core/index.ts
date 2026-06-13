import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Domain restriction — only allow access from approved production domains
  const ALLOWED_DOMAINS = ["stockdash.click", "www.stockdash.click"];
  const DEV_SUFFIXES = [".manus.computer", ".manuspre.computer", ".manus-asia.computer", ".manuscomputer.ai", ".manusvm.computer", ".manus.space"];
  app.use((req, res, next) => {
    // Always allow API paths (healthcheck, tRPC, OAuth, storage)
    if (req.path.startsWith("/api/") || req.path.startsWith("/manus-storage/")) {
      return next();
    }
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
    const hostname = host.split(":")[0].toLowerCase();
    // Always allow localhost and Manus dev/preview environments
    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1" || DEV_SUFFIXES.some(s => hostname.endsWith(s))) {
      return next();
    }
    // Allow approved production domains
    if (ALLOWED_DOMAINS.includes(hostname)) {
      return next();
    }
    // Redirect all other domains to the primary domain
    return res.redirect(301, `https://stockdash.click${req.originalUrl}`);
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
