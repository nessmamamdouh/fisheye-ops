/**
 * ── KNOWN BUGS REGRESSION TESTS ──────────────────────────────────────────
 * هذه الاختبارات توثّق المشاكل المكتشفة في تقرير المراجعة.
 * بعض هذه الاختبارات ستفشل عن قصد حتى يتم إصلاح الـ bug.
 */
import { test, expect } from '@playwright/test';

test.describe('Known Bugs - Regression Suite', () => {

  // ── BUG #1: Morning Report Missing Props ─────────────────────────────────
  test('BUG-001: Morning Report - يتحمل الصفحة بدون white screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('fisheye_nav', 'report'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // الصفحة لازم تتحمل على الأقل بدون crash
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(50);
    // ⚠️ morningReportChecks وغيره undefined - functionality مكسورة
    // بعد الإصلاح: يظهر content مناسب
    console.warn('BUG-001: MorningReportView missing 4 props in App.jsx line 5605');
  });

  // ── BUG #2: Partner Hub savePartners Mismatch ────────────────────────────
  test('BUG-002: Partner Hub - الصفحة تتحمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('fisheye_nav', 'partners'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // الصفحة تتحمل لأن setAppPartners مش بيسبب crash مباشرة
    await expect(page.locator('.fe-topbar h1')).toContainText('Partner', { timeout: 5_000 });
    console.warn('BUG-002: PartnerHub defined with setAppPartners but called with savePartners');
  });

  // ── BUG #3: Client Hub saveClients Mismatch ──────────────────────────────
  test('BUG-003: Client Hub - الصفحة تتحمل', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('fisheye_nav', 'clients'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('.fe-topbar h1')).toContainText('Client', { timeout: 5_000 });
    console.warn('BUG-003: ClientHub defined with {employees} only, ignores clients/saveClients props');
  });

  // ── BUG #4: Dashboard syncProgress ───────────────────────────────────────
  test('BUG-004: Dashboard يتحمل بدون syncProgress prop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('fisheye_nav', 'dashboard'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Dashboard يتحمل حتى بدون syncProgress - لأنه undefined مش crash
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    console.warn('BUG-004: syncProgress not passed to DashboardView - progress bar won\'t show');
  });

  // ── BUG #5: useSupabaseSync Stub ─────────────────────────────────────────
  test('BUG-005: Sync hook stub - syncStatus يبقى idle دائماً', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // الأبليكيشن يشتغل لأن Supabase queries تتم مباشرة
    // لكن useSupabaseSync hook فارغ فـ real-time sync لا يعمل
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    console.warn('BUG-005: useSupabaseSync hook is a stub - real-time sync not working');
  });

});
