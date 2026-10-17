import { getApps, initializeApp } from "firebase-admin/app";
import { FieldPath, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  getUtcWeekKey,
  resetWeeklyCreditAccounts,
  WEEKLY_CREDIT_GRANT,
  WEEKLY_CREDIT_SCHEDULE,
  WEEKLY_CREDIT_TIME_ZONE,
} from "./weeklyCredits.js";

if (getApps().length === 0) initializeApp();
const db = getFirestore();

export const resetWeeklyCredits = onSchedule(
  {
    schedule: WEEKLY_CREDIT_SCHEDULE,
    timeZone: WEEKLY_CREDIT_TIME_ZONE,
    region: "us-central1",
    timeoutSeconds: 540,
    memory: "512MiB",
    retryCount: 3,
  },
  async () => {
    const weekKey = getUtcWeekKey(new Date());
    const result = await resetWeeklyCreditAccounts(db, {
      weekKey,
      documentIdFieldPath: FieldPath.documentId(),
    });
    logger.info("Weekly credit reset completed", {
      ...result,
      grant: WEEKLY_CREDIT_GRANT,
      timeZone: WEEKLY_CREDIT_TIME_ZONE,
    });
  }
);
