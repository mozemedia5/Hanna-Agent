import express from "express";
import crypto from "node:crypto";
import type { RequestHandler } from "express";
import { performAiHealthCheck } from "../server/aiHealth";
import {
  getFirebasePublicConfig,
  missingFirebaseConfigFields,
} from "../server/firebaseConfig";
import { handleMcpRequest, listMcpTools } from "../server/mcpServer";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use((req, res, next) => {
  const requestId =
    (req.headers["x-request-id"] as string) || `req_${crypto.randomUUID()}`;
  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

const sendFirebaseConfig = (_req: express.Request, res: express.Response) => {
  const config = getFirebasePublicConfig();
  const missing = missingFirebaseConfigFields(config);
  if (missing.length) {
    return res
      .status(503)
      .json({ error: "Firebase configuration is incomplete.", missing });
  }
  return res.setHeader("cache-control", "no-store").json(config);
};

app.get("/api", (_req, res) => {
  res.json({ status: "ok", service: "hanna-agent-api" });
});

app.get(["/api/config", "/config"], sendFirebaseConfig);

app.get(["/api/health", "/health"], async (req, res, next) => {
  try {
    const model = typeof req.query.model === "string" ? req.query.model : undefined;
    const provider = typeof req.query.provider === "string" ? req.query.provider : undefined;
    const report = await performAiHealthCheck({ model, provider });
    const isHealthy = report.status === "AI_READY";
    res.status(isHealthy ? 200 : 503).json(report);
  } catch (error) {
    next(error);
  }
});

app.all(["/api/mcp", "/mcp"], async (req, res, next) => {
  try {
    if (req.method === "GET") {
      return res.json({
        name: "hanna-mcp-server",
        protocolVersion: "2026-08",
        toolsCount: listMcpTools().length,
        tools: listMcpTools(),
      });
    }
    const result = await handleMcpRequest(req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

const lazyTrpcMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const [{ createExpressMiddleware }, { createContext }, { appRouter }] =
      await Promise.all([
        import("@trpc/server/adapters/express"),
        import("../server/_core/context"),
        import("../server/routers"),
      ]);
    return createExpressMiddleware({ router: appRouter, createContext })(
      req,
      res,
      next
    );
  } catch (error) {
    return next(error);
  }
};

app.use("/api/trpc", lazyTrpcMiddleware);
app.use("/trpc", lazyTrpcMiddleware);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : "Hanna API failed to initialize.";
    res.status(500).json({ error: message });
  }
);

export default app;
