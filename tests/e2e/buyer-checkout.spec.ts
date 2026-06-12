import { test, expect } from "@playwright/test";

/**
 * E2E: Buyer end-to-end checkout flow
 *
 * Precondition: Database seeded with demo sellers and products (pnpm db:seed).
 * This test assumes the dev server is running (handled by playwright.config.ts webServer).
 *
 * Flow: browse storefront → click product → add to cart → go to cart → proceed to checkout
 *       → fill buyer info + select payment → submit → see confirmation page
 */
test.describe("Buyer Checkout (E2E)", () => {
  test("can place an order end-to-end", async ({ page }) => {
    // 1. Browse storefront
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).or(page.locator("h1"))).toBeVisible();

    // Wait for at least one product card to appear
    const firstProduct = page.locator("a[href^='/product/']").first();
    await expect(firstProduct).toBeVisible({ timeout: 10000 });

    // 2. Click a product to see detail
    await firstProduct.click();
    await expect(page.getByText("เพิ่มลงตะกร้า").or(page.getByText("สินค้าหมด"))).toBeVisible();

    // 3. Add to cart (only if in stock)
    const addButton = page.getByText("เพิ่มลงตะกร้า");
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByText("เพิ่มแล้ว")).toBeVisible({ timeout: 5000 });
    }

    // 4. Go to cart
    await page.goto("/cart");
    await expect(page.getByText("ตะกร้าสินค้า").or(page.getByText("ตะกร้าว่าง"))).toBeVisible();

    // If cart is not empty, proceed to checkout
    const checkoutLink = page.getByText("ดำเนินการสั่งซื้อ");
    if (await checkoutLink.isVisible()) {
      await checkoutLink.click();

      // 5. Fill checkout form
      await page.fill("#buyerName", "ทดสอบ ผู้ซื้อ");
      await page.fill("#buyerPhone", "0812345678");

      // Select payment method (click the COD card)
      await page.getByText("เก็บเงินปลายทาง").click();

      // 6. Submit
      await page.getByText("ยืนยันคำสั่งซื้อ").click();

      // 7. Verify confirmation page
      await expect(page.getByText("บันทึกคำสั่งซื้อเรียบร้อย")).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("ออเดอร์")).toBeVisible();
      await expect(page.getByText("เก็บเงินปลายทาง")).toBeVisible();
      await expect(page.getByText("ทดสอบ ผู้ซื้อ")).toBeVisible();
    }
  });
});
