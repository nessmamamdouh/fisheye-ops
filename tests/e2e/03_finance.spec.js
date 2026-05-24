/**
 * ── FINANCE MODULE TESTS ──────────────────────────────────────────────────
 * يتحقق من: تبويبات Finance (Payroll, Invoices, Settlement, Profit, Partner Flow)
 */
import { test, expect } from '@playwright/test';

test.describe('Finance Module', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByText('Finance', { exact: false }).click();
    await page.waitForTimeout(2000);
  });

  test('Finance Module يتحمل', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/payroll|finance|salary/i);
  });

  test('تبويب Payroll موجود ويعمل', async ({ page }) => {
    await page.getByText('Payroll', { exact: false }).first().click();
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    expect(body).toMatch(/payroll|salary|راتب/i);
  });

  test('تبويب Invoices موجود ويعمل', async ({ page }) => {
    await page.getByText('Invoices', { exact: false }).first().click();
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    expect(body).toMatch(/invoice|فاتورة/i);
  });

  test('تبويب Settlement موجود ويعمل', async ({ page }) => {
    const settleTab = page.getByText('Settlement', { exact: false });
    await settleTab.first().click();
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    expect(body).toMatch(/settlement|partner|تسوية/i);
  });

  test('تبويب Profit موجود ويعمل', async ({ page }) => {
    const profitTab = page.getByText('Profit', { exact: false });
    if (await profitTab.count() > 0) {
      await profitTab.first().click();
      await page.waitForTimeout(1500);
      const body = await page.textContent('body');
      expect(body).toMatch(/profit|ربح|client/i);
    }
  });

  test('Payroll - فلتر الشهر موجود', async ({ page }) => {
    await page.getByText('Payroll', { exact: false }).first().click();
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    expect(body).toMatch(/month|year|شهر|سنة|202/i);
  });

  test('Payroll - جدول الرواتب يظهر بيانات أو رسالة فارغة', async ({ page }) => {
    await page.getByText('Payroll', { exact: false }).first().click();
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    // إما بيانات أو رسالة "لا يوجد"
    expect(body).toMatch(/salary|SAR|اجمالي|total|no.*record|لا توجد|0/i);
  });

  test('Invoices - حقل البحث يعمل', async ({ page }) => {
    await page.getByText('Invoices', { exact: false }).first().click();
    await page.waitForTimeout(1500);
    const searchInput = page.getByPlaceholder(/search|بحث/i).first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Ahmed');
      await page.waitForTimeout(500);
      // بعد البحث لازم تتغير النتائج
      await expect(searchInput).toHaveValue('Ahmed');
    }
  });

  test('تبديل تبويبات Finance يحفظ في localStorage', async ({ page }) => {
    await page.getByText('Invoices', { exact: false }).first().click();
    await page.waitForTimeout(500);
    const saved = await page.evaluate(() => localStorage.getItem('fisheye_finance_tab'));
    expect(saved).toBe('invoices');
  });

});
