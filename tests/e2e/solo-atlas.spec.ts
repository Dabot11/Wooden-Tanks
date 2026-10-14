import { test, expect } from '@playwright/test';

test('review atlas compares all forty maps, supports deep links and toggles verified routes', async ({ page }) => {
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/solo-campaign-review.html#mission-16');
  await expect(page.locator('#title')).toHaveText('16 · Doble compuerta');
  await expect(page.locator('#mission option')).toHaveCount(40);
  await expect(page.locator('#after polyline')).toHaveCount(2);
  await page.locator('#paths').uncheck();await expect(page.locator('#after polyline')).toHaveCount(0);
  await page.locator('#paths').check();
  await page.locator('#gates').check();await expect(page.locator('#after [data-cork]')).toHaveCount(2);
  await page.locator('#gates').uncheck();
  await page.screenshot({path:'.playwright/solo-review-atlas.png'});
  await page.getByRole('button',{name:'Misión siguiente',exact:true}).click();
  await expect(page.locator('#title')).toHaveText('17 · La emboscada');
  await page.keyboard.press('ArrowLeft');await expect(page.locator('#title')).toHaveText('16 · Doble compuerta');
  await page.locator('#mission').selectOption('6');
  await expect(page.locator('#title')).toHaveText('07 · A cubierto');
  await expect(page.locator('#metrics div').first()).toContainText('4Enemigos · antes 2');
  await expect(page.locator('#after svg')).toHaveCount(1);await expect(page.locator('#before svg')).toHaveCount(1);
  await page.getByRole('link',{name:'← Jugar Wooden Tanks',exact:true}).click();await expect(page.locator('#play')).toBeVisible();
  expect(errors).toEqual([]);
});
