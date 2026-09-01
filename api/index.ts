import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";
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

const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});
app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

export default app;
