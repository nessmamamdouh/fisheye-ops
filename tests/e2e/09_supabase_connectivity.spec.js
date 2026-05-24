/**
 * ── SUPABASE CONNECTIVITY TESTS ──────────────────────────────────────────
 * يتحقق من: الاتصال بقاعدة البيانات وتحميل البيانات
 */
import { test, expect } from '@playwright/test';

test.describe('Supabase Connectivity', () => {

  test('البيانات تُحمَّل من Supabase عند فتح الأبليكيشن', async ({ page }) => {
    // نراقب الـ network requests
    const supabaseRequests = [];
    page.on('request', req => {
      if (req.url().includes('supabase.co')) {
        supabaseRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(supabaseRequests.length).toBeGreaterThan(0);
  });

  test('Supabase API يرد بدون 500 error', async ({ page }) => {
    const failedRequests = [];
    page.on('response', res => {
      if (res.url().includes('supabase.co') && res.status() >= 500) {
        failedRequests.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(failedRequests).toHaveLength(0);
  });

  test('الأبليكيشن يشتغل حتى بدون internet (offline graceful)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // قطع الإنترنت
    await page.context().setOffline(true);

    // التنقل لموديول
    await page.getByText('Employees', { exact: false }).click();
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    // لازم يفضل يشتغل مع localStorage data
    expect(body.length).toBeGreaterThan(100);

    // نرجع الإنترنت
    await page.context().setOffline(false);
  });

  test('employees_master table يُقرأ بنجاح', async ({ page }) => {
    const responses = [];
    page.on('response', async res => {
      if (res.url().includes('employees_master')) {
        responses.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // لو فيه request للـ employees_master يكون status 200
    const employeeReqs = responses.filter(r => r.url.includes('employees_master'));
    if (employeeReqs.length > 0) {
      expect(employeeReqs[0].status).toBe(200);
    }
  });

});
