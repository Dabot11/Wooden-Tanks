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

test('player death finishes its animation and sound before the retry briefing', async ({ page }) => {
  await start(page);
  const death = await kill(page, true);
  expect(await page.evaluate(() => (window as any).__wooden.status)).toBe('dead');
  expect(await page.evaluate(() => (window as any).__wooden.audioState)).toMatchObject({ scene: 'briefing', context: 'running' });
  await page.waitForTimeout(1600);
  await expect(page.getByRole('button', { name: 'Continuar →', exact: true })).toHaveCount(0);
  expect(await markers(page)).toEqual([{ x: death.x, y: death.y, alpha: 1 }]);
  expect(await page.evaluate(() => (window as any).__wooden.world.elapsed)).toBe(death.elapsed);
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
