type WorkspaceSettings = {
  userId: number;
  theme: "light" | "dark";
  defaultProvider: string;
  autoRouting: boolean;
};
const runtimeSettings = new Map<number, WorkspaceSettings>();

export async function getWorkspaceSettings(
  userId: number
): Promise<WorkspaceSettings> {
  return (
    runtimeSettings.get(userId) ?? {
      userId,
      theme: "light",
      defaultProvider: "automatic",
      autoRouting: true,
    }
  );
}

export async function updateWorkspaceSettings(
  userId: number,
  values: {
    theme?: "light" | "dark";
    defaultProvider?: string;
    autoRouting?: boolean;
  }
) {
  const current = await getWorkspaceSettings(userId);
  const next = { ...current, ...values, userId };
  runtimeSettings.set(userId, next);
  return next;
}

/** Replace this store with Firebase Firestore when the custom backend is configured. */
