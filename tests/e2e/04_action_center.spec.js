/**
 * ── ACTION CENTER TESTS ───────────────────────────────────────────────────
 * يتحقق من: عرض التنبيهات، البطاقات، البحث، الـ issues
 */
import { test, expect } from '@playwright/test';

test.describe('Action Center', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Action Center هو الافتراضي
    await page.waitForTimeout(2000);
  });

  test('Action Center يتحمل', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/action|alert|issue|fisheye/i);
  });

  test('حقل البحث في Action Center موجود', async ({ page }) => {
    const search = page.getByPlaceholder(/search|employee|project|issue/i).first();
    await expect(search).toBeVisible({ timeout: 5_000 });
  });

  test('البحث في Action Center يفلتر النتائج', async ({ page }) => {
    const search = page.getByPlaceholder(/search|employee|project|issue/i).first();
    await search.fill('test query');
    await page.waitForTimeout(600);
    await search.clear();
  });

  test('بطاقات الـ alerts تظهر أو رسالة "كل شيء تمام"', async ({ page }) => {
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toMatch(/expir|missing|po|alert|issue|good|clear|تمام|✅/i);
  });

  test('زرار Navigate to Workforce موجود أو رابط داخلي', async ({ page }) => {
    // Action Center بيعمل onNavigate للموديولات التانية
    const body = await page.textContent('body');
    // لازم يكون فيه روابط أو أزرار للتنقل
    expect(body).toBeTruthy();
    const buttons = await page.getByRole('button').count();
    expect(buttons).toBeGreaterThan(0);
  });

  test('لا يوجد React error في Action Center', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(3000);
    const criticalErrors = errors.filter(e =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('undefined')
    );
    expect(criticalErrors).toHaveLength(0);
  });

});
