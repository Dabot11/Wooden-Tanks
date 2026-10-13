import { test, expect, type Page } from '@playwright/test';
import { waitForPlaying } from './mission-flow';

async function start(page: Page) {
  await page.goto('/'); await page.locator('#play').click(); await waitForPlaying(page);
  await page.evaluate(() => { (window as any).__wooden.world.ai.update = () => {}; });
}
async function kill(page: Page, player: boolean) {
  return page.evaluate(player => {
    const scene = (window as any).__wooden, world = scene.world;
    const target = player ? world.player : world.enemies[0];
    world.projectiles = [{ id: 90001, owner: player ? 99 : 0, x: target.x, y: target.y, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true }];
    scene.update(0, 16);
    return { x: target.x, y: target.y, time: scene.time.now, elapsed: world.elapsed };
  }, player);
}
async function markers(page: Page) {
  return page.evaluate(() => (window as any).__wooden.children.list.filter((o: any) => o.getData?.('death-marker')).map((o: any) => ({ x: o.x, y: o.y, alpha: o.alpha })));
}

test('only destroyed tanks leave a persistent X at their death position', async ({ page }) => {
  await start(page);
  await page.evaluate(() => { const scene = (window as any).__wooden; scene.scene.restart({ session: { ...scene.session, level: 1 } }); });
  await page.waitForFunction(() => (window as any).__wooden?.session.level === 1);
  await waitForPlaying(page);
  await page.evaluate(() => { (window as any).__wooden.world.ai.update = () => {}; });
  expect(await markers(page)).toEqual([]);
  const death = await kill(page, false);
  expect(await markers(page)).toEqual([{ x: death.x, y: death.y, alpha: 0 }]);
  expect(await page.evaluate(() => {
    const children = (window as any).__wooden.children.list;
    return { blast: children.filter((o: any) => o.getData?.('tank-explosion')).length, parts: children.filter((o: any) => o.getData?.('tank-debris')).length };
  })).toEqual({ blast: 2, parts: 2 });
  await expect.poll(async () => (await markers(page))[0]?.alpha).toBe(1);
  await page.screenshot({ path: '.playwright/death-marker.png' });
  await page.waitForTimeout(1000);
  expect(await markers(page)).toEqual([{ x: death.x, y: death.y, alpha: 1 }]);
  expect(await page.evaluate(() => (window as any).__wooden.status)).toBe('playing');
  expect(await page.evaluate(() => (window as any).__wooden.children.list.filter((o: any) => o.getData?.('tank-debris') || o.getData?.('tank-explosion')).length)).toBe(0);
  const second = await kill(page, false);
  expect((await markers(page)).map(({ x, y }) => ({ x, y }))).toEqual([{ x: death.x, y: death.y }, { x: second.x, y: second.y }]);
});

test('player death finishes its animation and sound before offering a manual retry', async ({ page }) => {
  await start(page);
  const death = await kill(page, true);
  expect(await page.evaluate(() => (window as any).__wooden.status)).toBe('dead');
  expect(await page.evaluate(() => (window as any).__wooden.audioState)).toMatchObject({ scene: 'defeat', context: 'running' });
  await page.waitForTimeout(1600);
  await expect(page.getByRole('button', { name: 'Continuar →', exact: true })).toHaveCount(0);
  expect(await markers(page)).toEqual([{ x: death.x, y: death.y, alpha: 1 }]);
  expect(await page.evaluate(() => (window as any).__wooden.world.elapsed)).toBe(death.elapsed);
  await expect(page.getByRole('button', { name: 'Reintentar misión →', exact: true })).toBeVisible();
  await page.waitForTimeout(1000);
  expect(await markers(page)).toEqual([{ x: death.x, y: death.y, alpha: 1 }]);
  await page.getByRole('button', { name: 'Reintentar misión →', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuar →', exact: true })).toBeVisible();
  expect(await markers(page)).toEqual([]);
  expect(await page.evaluate(() => (window as any).__wooden.session.lives)).toBe(2);
});

test('victory leaves the board uncovered for two seconds after the last explosion', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const scene = (window as any).__wooden, world = scene.world;
    world.projectiles = world.enemies.map((p: any, i: number) => ({ id: 91000 + i, owner: 0, x: p.x, y: p.y, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true }));
    scene.update(0, 16);
  });
  expect(await page.evaluate(() => (window as any).__wooden.status)).toBe('won');
  await page.waitForTimeout(2000);
  await expect(page.locator('.victory-toast')).toHaveCount(0);
  await expect(page.locator('.victory-toast')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar →', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__wooden.session.level)).toBe(1);
});

test('slow animation frames cannot be overtaken by the death transition', async ({ page }) => {
  await start(page);
  await page.evaluate(() => { (window as any).__wooden.tweens.timeScale = .2; });
  await kill(page, true);
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => (window as any).__wooden.status)).toBe('dead');
  await expect(page.getByRole('button', { name: 'Reintentar misión →', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__wooden.children.list.some((o: any) => o.getData?.('tank-debris')))).toBe(true);
  await page.evaluate(() => { (window as any).__wooden.tweens.timeScale = 1; });
  await expect(page.getByRole('button', { name: 'Reintentar misión →', exact: true })).toBeVisible();
});

test('explosion and defeat sounds have audible complete tails and distinct melodies', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { synthSound } = await import('/src/game/AudioManager.ts');
    const sounds = [];
    for (const type of ['destroy', 'defeat'] as const) {
      const ctx = new OfflineAudioContext(1, 88200, 44100);
      synthSound(ctx, ctx.destination, type);
      const data = (await ctx.startRendering()).getChannelData(0);
      const rms = (a: number, b: number) => Math.sqrt(data.slice(a, b).reduce((sum, n) => sum + n * n, 0) / (b - a));
      sounds.push({ tail: rms(26460, 35280), silence: rms(70560, 88200), finite: data.every(Number.isFinite) });
    }
    return sounds;
  });
  for (const sound of result) { expect(sound.tail).toBeGreaterThan(.0001); expect(sound.silence).toBeLessThan(.00001); expect(sound.finite).toBe(true); }
});
