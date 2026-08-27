import { describe, expect, it } from "vitest";
import handler from "./index";

describe("Vercel API entrypoint", () => {
  it("exports an Express-compatible request handler without opening a listener", () => {
    expect(typeof handler).toBe("function");
    expect((handler as any).listen).toBeTypeOf("function");
  });
});
