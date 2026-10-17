export const WEEKLY_CREDIT_GRANT = 2500;
export const WEEKLY_CREDIT_TIME_ZONE = "Etc/UTC";
export const WEEKLY_CREDIT_SCHEDULE = "0 0 * * 1";
const MAX_BATCH_WRITES = 450;

/** Returns the Monday date that anchors the ISO week, calculated in UTC. */
export function getUtcWeekKey(now = new Date()) {
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

/**
 * Reset each existing users/{uid}/private/account document exactly once per UTC week.
 * Stable document-ID pagination allows balances to change without moving the cursor.
 */
export async function resetWeeklyCreditAccounts(
  db,
  {
    now = new Date(),
    weekKey = getUtcWeekKey(now),
    pageSize = MAX_BATCH_WRITES,
    documentIdFieldPath = "__name__",
  } = {}
) {
  const safePageSize = Math.min(
    MAX_BATCH_WRITES,
    Math.max(1, Math.floor(pageSize))
  );
  const updatedAt = now.toISOString();
  let cursor = undefined;
  let scannedDocuments = 0;
  let resetAccounts = 0;
  let committedBatches = 0;

  while (true) {
    let page = db
      .collectionGroup("private")
      .orderBy(documentIdFieldPath)
      .limit(safePageSize);
    if (cursor) page = page.startAfter(cursor);

    const snapshot = await page.get();
    if (snapshot.empty) break;

    scannedDocuments += snapshot.size;
    const batch = db.batch();
    let writesInBatch = 0;

    for (const accountDocument of snapshot.docs) {
      if (accountDocument.id !== "account") continue;
      const account = accountDocument.data();
      if (account.weeklyCreditWeek === weekKey) continue;

      batch.update(accountDocument.ref, {
        weeklyCreditBalance: WEEKLY_CREDIT_GRANT,
        weeklyCreditWeek: weekKey,
        weeklyCreditsUpdatedAt: updatedAt,
      });
      writesInBatch += 1;
      resetAccounts += 1;
    }

    if (writesInBatch > 0) {
      await batch.commit();
      committedBatches += 1;
    }

    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < safePageSize) break;
  }

  return {
    weekKey,
    scannedDocuments,
    resetAccounts,
    committedBatches,
  };
}
