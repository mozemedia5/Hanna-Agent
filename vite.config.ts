import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const firebaseEnvKeys = ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "STORAGE_BUCKET", "MESSAGING_SENDER_ID", "APP_ID", "MEASUREMENT_ID"] as const;
const firebaseBuildEnv = (env: Record<string, string | undefined>) => Object.fromEntries(firebaseEnvKeys.map((key) => [`VITE_FIREBASE_${key}`, env[`VITE_FIREBASE_${key}`] || env[`FIREBASE_${key}`] || env[`NEXT_PUBLIC_FIREBASE_${key}`] || ""]));

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, path.resolve(import.meta.dirname), "") };
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname, "client"),
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    define: Object.fromEntries(Object.entries(firebaseBuildEnv(env)).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])),
    server: {
      host: true,
      allowedHosts: ["localhost", "127.0.0.1"],
      fs: { strict: true, deny: ["**/.*"] },
    },
  };
});
