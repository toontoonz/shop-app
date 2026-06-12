import { describe, it, expect, beforeEach } from "vitest";
import { LoginThrottle } from "@/modules/seller-account-catalog";
import { db } from "@/lib/db";

describe("LoginThrottle (integration)", () => {
  beforeEach(async () => {
    await db.failedLogin.deleteMany();
  });

  it("is not blocked with 0 failures", async () => {
    expect(await LoginThrottle.isBlocked("user1")).toBe(false);
  });

  it("is not blocked with fewer than 5 failures", async () => {
    for (let i = 0; i < 4; i++) {
      await LoginThrottle.recordFailure("user1");
    }
    expect(await LoginThrottle.isBlocked("user1")).toBe(false);
  });

  it("is blocked after 5 failures within 15 minutes", async () => {
    for (let i = 0; i < 5; i++) {
      await LoginThrottle.recordFailure("user1");
    }
    expect(await LoginThrottle.isBlocked("user1")).toBe(true);
  });

  it("blocks only the affected username", async () => {
    for (let i = 0; i < 5; i++) {
      await LoginThrottle.recordFailure("blocked-user");
    }
    expect(await LoginThrottle.isBlocked("blocked-user")).toBe(true);
    expect(await LoginThrottle.isBlocked("unblocked-user")).toBe(false);
  });

  it("clear removes recent failures and unblocks", async () => {
    for (let i = 0; i < 5; i++) {
      await LoginThrottle.recordFailure("user1");
    }
    expect(await LoginThrottle.isBlocked("user1")).toBe(true);

    await LoginThrottle.clear("user1");
    expect(await LoginThrottle.isBlocked("user1")).toBe(false);
  });
});
