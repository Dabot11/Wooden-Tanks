import { test, expect } from '@playwright/test';
import { waitForPlaying } from './mission-flow';

test('a thirty-mission winner starts chapter four, sees its roster and unlocks mission 32 after winning', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wooden-tanks-v1', JSON.stringify({ unlocked: 30, wins: 1, best: 35000, muted: true })));
  await page.goto('/'); await expect(page.locator('.menu-record')).toContainText('31 / 40');
  await page.locator('#select').click();
  await expect(page.locator('.mission-chapter')).toHaveCount(4);
  await expect(page.locator('.mission-choice').nth(30)).toBeEnabled(); await expect(page.locator('.mission-choice').nth(31)).toBeDisabled();
  await page.locator('.mission-choice').nth(30).click();
  await expect(page.getByRole('heading', { name: 'El bastión', exact: true })).toBeVisible();
  await expect(page.locator('.brief-total')).toContainText('9 tanques enemigos');
  await waitForPlaying(page);
  await page.evaluate(() => {
    const w = (window as any).__wooden.world; w.ai.update = () => {};
    w.projectiles = w.enemies.map((p: any, i: number) => ({ id: 95000 + i, owner: 0, x: p.x, y: p.y, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true }));
  });
  await expect(page.getByRole('heading', { name: 'Callejón de astillas', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('wooden-tanks-v1')!))).toMatchObject({ unlocked: 32, completedThrough: 31, best: 35000, muted: true });
});

test('the selector remains usable with a future catalog larger than 100 missions', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click(); await waitForPlaying(page);
  await page.evaluate(async () => {
    const { levels } = await import('/src/game/LevelManager.ts');
    const { progress } = await import('/src/game/Progress.ts');
    const template = levels.at(-1)!;
    // Test-only entries: never added to the shipped catalog.
    for (let id = 41; id <= 120; id++) levels.push({ ...template, id, name: `Misión futura ${id}`, difficulty: template.difficulty + id * 0.05 });
    progress.data.unlocked = 120;
    (window as any).__wooden.scene.start('Menu');
  });
  await page.locator('#select').click(); await expect(page.locator('.mission-choice')).toHaveCount(120);
  await expect(page.locator('.mission-chapter')).toHaveCount(12);
  await page.locator('.mission-choice').last().scrollIntoViewIfNeeded();
  await expect(page.locator('.mission-choice').last()).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Volver al taller', exact: true })).toBeInViewport();
  await page.locator('.mission-choice').last().click(); await expect(page.getByRole('heading', { name: 'Misión futura 120', exact: true })).toBeVisible();
});
