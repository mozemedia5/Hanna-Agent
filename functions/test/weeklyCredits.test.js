import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getUtcWeekKey,
  resetWeeklyCreditAccounts,
  WEEKLY_CREDIT_GRANT,
} from "../src/weeklyCredits.js";

class FakeFirestore {
  constructor(seed) {
    this.documents = new Map(Object.entries(seed));
  }

  collectionGroup(name) {
    assert.equal(name, "private");
    return new FakeQuery(this);
  }

  batch() {
    const updates = [];
    return {
      update: (ref, data) => updates.push({ path: ref.path, data }),
      commit: async () => {
        for (const { path, data } of updates) {
          this.documents.set(path, { ...this.documents.get(path), ...data });
        }
      },
    };
  }
}

class FakeQuery {
  constructor(db, cursor = "", pageSize = 500) {
    this.db = db;
    this.cursor = cursor;
    this.pageSize = pageSize;
  }

  orderBy() {
    return this;
  }
  limit(count) {
    return new FakeQuery(this.db, this.cursor, count);
  }
  startAfter(document) {
    return new FakeQuery(this.db, document.ref.path, this.pageSize);
  }

  async get() {
    const docs = [...this.db.documents.entries()]
      .filter(([path]) => path.includes("/private/"))
      .sort(([left], [right]) => left.localeCompare(right))
      .filter(([path]) => path > this.cursor)
      .slice(0, this.pageSize)
      .map(([path, data]) => ({
        id: path.split("/").at(-1),
        ref: { path },
        data: () => data,
      }));
    return { docs, size: docs.length, empty: docs.length === 0 };
  }
}

describe("weekly credit Cloud Function helper", () => {
  it("calculates the Monday ISO-week key from UTC, not local time", () => {
    assert.equal(
      getUtcWeekKey(new Date("2026-10-18T23:59:59.999Z")),
      "2026-10-12"
    );
    assert.equal(
      getUtcWeekKey(new Date("2026-10-19T00:00:00.000Z")),
      "2026-10-19"
    );
    assert.equal(
      getUtcWeekKey(new Date("2021-01-01T12:00:00.000Z")),
      "2020-12-28"
    );
  });

  it("resets old and uninitialized account docs in bounded pages, preserving current-week balances", async () => {
    const db = new FakeFirestore({
      "users/user-a/private/account": {
        weeklyCreditBalance: 14,
        weeklyCreditWeek: "2026-10-12",
      },
      "users/user-a/private/profile": { displayName: "A" },
      "users/user-b/private/account": {
        weeklyCreditBalance: 900,
        weeklyCreditWeek: "2026-10-19",
      },
      "users/user-c/private/account": { weeklyCreditBalance: 71 },
    });
    const now = new Date("2026-10-19T00:00:05.000Z");

    const result = await resetWeeklyCreditAccounts(db, { now, pageSize: 2 });
    assert.equal(result.weekKey, "2026-10-19");
    assert.equal(result.scannedDocuments, 4);
    assert.equal(result.resetAccounts, 2);
    assert.equal(result.committedBatches, 2);
    assert.equal(
      db.documents.get("users/user-a/private/account").weeklyCreditBalance,
      WEEKLY_CREDIT_GRANT
    );
    assert.equal(
      db.documents.get("users/user-a/private/account").weeklyCreditWeek,
      "2026-10-19"
    );
    assert.equal(
      db.documents.get("users/user-b/private/account").weeklyCreditBalance,
      900
    );
    assert.equal(
      db.documents.get("users/user-c/private/account").weeklyCreditBalance,
      WEEKLY_CREDIT_GRANT
    );
    assert.deepEqual(db.documents.get("users/user-a/private/profile"), {
      displayName: "A",
    });

    // A duplicate run in the same week must not refill credits already spent after reset.
    db.documents.get("users/user-a/private/account").weeklyCreditBalance = 2460;
    const duplicate = await resetWeeklyCreditAccounts(db, { now, pageSize: 2 });
    assert.equal(duplicate.resetAccounts, 0);
    assert.equal(
      db.documents.get("users/user-a/private/account").weeklyCreditBalance,
      2460
    );
  });
});
