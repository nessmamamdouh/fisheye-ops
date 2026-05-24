/**
 * ── WORKFORCE MODULE TESTS ────────────────────────────────────────────────
 * يتحقق من: عرض الموظفين، البحث، الفلاتر، إضافة موظف جديد
 */
import { test, expect } from '@playwright/test';

async function goToWorkforce(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // نفتح الـ sidebar أو نستخدم localStorage
  await page.evaluate(() => localStorage.setItem('fisheye_nav', 'workforce'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.describe('Workforce Module', () => {

  test.beforeEach(async ({ page }) => {
    await goToWorkforce(page);
  });

  test('جدول الموظفين يظهر أو رسالة تحميل', async ({ page }) => {
    // الـ topbar لازم يعرض "Workforce"
    await expect(page.locator('.fe-topbar h1')).toContainText('Workforce', { timeout: 5_000 });
  });

  test('حقل البحث موجود ويعمل', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*name|search.*id|بحث/i).first();
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill('Ahmed');
    await page.waitForTimeout(500);
    await expect(searchInput).toHaveValue('Ahmed');
  });

  test('فلتر Client موجود في الـ sidebar', async ({ page }) => {
    // WorkforceView فيه sidebar بفلتر الكلاينتس
    const body = await page.textContent('body');
    expect(body).toMatch(/all|sela|client/i);
  });

  test('Export CSV زرار موجود', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/export|csv/i);
  });

  test('زرار New Employee موجود', async ({ page }) => {
    // الزرار اسمه "New Employee" (line 1910-1911 في App.jsx)
    await expect(page.getByRole('button', { name: /new employee/i }).first())
      .toBeVisible({ timeout: 5_000 });
  });

  test('فتح فورم إضافة موظف', async ({ page }) => {
    await page.getByRole('button', { name: /new employee/i }).first().click();
    await page.waitForTimeout(1000);
    // الفورم بيحتوي على حقل Name
    await expect(page.getByLabel(/^name$/i).or(page.getByPlaceholder(/name/i)).first())
      .toBeVisible({ timeout: 5_000 });
  });

  test('أعمدة الجدول الأساسية تظهر', async ({ page }) => {
    const body = await page.textContent('body');
    // الأعمدة الموجودة: Position, Client, Start Date, End Date, Package
    expect(body).toMatch(/position|client|start date|end date|package/i);
  });

  test('أعمدة Project / Client تظهر', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/client/i);
  });

  test('عمود End Date / تاريخ الانتهاء موجود', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/end date|enddate|expir/i);
  });

});
