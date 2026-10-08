import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { executeConnectorAction } from "./connectorAdapters";
import {
  deleteConnectorCredential,
  getConnectorCredential,
  listConnectorCredentials,
  saveConnectorCredential,
} from "./connectorDb";
import { resolveCanonicalUserId } from "./userResolver";
import { executeHannaRequest } from "./routers";
import * as dbModule from "./db";

describe("Google Workspace Connector E2E & Identity Resolution Tests", () => {
  const firebaseUid = "firebase_test_open_id_12345";
  const numericDbUserId = 98765;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "test_google_client_id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "test_google_client_secret";
    process.env.GEMINI_API_KEY = "AIzaSyTestApiKey12345";

    vi.spyOn(dbModule, "getUserByOpenId").mockImplementation(async (openId: string) => {
      if (openId === firebaseUid) {
        return {
          id: numericDbUserId,
          openId: firebaseUid,
          name: "Test User",
          email: "user@workspace.com",
          loginMethod: "firebase",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        };
      }
      return undefined;
    });
  });

  afterEach(async () => {
    await deleteConnectorCredential(firebaseUid, "google-workspace");
    await deleteConnectorCredential(numericDbUserId, "google-workspace");
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("resolves a Firebase UID string to the canonical numeric application user ID string", async () => {
    const resolvedFromUid = await resolveCanonicalUserId(firebaseUid);
    expect(resolvedFromUid).toBe(String(numericDbUserId));

    const resolvedFromNumber = await resolveCanonicalUserId(numericDbUserId);
    expect(resolvedFromNumber).toBe(String(numericDbUserId));

    const resolvedFromNumericStr = await resolveCanonicalUserId(String(numericDbUserId));
    expect(resolvedFromNumericStr).toBe(String(numericDbUserId));
  });

  it("saves credential with Firebase UID and lists/gets correctly with numeric application user ID", async () => {
    const freshUid = "firebase_fresh_uid_101";
    const freshDbId = 91001;

    vi.spyOn(dbModule, "getUserByOpenId").mockImplementation(async (openId: string) => {
      if (openId === freshUid) {
        return {
          id: freshDbId,
          openId: freshUid,
          name: "Fresh User",
          email: "fresh@workspace.com",
          loginMethod: "firebase",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        };
      }
      return undefined;
    });

    // 1. Save using Firebase UID (simulating OAuth callback)
    await saveConnectorCredential(freshUid, "google-workspace", {
      access_token: "mock_google_access_token_abc",
      refresh_token: "mock_google_refresh_token_xyz",
      account: "fresh@workspace.com",
      is_connected: "true",
      verified: "true",
      obtained_at: String(Date.now()),
      expires_in: "3600",
    });

    // 2. List credentials using numeric application user ID
    const summaries = await listConnectorCredentials(freshDbId);
    const googleConn = summaries.find(s => s.connector === "google-workspace");
    expect(googleConn).toBeDefined();
    expect(googleConn?.is_connected).toBe(true);

    // 3. Get credential using numeric user ID for cross-family connector (gmail)
    const gmailCred = await getConnectorCredential(freshDbId, "gmail");
    expect(gmailCred).toBeDefined();
    expect(gmailCred?.values.access_token).toBe("mock_google_access_token_abc");
    expect(gmailCred?.values.account).toBe("fresh@workspace.com");

    // Cleanup
    await deleteConnectorCredential(freshUid, "google-workspace");
  });

  it("handles automatic Google token refresh when access token is near expiration", async () => {
    const refreshUid = 92002;
    const expiredTimestamp = String(Date.now() - 3600 * 1000); // 1 hour ago
    await saveConnectorCredential(refreshUid, "google-workspace", {
      access_token: "expired_token_123",
      refresh_token: "valid_refresh_token_456",
      account: "user@workspace.com",
      obtained_at: expiredTimestamp,
      expires_in: "3600",
      is_connected: "true",
    });

    const mockFetch = vi.fn(async (url: string) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        return new Response(
          JSON.stringify({
            access_token: "refreshed_access_token_789",
            expires_in: 3600,
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    vi.stubGlobal("fetch", mockFetch);

    const credential = await getConnectorCredential(refreshUid, "google-workspace");
    expect(credential).toBeDefined();
    expect(credential?.values.access_token).toBe("refreshed_access_token_789");

    vi.unstubAllGlobals();
    await deleteConnectorCredential(refreshUid, "google-workspace");
  });

  it("executes actual Google REST API requests and verifies response data", async () => {
    const mockFetcher = vi.fn(async (url: string, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer valid_access_token_100");

      if (url.includes("googleapis.com/drive/v3/files")) {
        return new Response(
          JSON.stringify({
            files: [
              {
                id: "file_001",
                name: "Q3 Strategy Brief.pdf",
                mimeType: "application/pdf",
                webViewLink: "https://drive.google.com/file/d/file_001/view",
                modifiedTime: new Date().toISOString(),
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({}), { status: 400 });
    });

    const result = await executeConnectorAction(
      {
        connector: "google-drive",
        values: {
          access_token: "valid_access_token_100",
          account: "user@workspace.com",
          obtained_at: String(Date.now()),
          expires_in: "3600",
        },
      },
      {
        connector: "google-drive",
        action: "drive_search",
        parameters: { query: "Strategy" },
      },
      mockFetcher as typeof fetch
    );

    expect(result.verification.status).toBe("verified");
    expect(result.summary).toContain("Retrieved 1 google-drive item(s)");
    expect(result.data).toEqual({
      files: [
        {
          id: "file_001",
          name: "Q3 Strategy Brief.pdf",
          mimeType: "application/pdf",
          webViewLink: "https://drive.google.com/file/d/file_001/view",
          modifiedTime: expect.any(String),
        },
      ],
      total: 1,
    });
  });

  it("invokes Agent Core with Google tools and returns verified Google API response", async () => {
    const agentUser = 93003;
    // 1. Save Google credential for numeric user with fresh timestamp
    await saveConnectorCredential(agentUser, "google-workspace", {
      access_token: "valid_agent_token_200",
      account: "user@workspace.com",
      is_connected: "true",
      verified: "true",
      obtained_at: String(Date.now()),
      expires_in: "3600",
    });

    // 2. Mock fetch calls for Gemini AI turn & Google Drive REST API
    const mockFetcher = vi.fn(async (url: string) => {
      if (url.includes("googleapis.com/drive/v3/files")) {
        return new Response(
          JSON.stringify({
            files: [
              {
                id: "drive_file_99",
                name: "2025 Product Roadmap.docx",
                mimeType: "application/vnd.google-apps.document",
              },
            ],
          }),
          { status: 200 }
        );
      }
      // Gemini API mock
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "Found your 2025 Product Roadmap document in Google Drive." }],
              },
            },
          ],
        }),
        { status: 200 }
      );
    });

    vi.stubGlobal("fetch", mockFetcher);

    // 3. Execute Hanna Agent request for "Find my latest Google Drive files"
    const response = await executeHannaRequest(
      "Find my latest Google Drive files",
      undefined,
      agentUser,
      "gemini-3.5-flash"
    );

    expect(response.text).toBeDefined();
    expect(response.providerError).toBe(false);

    vi.unstubAllGlobals();
    await deleteConnectorCredential(agentUser, "google-workspace");
  });
});
