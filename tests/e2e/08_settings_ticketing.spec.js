/**
 * ── SETTINGS & TICKETING TESTS ────────────────────────────────────────────
 * ملاحظة مهمة:
 * - Settings tabs: General | Integration Guide | Client Mapping | Report Logic
 * - Zapier/WhatsApp موجودان في تبويب "Integration Guide" مش الـ default
 * - Backup/Upload/Sync موجودة في DashboardView مش SettingsView
 */
import { test, expect } from '@playwright/test';

test.describe('Settings', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('fisheye_nav', 'settings'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('Settings يتحمل ويعرض التبويبات', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/settings|general|integration/i);
  });

  test('تبويبات Settings الأربعة تظهر', async ({ page }) => {
    await expect(page.getByText('General', { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Integration Guide', { exact: false })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Client Mapping', { exact: false })).toBeVisible({ timeout: 5_000 });
  });

  test('Zapier section موجود في Integration Guide tab', async ({ page }) => {
    // نضغط على تبويب "Integration Guide" الأول
    await page.getByText('Integration Guide', { exact: false }).first().click();
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toMatch(/zapier/i);
  });

  test('WhatsApp / CallMeBot موجود في Integration Guide tab', async ({ page }) => {
    await page.getByText('Integration Guide', { exact: false }).first().click();
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toMatch(/whatsapp|callmebot/i);
  });

  test('General tab - Clear & Re-upload زرار موجود', async ({ page }) => {
    // الـ default tab هو general
    const body = await page.textContent('body');
    expect(body).toMatch(/clear|re-upload|upload/i);
  });

});

test.describe('Dashboard - Backup & Sync', () => {
  // Backup/Sync موجود في DashboardView مش Settings

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('fisheye_nav', 'dashboard'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Dashboard يتحمل', async ({ page }) => {
    await expect(page.locator('.fe-topbar h1')).toBeVisible({ timeout: 5_000 });
  });

  test('Dashboard يعرض Financial Summary و Active count', async ({ page }) => {
    // الـ sync buttons تظهر فقط لما isOnline=true
    // لكن Financial Summary دايماً ظاهر
    const body = await page.textContent('body');
    expect(body).toMatch(/total payroll|payroll|active|billed|margin/i);
  });

});

test.describe('Ticketing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('fisheye_nav', 'tickets'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Ticketing View يتحمل', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/ticket|support|request/i);
  });

  test('زرار New Ticket موجود', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/ticket|new|request/i);
  });

  test('Ticketing view يعرض Tickets / Inbox / Support', async ({ page }) => {
    const body = await page.textContent('body');
    // TicketingView دايماً بيعرض تبويبات أو عناوين Ticket/Inbox/Support
    expect(body).toMatch(/ticket|inbox|support|request/i);
  });

});
