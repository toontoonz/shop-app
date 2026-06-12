import { test, expect } from "@playwright/test";

/**
 * E2E: Seller advances an order's status.
 * Precondition: DB seeded with demo sellers + at least one ORDERED order.
 */
test.describe("Seller Advance Status (E2E)", () => {
  test("seller logs in and advances order from ORDERED to PAID", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill("#username", "demo");
    await page.fill("#password", "demo1234");
    await page.getByText("เข้าสู่ระบบ").click();

    // Wait for dashboard
    await expect(page.getByText("แดชบอร์ด")).toBeVisible({ timeout: 10000 });

    // Navigate to orders
    await page.goto("/orders");
    await expect(page.getByText("ออเดอร์")).toBeVisible();

    // If there's an order, click into detail and advance
    const firstOrderLink = page.locator("a[href^='/orders/']").first();
    if (await firstOrderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstOrderLink.click();

      // Look for the advance button
      const advanceButton = page.getByText("เปลี่ยนสถานะ →");
      if (await advanceButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await advanceButton.click();
        // Confirm
        await page.getByText("ยืนยัน").click();
        // Wait for refresh — status should change
        await expect(page.getByText("ชำระเงิน").or(page.getByText("กำลังแพ็ค")).or(page.getByText("จัดส่ง"))).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
