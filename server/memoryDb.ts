export interface UserMemoryItem {
  id: string;
  uid: string;
  content: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

const memoryMemoryStore = new Map<string, UserMemoryItem[]>();

export async function saveUserMemory(
  uid: string,
  content: string,
  category: string = "general"
): Promise<UserMemoryItem> {
  const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const item: UserMemoryItem = {
    id,
    uid,
    content,
    category,
    createdAt: now,
    updatedAt: now,
  };

  const existing = memoryMemoryStore.get(uid) ?? [];
  existing.push(item);
  memoryMemoryStore.set(uid, existing);
  return item;
}

export async function listUserMemories(
  uid: string,
  limitCount: number = 20
): Promise<UserMemoryItem[]> {
  const existing = memoryMemoryStore.get(uid) ?? [];
  return existing.slice(-limitCount);
}

export async function deleteUserMemory(uid: string, memoryId: string): Promise<boolean> {
  const existing = memoryMemoryStore.get(uid) ?? [];
  const next = existing.filter((m) => m.id !== memoryId);
  memoryMemoryStore.set(uid, next);
  return true;
}

export async function getRelevantMemories(
  uid: string,
  queryPrompt?: string,
  maxCount: number = 5
): Promise<UserMemoryItem[]> {
  const all = await listUserMemories(uid, 50);
  if (!queryPrompt || !queryPrompt.trim()) {
    return all.slice(0, maxCount);
  }

  const terms = queryPrompt.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) {
    return all.slice(0, maxCount);
  }

  const scored = all.map((mem) => {
    let score = 0;
    const lower = mem.content.toLowerCase();
    terms.forEach((term) => {
      if (lower.includes(term)) score += 1;
    });
    return { mem, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.mem).slice(0, maxCount);
}
