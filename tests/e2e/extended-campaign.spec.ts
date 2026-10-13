import { levels } from '../../src/game/LevelManager';
import { waitForPlaying } from './mission-flow';
import { test, expect } from '@playwright/test';

test('original campaign winners can select mission 11 and the forty-mission grid stays inside the screen', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('wooden-tanks-v1')) localStorage.setItem('wooden-tanks-v1', JSON.stringify({ unlocked: 10, wins: 1, best: 9000, muted: true }));
  });
  await page.goto('/'); await expect(page.locator('.menu-record')).toContainText(`11 / ${levels.length}`);
  await page.locator('#select').click();
  const missions = page.locator('.mission-choice'); await expect(missions).toHaveCount(levels.length);
  await expect(missions.nth(10)).toBeEnabled(); await expect(missions.nth(11)).toBeDisabled();
  for (const size of [{ width: 1280, height: 720 }, { width: 1000, height: 800 }]) {
    await page.setViewportSize(size);
    const app = (await page.locator('#app').boundingBox())!, modal = (await page.locator('.selector-modal').boundingBox())!;
    expect(modal.y).toBeGreaterThanOrEqual(app.y);
    expect(modal.y + modal.height).toBeLessThanOrEqual(app.y + app.height + 1);
    await expect(page.getByRole('button', { name: 'Volver al taller' })).toBeInViewport();
    await missions.last().scrollIntoViewIfNeeded(); await expect(missions.last()).toBeInViewport();
  }
  await page.screenshot({ path: '.playwright/forty-mission-selector.png' });
  await missions.nth(10).click();
  await waitForPlaying(page);
  expect(await page.evaluate(() => (window as any).__wooden.world.level.id)).toBe(11);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('wooden-tanks-v1')!).best)).toBe(9000);
  await page.reload(); await expect(page.locator('.menu-record')).toContainText(`11 / ${levels.length}`);
});
