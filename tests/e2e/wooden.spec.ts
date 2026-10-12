import { test, expect, type Page } from '@playwright/test';
const state = (page: Page) => page.evaluate(() => {
  const scene = (window as any).__wooden;
  return { level: scene.session.level, status: scene.status, lives: scene.session.lives, score: scene.session.score,
    player: { x: scene.world.player.x, y: scene.world.player.y, angle: scene.world.player.angle, turret: scene.world.player.turret, shots: scene.world.player.shots },
    enemies: scene.world.enemies.map((t: any) => ({ x: t.x, y: t.y })) };
});
async function start(page: Page) {
  await page.goto('/'); await page.locator('#play').click();
  await expect.poll(async () => (await state(page)).status).toBe('playing');
}
async function fixtureHitPlayer(page: Page) {
  await page.evaluate(() => {
    const world = (window as any).__wooden.world, p = world.player;
    world.projectiles.push({ id: 9999, owner: 1, x: p.x - 45, y: p.y, vx: 430, vy: 0, age: 1, bounces: 0, alive: true });
  });
}
test('win the first mission with real keyboard and aiming inputs, then advance and persist progress', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await start(page); await page.keyboard.down('d');
  let firing = false;
  for (let i = 0; i < 80; i++) {
    const s = await state(page);
    if (s.status === 'won' || s.level === 1) break;
    expect(s.lives).toBe(3);
    if (s.enemies[0]) await page.mouse.move(s.enemies[0].x, s.enemies[0].y);
    if (s.player.x > 430 && !firing) { await page.keyboard.down('Space'); firing = true; }
    if (s.player.x > 1050) await page.keyboard.up('d');
    await page.waitForTimeout(100);
  }
  await page.keyboard.up('d'); await page.keyboard.up('Space');
  await expect.poll(async () => (await state(page)).level).toBe(1);
  expect((await state(page)).score).toBeGreaterThan(100);
  await page.reload(); await expect(page.locator('#play')).toBeVisible();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('wooden-tanks-v1')!));
  expect(save.unlocked).toBe(2); expect(save.best).toBeGreaterThan(100);
  await page.locator('#select').click();
  await expect(page.locator('.mission-choice').nth(1)).toBeEnabled();
  await expect(page.locator('.mission-choice').nth(2)).toBeDisabled();
  expect(errors).toEqual([]);
});
test('four directions, independent turret, short click, space, pause, restart and sound', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await start(page);
  expect((await state(page)).enemies.length).toBe(1);
  // Isolate control timing from hostile shots; combat and lethal impacts have separate tests.
  await page.evaluate(() => (window as any).__wooden.world.enemies.forEach((t: any) => { t.cooldown = 1000; }));
  for (const [key, axis, sign] of [['w', 'y', -1], ['s', 'y', 1], ['a', 'x', -1], ['d', 'x', 1], ['ArrowLeft', 'x', -1], ['ArrowRight', 'x', 1]] as const) {
    const before = (await state(page)).player;
    await page.mouse.move(600, 570); await page.keyboard.down(key); await page.waitForTimeout(180); await page.keyboard.up(key);
    const after = (await state(page)).player;
    expect((after[axis] - before[axis]) * sign).toBeGreaterThan(12);
    const desired = Math.atan2(570 - after.y, 600 - after.x);
    expect(Math.abs(Math.atan2(Math.sin(after.turret - desired), Math.cos(after.turret - desired)))).toBeLessThan(0.12);
  }
  await page.mouse.click(650, 590);
  await expect.poll(async () => (await state(page)).player.shots).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Una pequeña pausa' })).toBeVisible();
  const paused = await state(page); await page.waitForTimeout(250);
  expect((await state(page)).player).toEqual(paused.player);
  await page.getByRole('button', { name: 'Reanudar' }).click();
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  await page.locator('.sound-button').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('wooden-tanks-v1')!).muted)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Una pequeña pausa' })).toBeVisible();
  await page.getByRole('button', { name: 'Reiniciar misión' }).click();
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  expect((await state(page)).player.x).toBe(180);
  await page.mouse.move(900, 520); await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).player.shots).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
test('projectile impacts consume lives, reset the mission, show Game Over and allow a new game', async ({ page }) => {
  await start(page);
  for (let lives = 2; lives >= 0; lives--) {
    await fixtureHitPlayer(page);
    await expect.poll(async () => (await state(page)).lives).toBe(lives);
    if (lives) {
      await expect.poll(async () => (await state(page)).status).toBe('playing');
      expect((await state(page)).player.x).toBe(180);
    }
  }
  await expect(page.getByRole('heading', { name: 'Hasta la próxima batalla' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a intentarlo' }).click();
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  expect((await state(page)).lives).toBe(3);
});
test('all campaign transitions and final victory handle actual collision outcomes', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await start(page);
  for (let level = 0; level < 20; level++) {
    await expect.poll(async () => (await state(page)).level).toBe(level);
    await expect.poll(async () => (await state(page)).status).toBe('playing');
    // Controlled projectile fixtures exercise collisions and the complete scene lifecycle.
    // The separate first-mission test uses only real user input to win a battle.
    await page.evaluate(() => {
      const world = (window as any).__wooden.world;
      world.enemies.forEach((t: any, i: number) => {
        t.cooldown = 1000;
        world.projectiles.push({ id: 8000 + i, owner: 0, x: t.x - 28, y: t.y, vx: 430, vy: 0, age: 1, bounces: 0, alive: true });
      });
    });
    await expect.poll(async () => (await state(page)).status).toBe('won');
  }
  await expect(page.getByRole('heading', { name: 'Maestro del taller' })).toBeVisible();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('wooden-tanks-v1')!));
  expect(save.unlocked).toBe(20); expect(save.wins).toBe(1);
  await page.getByRole('button', { name: 'Volver al menú' }).click();
  await expect(page.locator('#play')).toBeVisible(); expect(errors).toEqual([]);
});
test('canvas and interface retain 16:9 across viewport sizes', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#play')).toBeVisible();
  for (const size of [{ width: 1440, height: 900 }, { width: 900, height: 1100 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(size); await page.waitForTimeout(200);
    const canvas = await page.locator('canvas').boundingBox(), ui = await page.locator('#ui').boundingBox();
    expect(canvas!.width / canvas!.height).toBeCloseTo(16 / 9, 2);
    expect(ui!.width).toBeCloseTo(canvas!.width, 0); expect(ui!.height).toBeCloseTo(canvas!.height, 0);
    expect(canvas!.width).toBeLessThanOrEqual(size.width); expect(canvas!.height).toBeLessThanOrEqual(size.height);
  }
});
