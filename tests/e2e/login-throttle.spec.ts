import { test, expect } from "@playwright/test";

/**
 * E2E: Login throttle — 5 failed attempts blocks the 6th.
 * Precondition: DB seeded with demo seller.
 */
test.describe("Login Throttle (E2E)", () => {
  test("blocks login after 5 consecutive failures within 15 minutes", async ({ page }) => {
    await page.goto("/login");

    // Submit 5 wrong passwords
    for (let i = 0; i < 5; i++) {
      await page.fill("#username", "demo");
      await page.fill("#password", "wrong-password");
      await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

      // Wait for error message to appear
      await expect(
        page.getByText("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"),
      ).toBeVisible({ timeout: 5000 });
    }

    // 6th attempt — should show throttle message instead of generic error
    await page.fill("#username", "demo");
    await page.fill("#password", "wrong-password");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(
      page.getByText("พยายามเข้าสู่ระบบบ่อยเกินไป"),
    ).toBeVisible({ timeout: 5000 });
  });
});
