import { test, expect, type Page } from '@playwright/test';

async function mockPads(page: Page) {
  await page.addInitScript(() => {
    (window as any).__pads = [0, 1].map(index => ({ index, id: 'Xbox Wireless Controller', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
    Object.defineProperty(navigator, 'getGamepads', { value: () => (window as any).__pads });
  });
}
async function press(page: Page, index: number, button: number) {
  await page.evaluate(({ index, button }) => (window as any).__pads[index].buttons[button] = { pressed: true, value: 1 }, { index, button });
  await page.waitForTimeout(100);
  await page.evaluate(({ index, button }) => (window as any).__pads[index].buttons[button] = { pressed: false, value: 0 }, { index, button });
  await page.waitForTimeout(100);
}
const state = (page: Page) => page.evaluate(() => {
  const s = (window as any).__wooden;
  return { status: s.status, elapsed: s.world.elapsed, positions: s.world.players.map((p: any) => [p.x, p.y]), enemies: s.world.enemies.map((p: any) => [p.x, p.y]), shots: s.world.players.map((p: any) => p.shots) };
});

test('Xbox-only flow assigns players automatically and held sticks respond as soon as countdown ends', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await mockPads(page); await page.goto('/'); await page.waitForTimeout(250);
  await press(page, 0, 13); // Main menu: cooperative.
  await press(page, 0, 0);
  await expect(page.locator('.lobby-player[data-ready="true"]')).toHaveCount(2);
  await expect(page.locator('.lobby-roster')).toContainText('Xbox · control 1');
  await expect(page.locator('.lobby-roster')).toContainText('Xbox · control 2');
  await expect(page.getByRole('button', { name: 'Empezar partida →' })).toBeFocused();
  await page.screenshot({ path: '.playwright/automatic-controller-lobby.png' });
  await press(page, 0, 0);
  await expect(page.locator('.mission-briefing')).toBeVisible();
  await page.waitForTimeout(100); await press(page, 1, 0);
  await expect(page.locator('.battle-countdown strong')).toHaveText('3');
  const before = await state(page);
  await page.evaluate(() => {
    const s = (window as any).__wooden; s.world.ai.update = () => {};
    (window as any).__pads.forEach((p: any) => p.axes = [0, -1, 1, 0]);
  });
  await expect(page.locator('.battle-countdown strong')).toHaveText('2');
  expect(await state(page)).toEqual(before);
  await page.screenshot({ path: '.playwright/mission-countdown.png' });
  await expect(page.locator('.battle-countdown strong')).toHaveText('1');
  expect(await state(page)).toEqual(before);
  await expect.poll(() => page.evaluate(() => (window as any).__wooden.status)).toBe('playing');
  await page.waitForTimeout(100);
  const after = await state(page);
  expect(after.positions[0][1]).toBeLessThan(before.positions[0][1]);
  expect(after.positions[1][1]).toBeLessThan(before.positions[1][1]);
  expect(after.shots).toEqual([0, 0]);
  await page.evaluate(() => (window as any).__pads.forEach((p: any) => p.axes = [0, 0, 1, 0]));
  await press(page, 1, 7);
  expect((await state(page)).shots[1]).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('campaign exit is red, cancel preserves the mission, and only confirmation leaves', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  const exit = page.getByRole('button', { name: 'Salir de la campaña', exact: true });
  await expect(exit).toHaveClass(/danger/);
  await exit.click();
  await expect(page.locator('.exit-confirmation')).toBeVisible();
  await expect(page.locator('.exit-confirmation')).toContainText('perderás');
  await expect(page.getByRole('button', { name: 'Seguir jugando' })).toBeFocused();
  await page.screenshot({ path: '.playwright/exit-campaign-confirmation.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('.exit-confirmation')).toHaveCount(0);
  await expect(exit).toBeFocused();
  expect((await state(page)).elapsed).toBe(0);
  await exit.click(); await page.getByRole('button', { name: 'Sí, finalizar partida' }).click();
  await expect(page.locator('#coop')).toBeVisible();
});

test('missing controller disables start and reconnect never launches automatically', async ({ page }) => {
  await mockPads(page); await page.goto('/'); await page.locator('#coop').click();
  await page.evaluate(() => (window as any).__pads[1].connected = false);
  await expect(page.getByRole('button', { name: 'Empezar partida →' })).toBeDisabled();
  await expect(page.locator('.lobby-player').nth(1)).toContainText('Desconectado');
  await page.evaluate(() => (window as any).__pads[1].connected = true);
  await expect(page.getByRole('button', { name: 'Empezar partida →' })).toBeEnabled();
  await expect(page.locator('.player-lobby')).toBeVisible();
  await page.getByRole('button', { name: 'Teclado + controles →' }).click();
  await expect(page.locator('.lobby-player').nth(0)).toContainText('Teclado y mouse');
  await expect(page.getByRole('button', { name: 'Empezar partida →' })).toBeEnabled();
});

test('Menu cannot resume underneath the exit confirmation, and B safely returns to pause', async ({ page }) => {
  await mockPads(page); await page.goto('/'); await page.locator('#coop').click();
  await page.getByRole('button', { name: 'Empezar partida →' }).click();
  await page.getByRole('button', { name: 'Continuar →' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden.status)).toBe('playing');
  await press(page, 0, 9);
  await page.getByRole('button', { name: 'Salir de la campaña' }).click();
  await press(page, 0, 9);
  expect((await state(page)).status).toBe('paused');
  await expect(page.locator('.exit-confirmation')).toBeVisible();
  await press(page, 0, 1);
  await expect(page.locator('.exit-confirmation')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Salir de la campaña' })).toBeFocused();
  expect((await state(page)).status).toBe('paused');
  await press(page, 0, 9);
  expect((await state(page)).status).toBe('playing');
});
