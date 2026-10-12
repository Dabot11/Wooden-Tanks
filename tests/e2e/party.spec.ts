import { test, expect, type Page } from '@playwright/test';
async function setup(page: Page, count: number, keyboard = false) {
  await page.addInitScript(count => {
    (window as any).__pads = Array.from({ length: count }, (_, index) => ({ index, id: 'Xbox Series Controller', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
    Object.defineProperty(navigator, 'getGamepads', { value: () => (window as any).__pads });
  }, count - (keyboard ? 1 : 0));
  await page.goto('/'); await page.locator('#coop').click();
  await page.getByRole('button', { name: `${count} jugadores`, exact: true }).click();
  await page.getByRole('button', { name: keyboard ? 'Teclado + controles →' : 'Jugar con controles →', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('playing');
  await page.evaluate(() => (window as any).__wooden.world.ai.update = () => {});
  await page.waitForTimeout(150);
}
for (const count of [3, 4]) test(`${count} controllers drive independent players; final player pauses and retains its slot after a restart`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await setup(page, count);
  const info = await page.evaluate(() => {
    const s = (window as any).__wooden;
    return { players: s.world.players.map((p: any) => ({ x: p.x, y: p.y })), enemies: s.world.enemies.length, zoom: s.cameras.main.zoom };
  });
  expect(info.players).toHaveLength(count); expect(info.enemies).toBe(count); expect(info.zoom).toBeCloseTo(1 / (1 + (count - 1) * 0.2));
  for (let i = 0; i < count; i++) {
    await page.evaluate(i => { (window as any).__pads[i].axes = [0, -1, 1, 0]; }, i);
    await expect.poll(() => page.evaluate(i => (window as any).__wooden.world.players[i].y, i)).toBeLessThan(info.players[i].y - 10);
    await page.evaluate(i => { (window as any).__pads[i].axes = [0, 0, 0, 0]; }, i);
    await page.waitForTimeout(100);
  }
  await page.evaluate(count => (window as any).__pads[count - 1].buttons[9] = { pressed: true, value: 1 }, count);
  await expect.poll(() => page.evaluate(() => (window as any).__wooden.status)).toBe('paused');
  await page.evaluate(count => (window as any).__pads[count - 1].buttons[9] = { pressed: false, value: 0 }, count);
  await page.getByRole('button', { name: 'Reiniciar misión', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden.status)).toBe('playing');
  expect(await page.evaluate(() => (window as any).__wooden.world.players.length)).toBe(count);
  await expect(page.locator(`#ammo-p${count} .ammo`)).toHaveCount(5);
  await page.screenshot({ path: `.playwright/party-${count}.png` });
  expect(errors).toEqual([]);
});
test('four-player mixed input keeps the mouse exact under zoom; friendly fire and disconnect affect the correct player', async ({ page }) => {
  await setup(page, 4, true);
  await page.mouse.move(850, 250);
  await expect(page.locator('.mouse-reticle')).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const s = (window as any).__wooden, p = s.world.player, point = s.cameras.main.getWorldPoint(850, 250);
    return Math.abs(Math.atan2(Math.sin(p.turret - Math.atan2(point.y - p.y, point.x - p.x)), Math.cos(p.turret - Math.atan2(point.y - p.y, point.x - p.x))));
  })).toBeLessThan(0.03);
  const bounds = await page.locator('.mouse-reticle').boundingBox();
  expect(bounds!.x + bounds!.width / 2).toBeCloseTo(850, 0); expect(bounds!.y + bounds!.height / 2).toBeCloseTo(250, 0);
  await page.evaluate(() => {
    const w = (window as any).__wooden.world, p = w.players[3];
    w.projectiles = [{ id: 90001, owner: 0, x: p.x, y: p.y, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true }];
  });
  await expect(page.locator('#team-status')).toContainText('P4 fuera');
  expect(await page.evaluate(() => (window as any).__wooden.session.lives)).toBe(3);
  await page.evaluate(() => { (window as any).__pads[1].connected = false; });
  await expect.poll(() => page.evaluate(() => (window as any).__wooden.status)).toBe('paused');
  await expect(page.locator('.gamepad-status')).toContainText('Reconecta P3');
});
test('gallery shows the restricted zone and a mouse-fired bank shot reaches a protected sentinel', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wooden-tanks-v1', JSON.stringify({ unlocked: 20, best: 0, muted: true, wins: 0 })));
  await page.goto('/'); await page.locator('#select').click(); await page.locator('.mission-choice').nth(15).click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('playing');
  const aim = await page.evaluate(() => {
    const w = (window as any).__wooden.world;
    w.ai.update = () => {};
    w.enemies.slice(1).forEach((t: any) => t.alive = false);
    const target = w.enemies[0], p = w.player, reflectedY = 2 * (w.arena.y + w.arena.h - 4) - target.y;
    const angle = Math.atan2(reflectedY - p.y, target.x - p.x);
    return { x: p.x + Math.cos(angle) * 300, y: p.y + Math.sin(angle) * 300, angle };
  });
  await page.mouse.move(aim.x, aim.y);
  await expect.poll(() => page.evaluate(angle => Math.abs((window as any).__wooden.world.player.turret - angle), aim.angle)).toBeLessThan(0.02);
  await page.screenshot({ path: '.playwright/gallery-board.png' });
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('won');
});
