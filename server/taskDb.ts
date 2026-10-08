import { getAdminFirestore } from "./firestore";

export type ScheduledTaskRepeat = "once" | "daily" | "weekly" | "monthly";
export type ScheduledTaskStatus = "scheduled" | "executing" | "completed" | "failed" | "cancelled";

export type ScheduledTaskRecord = {
  id: string;
  uid: string;
  userId?: number;
  title: string;
  description: string;
  cronOrSchedule?: string;
  executionTime: string;
  repeat: ScheduledTaskRepeat;
  tools: string[];
  imageUrl?: string | null;
  action: string;
  parameters?: Record<string, unknown>;
  status: ScheduledTaskStatus;
  createdAt: string;
  updatedAt: string;
  lastExecutionResult?: string | null;
  executedAt?: string | null;
  nextRunAt: string;
};

// In-memory fallback cache for development/test environments
const inMemoryTasks = new Map<string, ScheduledTaskRecord>();

/**
 * Calculates the next run timestamp based on current schedule and recurrence setting.
 */
export function calculateNextRunAt(
  currentRunAt: string | Date,
  repeat: ScheduledTaskRepeat,
  fromDate: Date = new Date()
): string {
  const base = new Date(currentRunAt);
  const start = isNaN(base.getTime()) ? fromDate : base;

  if (repeat === "once") {
    return start.toISOString();
  }

  const next = new Date(start.getTime());

  // Advance next until it is after fromDate
  while (next <= fromDate) {
    if (repeat === "daily") {
      next.setDate(next.getDate() + 1);
    } else if (repeat === "weekly") {
      next.setDate(next.getDate() + 7);
    } else if (repeat === "monthly") {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next.toISOString();
}

/**
 * Creates a new scheduled task in Firestore and in-memory fallback.
 */
export async function createScheduledTask(params: {
  uid: string;
  userId?: number;
  title: string;
  prompt: string;
  executionTime: string;
  repeat?: ScheduledTaskRepeat;
  tools?: string[];
  imageUrl?: string | null;
  action?: string;
  parameters?: Record<string, unknown>;
}): Promise<ScheduledTaskRecord> {
  const now = new Date();
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const repeat = params.repeat || "once";

  const parsedExec = new Date(params.executionTime);
  const validExec = isNaN(parsedExec.getTime()) ? now : parsedExec;
  const executionTimeIso = validExec.toISOString();
  const nextRunAtIso = executionTimeIso;

  const cronOrSchedule = String((params.parameters?.cronOrSchedule as string) || (params.parameters?.schedule as string) || executionTimeIso);

  const task: ScheduledTaskRecord = {
    id,
    uid: params.uid,
    userId: params.userId,
    title: params.title.trim(),
    description: params.prompt.trim(),
    cronOrSchedule,
    executionTime: executionTimeIso,
    repeat,
    tools: params.tools || [],
    imageUrl: params.imageUrl || null,
    action: params.action || "scheduled_agent_run",
    parameters: {
      prompt: params.prompt.trim(),
      executionTime: executionTimeIso,
      repeat,
      tools: params.tools || [],
      imageUrl: params.imageUrl || null,
      ...(params.parameters || {}),
    },
    status: "scheduled",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastExecutionResult: null,
    executedAt: null,
    nextRunAt: nextRunAtIso,
  };

  // Save to in-memory store
  inMemoryTasks.set(id, { ...task });

  // Save to Firestore if available
  const firestore = getAdminFirestore();
  if (firestore) {
    try {
      await firestore
        .collection("users")
        .doc(params.uid)
        .collection("scheduled_tasks")
        .doc(id)
        .set(task);
    } catch (err) {
      console.warn("[TaskDb] Firestore create task failed, using in-memory fallback:", err);
    }
  }

  return task;
}

/**
 * Retrieves all scheduled tasks belonging strictly to a specific user.
 */
export async function listScheduledTasksForUser(uid: string): Promise<ScheduledTaskRecord[]> {
  const firestore = getAdminFirestore();
  if (firestore) {
    try {
      const snapshot = await firestore
        .collection("users")
        .doc(uid)
        .collection("scheduled_tasks")
        .get();

      if (!snapshot.empty) {
        const tasks = snapshot.docs.map(doc => doc.data() as ScheduledTaskRecord);
        // Sync into memory cache
        for (const t of tasks) {
          inMemoryTasks.set(t.id, t);
        }
        return tasks.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      }
    } catch (err) {
      console.warn("[TaskDb] Firestore list tasks failed, falling back to in-memory:", err);
    }
  }

  // In-memory fallback filtering strictly by uid
  return Array.from(inMemoryTasks.values())
    .filter(t => t.uid === uid)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

/**
 * Gets a specific task belonging strictly to a specific user.
 */
export async function getScheduledTaskForUser(
  uid: string,
  taskId: string
): Promise<ScheduledTaskRecord | undefined> {
  const firestore = getAdminFirestore();
  if (firestore) {
    try {
      const doc = await firestore
        .collection("users")
        .doc(uid)
        .collection("scheduled_tasks")
        .doc(taskId)
        .get();

      if (doc.exists) {
        const task = doc.data() as ScheduledTaskRecord;
        if (task.uid === uid) {
          inMemoryTasks.set(task.id, task);
          return task;
        }
      }
    } catch (err) {
      console.warn("[TaskDb] Firestore get task failed:", err);
    }
  }

  const memTask = inMemoryTasks.get(taskId);
  if (memTask && memTask.uid === uid) {
    return memTask;
  }
  return undefined;
}

/**
 * Cancels a scheduled task belonging to a specific user.
 */
export async function cancelScheduledTaskForUser(uid: string, taskId: string): Promise<boolean> {
  const task = await getScheduledTaskForUser(uid, taskId);
  if (!task) return false;

  const nowIso = new Date().toISOString();
  task.status = "cancelled";
  task.updatedAt = nowIso;

  inMemoryTasks.set(task.id, { ...task });

  const firestore = getAdminFirestore();
  if (firestore) {
    try {
      await firestore
        .collection("users")
        .doc(uid)
        .collection("scheduled_tasks")
        .doc(taskId)
        .update({
          status: "cancelled",
          updatedAt: nowIso,
        });
    } catch (err) {
      console.warn("[TaskDb] Firestore cancel task failed:", err);
    }
  }

  return true;
}

/**
 * Executes a task immediately on demand for its owner.
 */
export async function executeScheduledTaskNowForUser(
  uid: string,
  taskId: string,
  executor: (task: ScheduledTaskRecord) => Promise<string>
): Promise<{ success: boolean; result: string; task: ScheduledTaskRecord }> {
  const task = await getScheduledTaskForUser(uid, taskId);
  if (!task) {
    throw new Error("Task not found or access denied.");
  }

  const now = new Date();
  const nowIso = now.toISOString();

  let resultText = "";
  let isSuccess = false;

  try {
    resultText = await executor(task);
    isSuccess = true;
  } catch (err) {
    resultText = err instanceof Error ? err.message : "Execution failed";
  }

  task.executedAt = nowIso;
  task.lastExecutionResult = resultText;
  task.updatedAt = nowIso;

  if (isSuccess) {
    if (task.repeat === "once") {
      task.status = "completed";
    } else {
      task.status = "scheduled";
      task.nextRunAt = calculateNextRunAt(task.nextRunAt, task.repeat, now);
    }
  } else {
    task.status = "failed";
  }

  inMemoryTasks.set(task.id, { ...task });

  const firestore = getAdminFirestore();
  if (firestore) {
    try {
      await firestore
        .collection("users")
        .doc(uid)
        .collection("scheduled_tasks")
        .doc(taskId)
        .set(task, { merge: true });
    } catch (err) {
      console.warn("[TaskDb] Firestore execute update failed:", err);
    }
  }

  return { success: isSuccess, result: resultText, task };
}

/**
 * Atomically queries and claims due tasks across all users, then executes them safely.
 */
export async function runDueTasksAcrossAllUsers(
  executor: (task: ScheduledTaskRecord) => Promise<string>
): Promise<{ executedCount: number; results: Array<{ taskId: string; success: boolean; result: string }> }> {
  const now = new Date();
  const nowIso = now.toISOString();
  const dueTasks: ScheduledTaskRecord[] = [];

  const firestore = getAdminFirestore();

  if (firestore) {
    try {
      const snapshot = await firestore
        .collectionGroup("scheduled_tasks")
        .where("status", "==", "scheduled")
        .where("nextRunAt", "<=", nowIso)
        .get();

      if (!snapshot.empty) {
        for (const doc of snapshot.docs) {
          dueTasks.push(doc.data() as ScheduledTaskRecord);
        }
      }
    } catch (err) {
      console.warn("[TaskDb] Firestore collectionGroup query for due tasks failed, falling back to memory:", err);
    }
  }

  // Merge due tasks from in-memory if not already added
  for (const t of Array.from(inMemoryTasks.values())) {
    if (t.status === "scheduled" && t.nextRunAt <= nowIso) {
      if (!dueTasks.some(dt => dt.id === t.id)) {
        dueTasks.push(t);
      }
    }
  }

  let executedCount = 0;
  const executionResults: Array<{ taskId: string; success: boolean; result: string }> = [];

  for (const task of dueTasks) {
    // ATOMIC LOCK CLAIM:
    let claimed = false;

    if (firestore) {
      try {
        const docRef = firestore
          .collection("users")
          .doc(task.uid)
          .collection("scheduled_tasks")
          .doc(task.id);

        claimed = await firestore.runTransaction(async (transaction) => {
          const docSnap = await transaction.get(docRef);
          if (!docSnap.exists) return false;
          const currentData = docSnap.data() as ScheduledTaskRecord;
          if (currentData.status !== "scheduled" || currentData.nextRunAt > nowIso) {
            return false;
          }
          transaction.update(docRef, {
            status: "executing",
            updatedAt: nowIso,
          });
          return true;
        });
      } catch (err) {
        console.warn(`[TaskDb] Transaction claim failed for task ${task.id}:`, err);
        claimed = false;
      }
    }

    if (!claimed) {
      // In-memory atomic claim check
      const mem = inMemoryTasks.get(task.id);
      if (mem && mem.status === "scheduled" && mem.nextRunAt <= nowIso) {
        mem.status = "executing";
        mem.updatedAt = nowIso;
        claimed = true;
      }
    }

    if (!claimed) {
      continue; // Skip if another instance claimed it
    }

    // Execute task
    let resultText = "";
    let isSuccess = false;

    try {
      resultText = await executor(task);
      isSuccess = true;
    } catch (err) {
      resultText = err instanceof Error ? err.message : "Execution failed";
    }

    const execTime = new Date();
    const execTimeIso = execTime.toISOString();

    task.executedAt = execTimeIso;
    task.lastExecutionResult = resultText;
    task.updatedAt = execTimeIso;

    if (isSuccess) {
      if (task.repeat === "once") {
        task.status = "completed";
      } else {
        task.status = "scheduled";
        task.nextRunAt = calculateNextRunAt(task.nextRunAt, task.repeat, execTime);
      }
    } else {
      task.status = "failed";
    }

    // Persist final execution state
    inMemoryTasks.set(task.id, { ...task });

    if (firestore) {
      try {
        await firestore
          .collection("users")
          .doc(task.uid)
          .collection("scheduled_tasks")
          .doc(task.id)
          .set(task, { merge: true });
      } catch (err) {
        console.warn(`[TaskDb] Firestore post-execution save failed for task ${task.id}:`, err);
      }
    }

    executedCount++;
    executionResults.push({ taskId: task.id, success: isSuccess, result: resultText });
  }

  return { executedCount, results: executionResults };
}

/**
 * Clears in-memory tasks cache (for testing).
 */
export function clearInMemoryTasksForTest() {
  inMemoryTasks.clear();
}
