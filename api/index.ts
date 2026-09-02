import express from "express";
import type { RequestHandler } from "express";
import {
  getFirebasePublicConfig,
  missingFirebaseConfigFields,
} from "../server/firebaseConfig";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
// Support both forms because Vercel rewrites can preserve or strip the /api prefix.
app.get(["/api/config", "/config"], sendFirebaseConfig);

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

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Hanna API failed to initialize.";
  res.status(500).json({ error: message });
});

export default app;
