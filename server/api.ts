import express from "express";
import crypto from "node:crypto";
import type { RequestHandler } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./_core/context";
import { appRouter } from "./routers";
import { performAiHealthCheck } from "./aiHealth";
import {
  getFirebasePublicConfig,
  missingFirebaseConfigFields,
} from "./firebaseConfig";
import { handleMcpRequest, listMcpTools } from "./mcpServer";
import { handleApiChatRoute } from "../api/chat/route";

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

// Dedicated Streaming & Intent Router Endpoint (/api/chat)
app.post(["/api/chat", "/chat"], handleApiChatRoute);

app.get(["/api/health", "/health"], async (req, res) => {
  const model = typeof req.query.model === "string" ? req.query.model : undefined;
  const provider = typeof req.query.provider === "string" ? req.query.provider : undefined;

  const report = await performAiHealthCheck({ model, provider });
  const isHealthy = report.status === "AI_READY";

  res.status(isHealthy ? 200 : 503).json(report);
});

// Cloudinary Upload Handler Endpoint
app.post(["/api/upload", "/upload"], async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Cloudinary credentials not configured on server (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).",
      });
    }

    const { file, filename, folder } = req.body || {};
    if (!file) {
      return res.status(400).json({ error: "Missing file data for upload." });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folderName = folder || "hanna_uploads";
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "hanna_agent";
    const strToSign = `folder=${folderName}&timestamp=${timestamp}&upload_preset=${uploadPreset}${apiSecret}`;

    const signature = crypto
      .createHash("sha1")
      .update(strToSign)
      .digest("hex");

    const formData = new URLSearchParams();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("folder", folderName);
    formData.append("upload_preset", uploadPreset);
    formData.append("signature", signature);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!cloudinaryRes.ok) {
      const errText = await cloudinaryRes.text();
      return res
        .status(cloudinaryRes.status)
        .json({ error: `Cloudinary error: ${errText}` });
    }

    const resultData = await cloudinaryRes.json();
    return res.json({
      url: resultData.secure_url || resultData.url,
      public_id: resultData.public_id,
      format: resultData.format,
      bytes: resultData.bytes,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Cloudinary upload failed";
    return res.status(500).json({ error: msg });
  }
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
