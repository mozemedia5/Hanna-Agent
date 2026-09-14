import express from "express";
import crypto from "node:crypto";
import type { RequestHandler } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";
import { performAiHealthCheck } from "../server/aiHealth";
import {
  getFirebasePublicConfig,
  missingFirebaseConfigFields,
} from "../server/firebaseConfig";
import { handleMcpRequest, listMcpTools } from "../server/mcpServer";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request Correlation ID Middleware
app.use((req, res, next) => {
  const reqId =
    (req.headers["x-request-id"] as string) || `req_${crypto.randomUUID()}`;
  req.headers["x-request-id"] = reqId;
  res.setHeader("x-request-id", reqId);
  next();
});

const sendFirebaseConfig = (_req: express.Request, res: express.Response) => {
  const config = getFirebasePublicConfig();
  const missing = missingFirebaseConfigFields(config);
  if (missing.length)
    return res
      .status(503)
      .json({ error: "Firebase configuration is incomplete.", missing });
  return res.setHeader("cache-control", "no-store").json(config);
};

app.get("/api", (_req, res) => {
  res.json({ status: "ok", service: "hanna-agent-api" });
});

app.get(["/api/config", "/config"], sendFirebaseConfig);

app.get(["/api/health", "/health"], async (req, res) => {
  const model = typeof req.query.model === "string" ? req.query.model : undefined;
  const provider = typeof req.query.provider === "string" ? req.query.provider : undefined;

  const report = await performAiHealthCheck({ model, provider });
  const isHealthy = report.status === "AI_READY";

  res.status(isHealthy ? 200 : 503).json(report);
});

// MCP Server Endpoint (JSON-RPC 2.0 / Model Context Protocol)
app.all(["/api/mcp", "/mcp"], async (req, res) => {
  if (req.method === "GET") {
    return res.json({
      name: "hanna-mcp-server",
      protocolVersion: "2026-08",
      toolsCount: listMcpTools().length,
      tools: listMcpTools(),
    });
  }

  const result = await handleMcpRequest(req.body);
  res.json(result);
});

const trpcMiddleware: RequestHandler = createExpressMiddleware({
  router: appRouter,
  createContext,
});
app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Hanna API failed to initialize.";
  res.status(500).json({ error: message });
});

export default app;
