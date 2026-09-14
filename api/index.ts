import { performAiHealthCheck } from "../server/aiHealth";
import { getFirebasePublicConfig, missingFirebaseConfigFields } from "../server/firebaseConfig";
import { handleMcpRequest, listMcpTools } from "../server/mcpServer";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

type RequestLike = {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  statusCode?: number;
  status?: (code: number) => ResponseLike;
  setHeader: (name: string, value: string) => void;
  json?: (value: unknown) => ResponseLike;
  end: (value?: string) => void;
};

function respond(res: ResponseLike, status: number, payload: unknown) {
  const target = typeof res.status === "function" ? res.status(status) : res;
  if (typeof target.statusCode === "number") target.statusCode = status;
  target.setHeader("content-type", "application/json; charset=utf-8");
  if (typeof target.json === "function") return target.json(payload);
  target.end(JSON.stringify(payload));
}

function requestPath(req: RequestLike) {
  return new URL(req.url || "/", "http://hanna.local").pathname;
}

function requestBody(req: RequestLike) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return undefined;
    }
  }
  return req.body;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  const path = requestPath(req);
  const method = req.method || "GET";

  try {
    if (path === "/api" || path === "/") {
      return respond(res, 200, { status: "ok", service: "hanna-agent-api" });
    }

    if (path === "/api/config" || path === "/config") {
      if (method !== "GET") return respond(res, 405, { error: "Method not allowed." });
      const config = getFirebasePublicConfig();
      const missing = missingFirebaseConfigFields(config);
      if (missing.length) return respond(res, 503, { error: "Firebase configuration is incomplete.", missing });
      res.setHeader("cache-control", "no-store");
      return respond(res, 200, config);
    }

    if (path === "/api/health" || path === "/health") {
      if (method !== "GET") return respond(res, 405, { error: "Method not allowed." });
      const query = new URLSearchParams((req.url || "").split("?")[1] || "");
      const model = query.get("model") || undefined;
      const provider = query.get("provider") || undefined;
      const report = await performAiHealthCheck({ model, provider });
      return respond(res, report.status === "AI_READY" ? 200 : 503, report);
    }

    if (path === "/api/mcp" || path === "/mcp") {
      if (method === "GET") {
        return respond(res, 200, {
          name: "hanna-mcp-server",
          protocolVersion: "2026-08",
          toolsCount: listMcpTools().length,
          tools: listMcpTools(),
        });
      }
      return respond(res, 200, await handleMcpRequest(requestBody(req) as never));
    }

    if (path.startsWith("/api/trpc/") || path.startsWith("/trpc/")) {
      const express = (await import("express")).default;
      
      const app = express();
      app.use(express.json({ limit: "50mb" }));
      app.use(express.urlencoded({ limit: "50mb", extended: true }));
      const middleware = createExpressMiddleware({ router: appRouter, createContext });
      app.use("/api/trpc", middleware);
      app.use("/trpc", middleware);
      app.use((error: unknown, _req: unknown, response: ResponseLike, _next: unknown) => {
        respond(response, 500, { error: error instanceof Error ? error.message : "Hanna API failed." });
      });
      return app(req as never, res as never);
    }

    return respond(res, 404, { error: "Not found." });
  } catch (error) {
    return respond(res, 500, {
      error: error instanceof Error ? error.message : "Hanna API failed to initialize.",
    });
  }
}
