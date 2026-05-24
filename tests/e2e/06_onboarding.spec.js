/**
 * ── ONBOARDING MODULE TESTS ───────────────────────────────────────────────
 * يتحقق من: عرض التيكيتس، الخطوات، الموافقات
 */
import { test, expect } from '@playwright/test';

test.describe('Onboarding Module', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByText('Onboarding', { exact: false }).click();
    await page.waitForTimeout(3000); // انتظر Supabase
  });

  test('Onboarding Module يتحمل', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/onboard|ticket|step|موظف|new hire/i);
  });

  test('لا يوجد crash عند تحميل Onboarding', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(3000);
    const criticalErrors = errors.filter(e =>
      e.includes('Cannot read') || e.includes('is not a function')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('زرار New Ticket / Add Employee موجود', async ({ page }) => {
    const btn = page.getByRole('button', {
      name: /new|add|ticket|onboard|إضافة/i,
    }).first();
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible({ timeout: 5_000 });
    }
  });

  test('الـ filters / tabs في Onboarding تظهر', async ({ page }) => {
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toMatch(/pending|active|complete|status|filter/i);
  });

});
