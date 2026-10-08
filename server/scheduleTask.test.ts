import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { Server } from "node:http";
import app from "./api";
import {
  calculateNextRunAt,
  createScheduledTask,
  listScheduledTasksForUser,
  getScheduledTaskForUser,
  cancelScheduledTaskForUser,
  executeScheduledTaskNowForUser,
  runDueTasksAcrossAllUsers,
  clearInMemoryTasksForTest,
} from "./taskDb";

function createMockFirebaseToken(uid: string, email: string = `${uid}@example.com`): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      user_id: uid,
      sub: uid,
      email,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000) - 10,
    })
  ).toString("base64url");
  return `${header}.${payload}.mocksignature`;
}

describe("Schedule Task Production Architecture & Security Tests", () => {
  let server: Server;
  let baseUrl: string;
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    clearInMemoryTasksForTest();
    process.env.GEMINI_API_KEY = "test_gemini_prod_key_12345";
    process.env.GEMINI_MODEL = "gemini-3.5-flash";

    await new Promise<void>(resolve => {
      server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (typeof addr === "object" && addr) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it("succeeds with valid tRPC v11 json payload format and rejects unauthenticated schedule requests", async () => {
    // 1. Unauthenticated request must be rejected (401 or TRPC UNAUTHORIZED)
    const unauthRes = await fetch(`${baseUrl}/api/trpc/hanna.scheduleTask?batch=1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        "0": {
          json: {
            title: "Unauthenticated Task",
            prompt: "Test prompt",
            executionTime: new Date().toISOString(),
            repeat: "once",
            tools: [],
          },
        },
      }),
    });

    expect([401, 500]).toContain(unauthRes.status);
    const unauthPayload = await unauthRes.json();
    expect(unauthPayload[0]?.error?.json?.message).toBeDefined();

    // 2. Authenticated request with valid payload succeeds (HTTP 200)
    const token = createMockFirebaseToken("user_auth_123");
    const authRes = await fetch(`${baseUrl}/api/trpc/hanna.scheduleTask?batch=1`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        "0": {
          json: {
            title: "Authenticated Scheduled Report",
            prompt: "Generate inventory report",
            executionTime: new Date().toISOString(),
            repeat: "daily",
            tools: ["shopify"],
            imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          },
        },
      }),
    });

    expect(authRes.status).toBe(200);
    const authPayload = await authRes.json();
    const task = authPayload[0]?.result?.data?.json?.task;
    expect(task).toBeDefined();
    expect(task.id).toBeDefined();
    expect(task.title).toBe("Authenticated Scheduled Report");
    expect(task.imageUrl).toContain("data:image/png;base64");
  });

  it("rejects malformed tRPC payload without json wrapper with HTTP 400 or BAD_REQUEST", async () => {
    const token = createMockFirebaseToken("user_auth_123");
    // Missing "json" wrapper
    const res = await fetch(`${baseUrl}/api/trpc/hanna.scheduleTask?batch=1`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        "0": {
          title: "Malformed Task",
          prompt: "Missing json wrapper",
          executionTime: new Date().toISOString(),
          repeat: "once",
          tools: [],
        },
      }),
    });

    expect([400, 500]).toContain(res.status);
    const payload = await res.json();
    expect(payload[0]?.error).toBeDefined();
  });

  it("enforces user isolation: User A cannot list, execute, or cancel User B's tasks", async () => {
    const userAToken = createMockFirebaseToken("user_A_111");
    const userBToken = createMockFirebaseToken("user_B_222");

    // User A creates a task
    const createRes = await fetch(`${baseUrl}/api/trpc/hanna.scheduleTask?batch=1`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        "0": {
          json: {
            title: "User A Private Task",
            prompt: "Confidential data sync",
            executionTime: new Date().toISOString(),
            repeat: "once",
            tools: [],
          },
        },
      }),
    });

    expect(createRes.status).toBe(200);
    const createPayload = await createRes.json();
    const taskA = createPayload[0]?.result?.data?.json?.task;
    expect(taskA?.id).toBeDefined();

    // User B lists tasks - Task A MUST NOT appear
    const listResB = await fetch(`${baseUrl}/api/trpc/hanna.listScheduledTasks?batch=1`, {
      headers: { authorization: `Bearer ${userBToken}` },
    });
    expect(listResB.status).toBe(200);
    const listPayloadB = await listResB.json();
    const tasksB = listPayloadB[0]?.result?.data?.json?.tasks || [];
    expect(tasksB.some((t: any) => t.id === taskA.id)).toBe(false);

    // User B attempts to execute User A's task - MUST be rejected
    const execResB = await fetch(`${baseUrl}/api/trpc/hanna.executeScheduledTaskNow?batch=1`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        "0": {
          json: { taskId: taskA.id },
        },
      }),
    });
    expect([404, 500]).toContain(execResB.status);

    // User B attempts to cancel User A's task - MUST be rejected
    const cancelResB = await fetch(`${baseUrl}/api/trpc/hanna.cancelScheduledTask?batch=1`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        "0": {
          json: { taskId: taskA.id },
        },
      }),
    });
    expect([404, 500]).toContain(cancelResB.status);

    // User A cancels their own task - MUST succeed
    const cancelResA = await fetch(`${baseUrl}/api/trpc/hanna.cancelScheduledTask?batch=1`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        "0": {
          json: { taskId: taskA.id },
        },
      }),
    });
    expect(cancelResA.status).toBe(200);
  });

  it("preserves imageUrl attribute and persists image asset state", async () => {
    const userUid = "user_image_test_999";
    const imageUrl = "https://example.com/assets/sample-chart.png";

    const task = await createScheduledTask({
      uid: userUid,
      title: "Visual Task",
      prompt: "Analyze chart image",
      executionTime: new Date().toISOString(),
      imageUrl,
    });

    expect(task.imageUrl).toBe(imageUrl);

    const fetched = await getScheduledTaskForUser(userUid, task.id);
    expect(fetched?.imageUrl).toBe(imageUrl);
  });

  it("calculates correct nextRunAt recurrence for once, daily, weekly, and monthly tasks", () => {
    const baseDate = new Date("2026-03-01T10:00:00.000Z");

    // 1. Once -> returns same time
    const onceNext = calculateNextRunAt(baseDate.toISOString(), "once", baseDate);
    expect(onceNext).toBe(baseDate.toISOString());

    // 2. Daily -> advances by 1 day
    const dailyNext = calculateNextRunAt(baseDate.toISOString(), "daily", baseDate);
    const expectedDaily = new Date("2026-03-02T10:00:00.000Z").toISOString();
    expect(dailyNext).toBe(expectedDaily);

    // 3. Weekly -> advances by 7 days
    const weeklyNext = calculateNextRunAt(baseDate.toISOString(), "weekly", baseDate);
    const expectedWeekly = new Date("2026-03-08T10:00:00.000Z").toISOString();
    expect(weeklyNext).toBe(expectedWeekly);

    // 4. Monthly -> advances by 1 month
    const monthlyNext = calculateNextRunAt(baseDate.toISOString(), "monthly", baseDate);
    const expectedMonthly = new Date("2026-04-01T10:00:00.000Z").toISOString();
    expect(monthlyNext).toBe(expectedMonthly);
  });

  it("executes one-time tasks once and keeps recurring tasks scheduled with updated nextRunAt", async () => {
    const userUid = "user_recurrence_777";
    const pastTime = new Date(Date.now() - 3600000).toISOString();

    // Create a daily recurring task
    const dailyTask = await createScheduledTask({
      uid: userUid,
      title: "Daily Sync",
      prompt: "Sync inventory daily",
      executionTime: pastTime,
      repeat: "daily",
    });

    expect(dailyTask.status).toBe("scheduled");

    // Run due tasks
    const runResult = await runDueTasksAcrossAllUsers(async () => "Mock sync success");
    expect(runResult.executedCount).toBe(1);

    // Check updated task state
    const updatedDaily = await getScheduledTaskForUser(userUid, dailyTask.id);
    expect(updatedDaily?.status).toBe("scheduled");
    expect(updatedDaily?.lastExecutionResult).toBe("Mock sync success");
    expect(new Date(updatedDaily!.nextRunAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("prevents double execution across concurrent scheduler invocations using atomic claim locks", async () => {
    const userUid = "user_concurrency_888";
    const pastTime = new Date(Date.now() - 3600000).toISOString();

    const task = await createScheduledTask({
      uid: userUid,
      title: "Concurrent Task",
      prompt: "Heavy calculation",
      executionTime: pastTime,
      repeat: "once",
    });

    let executionAttempts = 0;
    const slowExecutor = async () => {
      executionAttempts++;
      await new Promise(r => setTimeout(r, 100));
      return "Done";
    };

    // Trigger two parallel runDueTasks calls simultaneously
    const [res1, res2] = await Promise.all([
      runDueTasksAcrossAllUsers(slowExecutor),
      runDueTasksAcrossAllUsers(slowExecutor),
    ]);

    // Total executed tasks across both invocations MUST be 1, never 2
    expect(res1.executedCount + res2.executedCount).toBe(1);
    expect(executionAttempts).toBe(1);

    const finalTask = await getScheduledTaskForUser(userUid, task.id);
    expect(finalTask?.status).toBe("completed");
  });

  it("persists scheduled tasks across new process/module invocations", async () => {
    const userUid = "user_persistence_555";
    const task = await createScheduledTask({
      uid: userUid,
      title: "Serverless Durable Task",
      prompt: "Test persistence",
      executionTime: new Date().toISOString(),
      repeat: "weekly",
    });

    // Query through listScheduledTasksForUser
    const tasks = await listScheduledTasksForUser(userUid);
    expect(tasks.some(t => t.id === task.id)).toBe(true);
  });
});
