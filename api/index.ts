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
app.get("/api/config", (_req, res) => {
  res.json({ apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "", authDomain: process.env.FIREBASE_AUTH_DOMAIN || "", projectId: process.env.FIREBASE_PROJECT_ID || "", storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "", messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "", appId: process.env.FIREBASE_APP_ID || "" });
});

const trpcMiddleware = createExpressMiddleware({ router: appRouter, createContext });
app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

export default app;
