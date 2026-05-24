/**
 * Shared helpers for Fisheye Ops Pro E2E tests
 */

/** انتظر حتى يختفي الـ loading spinner (لو موجود) */
export async function waitForLoad(page) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

/** اضغط على nav item بالـ key بتاعه */
export async function goTo(page, navKey) {
  // الـ nav items بتخزن في localStorage وبتظهر في الـ sidebar
  await page.evaluate((key) => {
    localStorage.setItem('fisheye_nav', key);
  }, navKey);
  await page.reload();
  await waitForLoad(page);
}

/** تحقق إن الصفحة اتحملت وفيها content */
export async function expectPageLoaded(page) {
  await page.waitForSelector('body', { state: 'visible' });
  // تأكد مفيش خطأ React crash
  const body = await page.textContent('body');
  expect(body).not.toContain('Cannot read properties of undefined');
  expect(body).not.toContain('TypeError');
}
