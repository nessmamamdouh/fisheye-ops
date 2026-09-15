/**
 * ── NAVIGATION TESTS ──────────────────────────────────────────────────────
 * يتحقق من: تحميل الأبليكيشن، الـ sidebar، والتنقل بين الموديولات
 * ملاحظة: الـ sidebar يبدأ مغلق (icons فقط) - نفتحه قبل النقر
 */
import { test, expect } from '@playwright/test';

// ملاحظة: الـ sidebar يبدأ مفتوح useState(true) — مش محتاجين نفتحه
// لو اتقفل، نفتحه تاني
async function ensureSidebarOpen(page) {
  await page.waitForTimeout(300);
  // نتحقق إن النص ظاهر - لو لأ، نضغط Toggle
  const empVisible = await page.getByText('Employees', { exact: true }).first().isVisible().catch(() => false);
  if (!empVisible) {
    const toggle = page.locator('.fe-toggle-btn').first();
    if (await toggle.count() > 0) {
      await toggle.click();
      await page.waitForTimeout(400);
    }
  }
}

test.describe('Navigation & App Load', () => {

  test('الأبليكيشن يتحمل بدون أخطاء', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // التأكد من الـ topbar (دايماً ظاهر) — ملاحظة: عنصر <h1> جوه الـ topbar
    // مش موجود لكل الموديولات (Action Center/Finance/Analytics/... بتعرض
    // عنوانها الخاص جوه المحتوى نفسه بدل الـ topbar)، فبنتحقق من الـ topbar
    // container نفسه بدل ما نفترض وجود h1 فيه.
    await expect(page.locator('.fe-topbar')).toBeVisible({ timeout: 15_000 });
  });

  test('الـ sidebar يظهر بالموديولات الصحيحة', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await ensureSidebarOpen(page);

    // بعد فتح الـ sidebar تظهر النصوص
    const navLabels = ['Employees', 'Clients', 'Partners', 'Finance', 'Analytics', 'Settings'];
    for (const label of navLabels) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('Action Center يُحمَّل كافتراضي', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Action Center بيعرض عنوانه كـ <h1> جوه محتواه نفسه (ActionCenterV2.jsx)،
    // مش جوه .fe-topbar (App.jsx بيسيب الـ topbar من غير h1 لما nav==='action').
    await expect(page.getByRole('heading', { name: 'Action Center', exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('التنقل لـ Employees يعمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await ensureSidebarOpen(page);
    await page.getByText('Employees', { exact: true }).first().click();
    await expect(page.locator('.fe-topbar h1')).toContainText('Workforce', { timeout: 8_000 });
  });

  test('التنقل لـ Finance يعمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await ensureSidebarOpen(page);
    await page.getByText('Finance', { exact: true }).first().click();
    // Finance بيعرض عنوانه كـ <h1> جوه FinanceModule.jsx نفسه، مش جوه .fe-topbar
    await expect(page.getByRole('heading', { name: 'Finance', exact: true }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('التنقل لـ Analytics يعمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await ensureSidebarOpen(page);
    await page.getByText('Analytics', { exact: true }).first().click();
    // Analytics بيعرض عنوانه كـ <h1> جوه Analyticsdashboard.jsx نفسه، مش جوه .fe-topbar
    await expect(page.getByRole('heading', { name: /Analytics/i }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('التنقل لـ Settings يعمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await ensureSidebarOpen(page);
    await page.getByText('Settings', { exact: true }).first().click();
    await expect(page.locator('.fe-topbar h1')).toContainText('Settings', { timeout: 8_000 });
  });

  test('localStorage يحفظ آخر صفحة', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await ensureSidebarOpen(page);
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
    // Finance بيعرض عنوانه كـ <h1> جوه محتواه نفسه، مش جوه .fe-topbar
    await expect(page.getByRole('heading', { name: 'Finance', exact: true }).first()).toBeVisible({ timeout: 8_000 });
  });

});
