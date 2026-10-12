import { test, expect } from '@playwright/test';

test('player cannot drive into a floor pit and can maneuver around the row', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('playing');
  await page.evaluate(() => {
    const w = (window as any).__wooden.world;
    w.player.x = 156; w.player.y = 480; w.enemies.forEach((t: any) => { t.cooldown = 1000; });
  });
  await page.keyboard.down('w'); await page.waitForTimeout(850); await page.keyboard.up('w');
  const stopped = await page.evaluate(() => {
    const w = (window as any).__wooden.world;
    return { x: w.player.x, y: w.player.y, radius: w.player.radius, hole: w.holes[0], alive: w.player.alive };
  });
  expect(stopped.alive).toBe(true);
  expect(stopped.y).toBeGreaterThanOrEqual(stopped.hole.y + stopped.radius + stopped.hole.radius - 0.01);
  expect(stopped.y).toBeLessThan(460);
  await page.keyboard.down('d'); await page.waitForTimeout(1200); await page.keyboard.up('d');
  const x = await page.evaluate(() => (window as any).__wooden.world.player.x);
  expect(x).toBeGreaterThan(275);
  await page.keyboard.down('w'); await page.waitForTimeout(650); await page.keyboard.up('w');
  const y = await page.evaluate(() => (window as any).__wooden.world.player.y);
  expect(y).toBeLessThan(390);
});
