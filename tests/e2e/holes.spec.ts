import { waitForPlaying } from './mission-flow';
import { test, expect } from '@playwright/test';

test('player cannot drive into a floor pit and can maneuver around the row', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  await page.evaluate(() => { const s=(window as any).__wooden; s.scene.restart({session:{...s.session,level:5}}); });
  await page.waitForFunction(() => (window as any).__wooden?.world.level.id===6);
  await waitForPlaying(page);
  await page.evaluate(() => {
    const w = (window as any).__wooden.world;
    w.player.x = 630; w.player.y = 370; w.ai.update = () => {}; w.enemies.forEach((t: any) => { t.cooldown = 1000; });
  });
  await page.keyboard.down('w'); await page.waitForTimeout(850); await page.keyboard.up('w');
  const stopped = await page.evaluate(() => {
    const w = (window as any).__wooden.world;
    return { x: w.player.x, y: w.player.y, radius: w.player.radius, hole: w.holes[0], alive: w.player.alive };
  });
  expect(stopped.alive).toBe(true);
  expect(stopped.y).toBeGreaterThanOrEqual(stopped.hole.y + stopped.radius + stopped.hole.radius - 0.01);
  expect(stopped.y).toBeLessThan(355);
  // Wait for the actual maneuver instead of assuming a particular render rate.
  await page.keyboard.down('d');
  try { await expect.poll(() => page.evaluate(() => (window as any).__wooden.world.player.x)).toBeGreaterThan(770); }
  finally { await page.keyboard.up('d'); }
  const x = await page.evaluate(() => (window as any).__wooden.world.player.x);
  expect(x).toBeGreaterThan(770);
  await page.keyboard.down('w');
  try { await expect.poll(() => page.evaluate(() => (window as any).__wooden.world.player.y)).toBeLessThan(270); }
  finally { await page.keyboard.up('w'); }
  const y = await page.evaluate(() => (window as any).__wooden.world.player.y);
  expect(y).toBeLessThan(270);
});
