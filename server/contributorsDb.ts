/*
 * Contributor & Chat Sharing DB Store
 * Handles contributor seats, role permissions, monthly enterprise credit settings,
 * and chat sharing for team collaboration (Manus style).
 */

export type ContributorRole = "head" | "admin" | "editor" | "viewer";

export type Contributor = {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  role: ContributorRole;
  status: "active" | "invited" | "disabled";
  monthlyCreditLimit: number;
  addedAt: string;
};

export type SharedChatAccess = {
  chatId: string;
  workspaceId: string;
  sharedWithEmails: string[];
  permission: "read" | "write";
  sharedBy: string;
  updatedAt: string;
};

// In-memory persistent contributor store
const contributorsMap = new Map<string, Contributor[]>();
const sharedChatsMap = new Map<string, SharedChatAccess>();

export function getWorkspaceContributors(workspaceId: string): Contributor[] {
  const existing = contributorsMap.get(workspaceId);
  if (existing) return existing;

  // Initialize with Head of Contributors
  const defaultHead: Contributor = {
    id: `contrib_head_${workspaceId}`,
    workspaceId,
    email: "owner@workspace.com",
    name: "Head of Contributors (Owner)",
    role: "head",
    status: "active",
    monthlyCreditLimit: 20000,
    addedAt: new Date().toISOString(),
  };

  const initial = [defaultHead];
  contributorsMap.set(workspaceId, initial);
  return initial;
}

export function inviteContributor(
  workspaceId: string,
  email: string,
  role: ContributorRole = "editor",
  monthlyCreditLimit = 2000
): Contributor {
  const current = getWorkspaceContributors(workspaceId);
  const existing = current.find(c => c.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) return existing;

  const newContrib: Contributor = {
    id: `contrib_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    workspaceId,
    email: email.trim().toLowerCase(),
    name: email.split("@")[0] || "Contributor",
    role,
    status: "invited",
    monthlyCreditLimit,
    addedAt: new Date().toISOString(),
  };

  current.push(newContrib);
  contributorsMap.set(workspaceId, current);
  return newContrib;
}

export function removeContributor(workspaceId: string, contributorId: string): boolean {
  const current = getWorkspaceContributors(workspaceId);
  const next = current.filter(c => c.id !== contributorId && c.role !== "head");
  contributorsMap.set(workspaceId, next);
  return true;
}

export function updateContributorCredits(
  workspaceId: string,
  contributorId: string,
  credits: number
): Contributor | undefined {
  const current = getWorkspaceContributors(workspaceId);
  const item = current.find(c => c.id === contributorId);
  if (!item) return undefined;

  item.monthlyCreditLimit = Math.max(100, credits);
  contributorsMap.set(workspaceId, current);
  return item;
}

export function shareChatWithContributors(
  workspaceId: string,
  chatId: string,
  emails: string[],
  sharedBy: string,
  permission: "read" | "write" = "write"
): SharedChatAccess {
  const key = `${workspaceId}:${chatId}`;
  const existing = sharedChatsMap.get(key);

  const mergedEmails = Array.from(
    new Set([...(existing?.sharedWithEmails || []), ...emails.map(e => e.toLowerCase().trim())])
  );

  const access: SharedChatAccess = {
    chatId,
    workspaceId,
    sharedWithEmails: mergedEmails,
    permission,
    sharedBy,
    updatedAt: new Date().toISOString(),
  };

  sharedChatsMap.set(key, access);
  return access;
}

export function getSharedChatAccess(workspaceId: string, chatId: string): SharedChatAccess | undefined {
  return sharedChatsMap.get(`${workspaceId}:${chatId}`);
}
