import { test, expect } from '@playwright/test';

test('missiles cancel each other without costing lives or awarding points', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('playing');
  const before = await page.evaluate(() => {
    const scene = (window as any).__wooden;
    scene.world.ai.update = () => {};
    scene.world.projectiles = [
      { id: 9001, owner: 0, x: 500, y: 550, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true },
      { id: 9002, owner: 1, x: 530, y: 550, vx: -322.5, vy: 0, age: 1, bounces: 0, alive: true },
    ];
    return { score: scene.session.score, lives: scene.session.lives };
  });
  await expect.poll(() => page.evaluate(() => (window as any).__wooden.world.projectiles.length)).toBe(0);
  expect(await page.evaluate(() => {
    const scene = (window as any).__wooden;
    return { score: scene.session.score, lives: scene.session.lives };
  })).toEqual(before);
  await page.mouse.move(500, 550); await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => (window as any).__wooden.world.player.shots)).toBe(1);
});

test('mouse still aims the turret without drawing a sight on the target', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('playing');
  await page.evaluate(() => { (window as any).__wooden.world.ai.update = () => {}; });
  await page.mouse.move(800, 550); await page.waitForTimeout(300);
  const clip = { x: 1080, y: 540, width: 40, height: 40 };
  const before = await page.screenshot({ clip });
  await page.mouse.move(1100, 560); await page.waitForTimeout(300);
  expect(await page.screenshot({ clip })).toEqual(before);
  const error = await page.evaluate(() => {
    const p = (window as any).__wooden.world.player;
    const desired = Math.atan2(560 - p.y, 1100 - p.x);
    return Math.abs(Math.atan2(Math.sin(p.turret - desired), Math.cos(p.turret - desired)));
  });
  expect(error).toBeLessThan(0.02);
  expect(await page.locator('canvas').evaluate(el => getComputedStyle(el).cursor)).toBe('none');
});
