/**
 * ── NAVIGATION TESTS ──────────────────────────────────────────────────────
 * يتحقق من: تحميل الأبليكيشن، الـ sidebar، والتنقل بين الموديولات
 * ملاحظة: الـ sidebar يبدأ مغلق (icons فقط) - نفتحه قبل النقر
 */
import { test, expect } from '@playwright/test';

// Helper: افتح الـ sidebar
async function openSidebar(page) {
  // زرار الـ toggle في أسفل الـ sidebar
  const toggle = page.locator('.fe-toggle-btn').first();
  if (await toggle.count() > 0) {
    await toggle.click();
    await page.waitForTimeout(400); // انتظر animation
  }
}

test.describe('Navigation & App Load', () => {

  test('الأبليكيشن يتحمل بدون أخطاء', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // التأكد من الـ topbar (دايماً ظاهر)
    await expect(page.locator('.fe-topbar h1')).toBeVisible({ timeout: 15_000 });
  });

  test('الـ sidebar يظهر بالموديولات الصحيحة', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await openSidebar(page);

    // بعد فتح الـ sidebar تظهر النصوص
    const navLabels = ['Employees', 'Clients', 'Partners', 'Finance', 'Analytics', 'Settings'];
    for (const label of navLabels) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('Action Center يُحمَّل كافتراضي', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // الـ topbar يعرض labels[nav] — عند nav='action' يعرض "⚡ Action Center"
    const topbarTitle = page.locator('.fe-topbar h1');
    await expect(topbarTitle).toContainText('Action Center', { timeout: 10_000 });
  });

  test('التنقل لـ Employees يعمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await openSidebar(page);
    await page.getByText('Employees', { exact: true }).first().click();
    await expect(page.locator('.fe-topbar h1')).toContainText('Workforce', { timeout: 8_000 });
  });

  test('التنقل لـ Finance يعمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await openSidebar(page);
    await page.getByText('Finance', { exact: true }).first().click();
    await expect(page.locator('.fe-topbar h1')).toContainText('Finance', { timeout: 8_000 });
  });

  test('التنقل لـ Analytics يعمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await openSidebar(page);
    await page.getByText('Analytics', { exact: true }).first().click();
    await expect(page.locator('.fe-topbar h1')).toContainText('Analytics', { timeout: 8_000 });
  });

  test('التنقل لـ Settings يعمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await openSidebar(page);
    await page.getByText('Settings', { exact: true }).first().click();
    await expect(page.locator('.fe-topbar h1')).toContainText('Settings', { timeout: 8_000 });
  });

  test('localStorage يحفظ آخر صفحة', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await openSidebar(page);
    await page.getByText('Finance', { exact: true }).first().click();
    await page.waitForTimeout(500);
    const savedNav = await page.evaluate(() => localStorage.getItem('fisheye_nav'));
    expect(savedNav).toBe('finance');
  });

  test('إعادة تحميل الصفحة تعيدك لنفس الموديول', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // تعيين الـ nav مباشرة عبر localStorage
    await page.evaluate(() => localStorage.setItem('fisheye_nav', 'finance'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.fe-topbar h1')).toContainText('Finance', { timeout: 8_000 });
  });

});
