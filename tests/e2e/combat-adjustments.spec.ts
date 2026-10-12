import { test, expect } from '@playwright/test';

test('missile collisions animate an explosion without costing lives or awarding points', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('playing');
  await page.evaluate(() => { (window as any).__wooden.world.ai.update = () => {}; });
  await page.mouse.move(1100, 560);
  const clip = { x: 475, y: 510, width: 80, height: 80 };
  const clearFloor = await page.screenshot({ clip });
  const before = await page.evaluate(() => {
    const scene = (window as any).__wooden;
    scene.world.projectiles = [
      { id: 9001, owner: 0, x: 500, y: 550, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true },
      { id: 9002, owner: 1, x: 530, y: 550, vx: -322.5, vy: 0, age: 1, bounces: 0, alive: true },
    ];
    const before = { score: scene.session.score, lives: scene.session.lives };
    scene.update(0, 50);
    // Freeze this animation frame so a screenshot cannot miss the brief flash.
    scene.tweens.timeScale = 0;
    return before;
  });
  const explosions = () => page.evaluate(() => (window as any).__wooden.children.list.filter((child: any) => child.getData?.('shell-explosion')).length);
  await expect.poll(explosions, { intervals: [30, 30, 50] }).toBe(2);
  expect(await page.screenshot({ clip })).not.toEqual(clearFloor);
  await expect.poll(() => page.evaluate(() => (window as any).__wooden.world.projectiles.length)).toBe(0);
  expect(await page.evaluate(() => {
    const scene = (window as any).__wooden;
    return { score: scene.session.score, lives: scene.session.lives };
  })).toEqual(before);
  await page.evaluate(() => { (window as any).__wooden.tweens.timeScale = 1; });
  await expect.poll(explosions).toBe(0);
  await page.waitForTimeout(750); expect(await page.screenshot({ clip })).toEqual(clearFloor);
  await page.mouse.move(500, 550); await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => (window as any).__wooden.world.player.shots)).toBe(1);
});

test('mouse sight is centered on the cursor, follows it at different scales and hides during pause', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('playing');
  await page.evaluate(() => { (window as any).__wooden.world.ai.update = () => {}; });
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1000, height: 800 }, { width: 1500, height: 760 }]) {
    await page.setViewportSize(viewport);
    const canvas = await page.locator('canvas').boundingBox();
    for (const point of [{ x: 1100, y: 560 }, { x: 900, y: 200 }]) {
      const x = canvas!.x + point.x * canvas!.width / 1280, y = canvas!.y + point.y * canvas!.height / 720;
      await page.mouse.move(x, y); await expect(page.locator('.mouse-reticle')).toBeVisible();
      await expect.poll(async () => {
        const sight = (await page.locator('.mouse-reticle').boundingBox())!;
        return Math.hypot(sight.x + sight.width / 2 - x, sight.y + sight.height / 2 - y);
      }).toBeLessThan(0.5);
    }
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.mouse.move(1100, 560); await page.waitForTimeout(250);
  const error = await page.evaluate(() => {
    const p = (window as any).__wooden.world.player;
    const desired = Math.atan2(560 - p.y, 1100 - p.x);
    return Math.abs(Math.atan2(Math.sin(p.turret - desired), Math.cos(p.turret - desired)));
  });
  expect(error).toBeLessThan(0.02);
  await page.keyboard.press('Escape'); await expect(page.locator('.mouse-reticle')).toBeHidden();
  await page.getByRole('button', { name: 'Reanudar →', exact: true }).click(); await page.mouse.move(1000, 400);
  await expect(page.locator('.mouse-reticle')).toBeVisible();
  expect(await page.locator('canvas').evaluate(el => getComputedStyle(el).cursor)).toBe('none');
});

test('initial menu has clear mode choices, keyboard navigation and no reference board', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#demo')).toHaveCount(0);
  await expect(page.locator('.board-caption')).toHaveCount(0);
  await expect(page.getByText(/tablero de referencia/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Un jugador', exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cooperativo local', exact: false })).toBeVisible();
  await expect(page.locator('#play')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(page.locator('#coop')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(page.locator('#select')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByRole('heading', { name: 'Elige tu batalla' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#select')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(page.locator('#gamepad-settings')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByRole('heading', { name: 'Tu control, tu zona' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#gamepad-settings')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(page.locator('#play')).toBeFocused();
  await page.keyboard.press('Enter'); await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('playing');
  expect(await page.evaluate(() => (window as any).__wooden.world.level.id)).toBe(1);
});
