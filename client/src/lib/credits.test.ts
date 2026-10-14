// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import {
  getUserCredits,
  getUtcWeekKey,
  millisecondsUntilNextUtcWeek,
  setCreditAccountUser,
  WEEKLY_CREDIT_GRANT,
} from "./credits";

afterEach(() => {
  localStorage.clear();
  setCreditAccountUser(null);
});

describe("weekly account credits", () => {
  it("uses Monday 00:00 UTC as the start of a credit week", () => {
    expect(getUtcWeekKey(new Date("2026-10-18T23:59:59.999Z"))).toBe(
      "2026-10-12"
    );
    expect(getUtcWeekKey(new Date("2026-10-19T00:00:00.000Z"))).toBe(
      "2026-10-19"
    );
    expect(getUtcWeekKey(new Date("2021-01-01T12:00:00.000Z"))).toBe(
      "2020-12-28"
    );
  });

  it("computes the next UTC Monday boundary, independent of locale", () => {
    expect(
      millisecondsUntilNextUtcWeek(new Date("2026-10-18T23:59:59.999Z"))
    ).toBe(1);
    expect(
      millisecondsUntilNextUtcWeek(new Date("2026-10-19T00:00:00.000Z"))
    ).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("keeps cached balances isolated by signed-in Firebase UID", () => {
    localStorage.setItem("hanna_user_credits:uid-a", "1200");
    localStorage.setItem("hanna_user_credits:uid-b", "2300");
    setCreditAccountUser("uid-a");
    expect(getUserCredits()).toBe(1200);
    setCreditAccountUser("uid-b");
    expect(getUserCredits()).toBe(2300);
    setCreditAccountUser("new-device-user");
    expect(getUserCredits()).toBe(WEEKLY_CREDIT_GRANT);
  });
});
