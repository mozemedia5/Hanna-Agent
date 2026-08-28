import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/api", (_req, res) => {
  res.json({ status: "ok", service: "hanna-agent-api" });
});

const trpcMiddleware = createExpressMiddleware({ router: appRouter, createContext });
app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

export default app;
