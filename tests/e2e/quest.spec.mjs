import { test, expect } from '@playwright/test';

const key = 'nq.pack_offline-demo.v1';
async function finish(page, { wrong = false, attempt = 'SYNTHETIC-PRIVATE-ATTEMPT' } = {}) {
  await page.getByRole('button', { name: wrong ? 'Book' : 'Water', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  // Add and remove a distractor before building the true sentence.
  await page.locator('.tokens [data-token-id="book"]').click();
  await page.locator('.answer button').click();
  for (const id of ['water', 'object', 'please']) await page.locator(`.tokens [data-token-id="${id}"]`).click();
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: /ありがとうございます/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your attempt (not saved)' }).fill(attempt);
  await page.getByRole('button', { name: 'Show model answer', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Just right', exact: true }).click();
}
test('complete, reload, replay, reset; no outgoing requests or saved attempts', async ({ page, context }) => {
  const requests = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', route => {
    const url = route.request().url(); requests.push(url);
    return new URL(url).origin === 'http://127.0.0.1:4179' ? route.continue() : route.abort();
  });
  await page.goto('/');
  await page.screenshot({ path: 'test-results/demo-home.png', fullPage: true });
  await expect(page.getByRole('button', { name: 'Start day 2' })).toBeDisabled();
  await page.getByRole('button', { name: 'Start day 1' }).click();
  await finish(page, { wrong: true });
  await expect(page.getByText('2/3 correct', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/demo-complete.png', fullPage: true });
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(stored).not.toContain('SYNTHETIC-PRIVATE-ATTEMPT');
  await page.reload();
  await expect(page.getByText('Complete · 2/3 · appropriate')).toBeVisible();
  await page.getByRole('button', { name: 'Replay day 1' }).click();
  await finish(page);
  await expect(page.getByText('3/3 correct', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to days' }).click();
  await page.getByRole('button', { name: 'Reset demo progress' }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replay day 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo progress' }).click();
  await page.getByRole('button', { name: 'Yes, reset', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start day 1' })).toBeVisible();
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:4179')).toBe(true);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('second day unlocks at local midnight and can be completed', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-08-01T14:59:00.000Z') });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start day 2' })).toBeDisabled();
  await page.clock.fastForward(120_000);
  await expect(page.getByRole('button', { name: 'Start day 2' })).toBeEnabled();
  await page.getByRole('button', { name: 'Start day 2' }).click();
  await finish(page);
  await expect(page.getByRole('heading', { name: 'Day 2 complete' })).toBeVisible();
});
test('storage-denied browser still completes and warns about persistence', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('synthetic denial'); } }));
  await page.goto('/');
  await expect(page.getByText(/Session only:/)).toBeVisible();
  await page.getByRole('button', { name: 'Start day 1' }).click();
  await finish(page);
  await expect(page.getByText('3/3 correct', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to days' }).click();
  await expect(page.getByRole('button', { name: 'Replay day 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo progress' }).click();
  await page.getByRole('button', { name: 'Yes, reset' }).click();
  await expect(page.getByText(/Reset for this session only/)).toBeVisible();
});
test('corrupted or future progress stays untouched until reset', async ({ page }) => {
  await page.goto('/');
  const corrupt = '{"v":99,"synthetic":true}';
  await page.evaluate(({ key, corrupt }) => localStorage.setItem(key, corrupt), { key, corrupt });
  await page.reload();
  await expect(page.getByText(/Session only:/)).toBeVisible();
  await page.getByRole('button', { name: 'Start day 1' }).click();
  await finish(page);
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(corrupt);
  await page.getByRole('button', { name: 'Back to days' }).click();
  await page.getByRole('button', { name: 'Reset demo progress' }).click();
  await page.getByRole('button', { name: 'Yes, reset' }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).v, key)).toBe(1);
});
test('reading modes, literal rendering and unsaved unfinished attempt', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Reading aid' }).selectOption('romaji');
  await page.getByRole('button', { name: 'Start day 1' }).click();
  await expect(page.locator('.romaji')).toHaveText('mizu');
  await page.getByRole('button', { name: 'Back to days' }).click();
  await page.getByRole('combobox', { name: 'Reading aid' }).selectOption('off');
  await page.getByRole('button', { name: 'Start day 1' }).click();
  await expect(page.locator('ruby')).toHaveCount(0);
  const safe = await page.evaluate(async () => {
    const { renderJa } = await import('/src/render.js');
    const value = '<img src=x onerror=alert(1)>';
    const node = renderJa({ text: value, ruby: [{ t: value, r: '<script>bad()</script>' }] }, 'ruby');
    return { html: node.innerHTML, imageCount: node.querySelectorAll('img,script').length, text: node.textContent };
  });
  expect(safe.imageCount).toBe(0); expect(safe.text).toContain('<img');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start day 1' })).toBeVisible();
});
test('local server confines files, methods, Host header and runtime data flow', async ({ request }) => {
  const response = await request.get('/');
  expect(response.headers()['content-security-policy']).toContain("connect-src 'none'");
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  for (const path of ['/package.json', '/.git/config', '/src/app.ts', '/node_modules/typescript/package.json', '/src/app.d.ts', '/%2e%2e%2fpackage.json']) {
    expect((await request.get(path)).status()).toBe(404);
  }
  expect((await request.post('/')).status()).toBe(405);
  expect((await request.get('/', { headers: { Host: 'untrusted.example' } })).status()).toBe(403);
});
