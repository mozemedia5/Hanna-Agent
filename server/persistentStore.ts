import fs from "node:fs";
import path from "node:path";
import { decryptCredential, encryptCredential } from "./credentialCrypto";

const STORE_PATH =
  process.env.HANNA_STORE_PATH ||
  path.join(process.cwd(), ".data", "hanna_credentials_store.json");
const TMP_STORE_PATH = "/tmp/hanna_credentials_store.json";

function getTargetFilePath(): string {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return STORE_PATH;
  } catch {
    return TMP_STORE_PATH;
  }
}

type StoreData = {
  providerCredentials: Record<string, any>;
  connectorCredentials: Record<string, any>;
  updatedAt: string;
};

let memoryStore: StoreData = {
  providerCredentials: {},
  connectorCredentials: {},
  updatedAt: new Date().toISOString(),
};

let isLoaded = false;

function loadStore(): StoreData {
  if (isLoaded) return memoryStore;

  const pathsToTry = [getTargetFilePath(), TMP_STORE_PATH];
  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf8");
        if (raw) {
          const decrypted = decryptCredential(raw);
          const parsed = JSON.parse(decrypted) as StoreData;
          if (parsed && typeof parsed === "object") {
            memoryStore = {
              providerCredentials: parsed.providerCredentials || {},
              connectorCredentials: parsed.connectorCredentials || {},
              updatedAt: parsed.updatedAt || new Date().toISOString(),
            };
            isLoaded = true;
            return memoryStore;
          }
        }
      }
    } catch {
      // Continue to next path if parsing fails
    }
  }

  isLoaded = true;
  return memoryStore;
}

function saveStore(): void {
  memoryStore.updatedAt = new Date().toISOString();
  const serialized = JSON.stringify(memoryStore);
  const encrypted = encryptCredential(serialized);

  const targetPath = getTargetFilePath();

  let wroteTarget = false;
  try {
    fs.writeFileSync(targetPath, encrypted, "utf8");
    wroteTarget = true;
  } catch {
    // Reading/writing from targetPath (e.g. process.cwd()/.data) failed (e.g., EROFS on serverless)
  }

  // Always attempt writing to /tmp as serverless fallback
  try {
    if (!wroteTarget || targetPath !== TMP_STORE_PATH) {
      fs.writeFileSync(TMP_STORE_PATH, encrypted, "utf8");
    }
  } catch (error) {
    if (!wroteTarget) {
      console.warn("[PersistentStore] Failed to save credentials to disk:", error);
    }
  }
}

export function getStoredProviderCredentials(): Record<string, any> {
  const store = loadStore();
  return store.providerCredentials;
}

export function saveStoredProviderCredential(key: string, record: any): void {
  const store = loadStore();
  store.providerCredentials[key] = record;
  saveStore();
}

export function deleteStoredProviderCredential(key: string): void {
  const store = loadStore();
  delete store.providerCredentials[key];
  saveStore();
}

export function getStoredConnectorCredentials(): Record<string, any> {
  const store = loadStore();
  return store.connectorCredentials;
}

export function saveStoredConnectorCredential(key: string, record: any): void {
  const store = loadStore();
  store.connectorCredentials[key] = record;
  saveStore();
}

export function deleteStoredConnectorCredential(key: string): void {
  const store = loadStore();
  delete store.connectorCredentials[key];
  saveStore();
}

export function forceReloadStoreForTest(): void {
  isLoaded = false;
  memoryStore = {
    providerCredentials: {},
    connectorCredentials: {},
    updatedAt: new Date().toISOString(),
  };
}
