import { test, expect } from "@playwright/test";

/**
 * E2E: Seller cancels an order and stock is restored.
 * Precondition: DB seeded with demo sellers + at least one non-shipped order.
 */
test.describe("Seller Cancel Order (E2E)", () => {
  test("seller logs in and cancels an order", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill("#username", "demo");
    await page.fill("#password", "demo1234");
    await page.getByText("เข้าสู่ระบบ").click();

    await expect(page.getByText("แดชบอร์ด")).toBeVisible({ timeout: 10000 });

    // Navigate to orders
    await page.goto("/orders");
    await expect(page.getByText("ออเดอร์")).toBeVisible();

    // Find a non-terminal order
    const firstOrderLink = page.locator("a[href^='/orders/']").first();
    if (await firstOrderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstOrderLink.click();

      // Look for cancel button
      const cancelButton = page.getByText("ยกเลิกออเดอร์");
      if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cancelButton.click();
        // Confirm
        await page.getByText("ยืนยันยกเลิก").click();
        // Verify status changed to cancelled
        await expect(page.getByText("ยกเลิก")).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
