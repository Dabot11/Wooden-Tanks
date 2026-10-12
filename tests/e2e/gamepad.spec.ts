import { test, expect, type Page } from '@playwright/test';

async function mockAPI(page: Page) {
  await page.addInitScript(() => {
    (window as any).__testPads = [];
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => (window as any).__testPads });
  });
}
async function connect(page: Page, axes = [0, 0, 0, 0], held: number[] = []) {
  await page.evaluate(({ axes, held }) => {
    (window as any).__testPads[0] = { id: 'Xbox Series Controller (test)', index: 0, connected: true, mapping: 'standard', axes,
      buttons: Array.from({ length: 17 }, (_, i) => ({ value: held.includes(i) ? 1 : 0, pressed: held.includes(i) })) };
    window.dispatchEvent(new Event('gamepadconnected'));
  }, { axes, held });
  await expect(page.locator('.gamepad-status')).toContainText('Control conectado');
  await page.waitForTimeout(120);
}
async function axes(page: Page, values: number[]) {
  await page.evaluate(values => { (window as any).__testPads[0].axes = values; }, values);
}
async function button(page: Page, index: number, down: boolean) {
  await page.evaluate(({ index, down }) => { (window as any).__testPads[0].buttons[index] = { value: down ? 1 : 0, pressed: down }; }, { index, down });
}
async function press(page: Page, index: number) {
  await button(page, index, true); await page.waitForTimeout(120);
  await button(page, index, false); await page.waitForTimeout(120);
}
async function neutral(page: Page) {
  await page.evaluate(() => {
    const p = (window as any).__testPads[0]; p.axes = [0, 0, 0, 0]; p.buttons.forEach((b: any) => { b.pressed = false; b.value = 0; });
  });
  await page.waitForTimeout(150);
}
async function state(page: Page) {
  return page.evaluate(() => { const s = (window as any).__wooden; return { status: s.status, level: s.session.level, lives: s.session.lives,
    x: s.world.player.x, y: s.world.player.y, turret: s.world.player.turret, shots: s.world.player.shots, projectiles: s.world.projectiles.length }; });
}
async function isolate(page: Page) {
  await page.evaluate(() => { const w = (window as any).__wooden.world; w.enemies.forEach((t: any) => { t.cooldown = 1000; }); w.projectiles = []; });
}

test('Xbox twin-stick, retained aim, held RT, keyboard/mouse switching, pause gates and disconnect', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await mockAPI(page); await page.goto('/');
  // A/RT/sticks already held at connection must never launch the menu or fire.
  await connect(page, [1, 0, 0, 1], [0, 7]);
  await page.waitForTimeout(200); await expect(page.locator('#play')).toBeVisible();
  await neutral(page); await press(page, 0);
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  await neutral(page); await isolate(page);
  const beforeSmallTilt = await state(page);
  await page.mouse.move(950, 180); await expect(page.locator('.mouse-reticle')).toBeVisible(); // Give ownership back to keyboard/mouse first.
  await axes(page, [0.19, 0, 0, 0]); await page.waitForTimeout(220);
  expect((await state(page)).x).toBeGreaterThan(beforeSmallTilt.x + 15);
  await expect(page.locator('.mouse-reticle')).toBeHidden();
  await neutral(page);
  const initial = await state(page);
  await axes(page, [0.8, 0.6, -0.6, -0.8]); await page.waitForTimeout(300);
  const moved = await state(page);
  expect(moved.x - initial.x).toBeGreaterThan(20); expect(moved.y - initial.y).toBeGreaterThan(15);
  const direction = Math.atan2(-0.8, -0.6);
  expect(Math.abs(moved.turret - direction)).toBeLessThan(0.02);
  await expect(page.locator('.controls-strip')).toContainText('RT');
  await axes(page, [1, 0, 0, 0]); await page.waitForTimeout(180);
  expect(Math.abs((await state(page)).turret - direction)).toBeLessThan(0.003);
  await axes(page, [0.1, -0.1, -0.08, 0.04]); await page.waitForTimeout(100);
  const idle = await state(page); await page.waitForTimeout(180);
  expect((await state(page)).x).toBe(idle.x); expect((await state(page)).y).toBe(idle.y);
  await button(page, 7, true); await page.waitForTimeout(700); await button(page, 7, false);
  expect((await state(page)).shots).toBeGreaterThanOrEqual(3);
  // Leave the input checks independent of returning shells; collision tests cover friendly fire.
  await isolate(page);
  await axes(page, [1, 0, 0, 0]); await page.waitForTimeout(120);
  const beforeKeyboard = await state(page);
  await page.keyboard.down('a'); await page.waitForTimeout(220); await page.keyboard.up('a');
  expect((await state(page)).x).toBeLessThan(beforeKeyboard.x - 15);
  await page.mouse.move(950, 180); await page.waitForTimeout(120);
  const mouseAim = await state(page);
  expect(Math.abs(mouseAim.turret - Math.atan2(180 - mouseAim.y, 950 - mouseAim.x))).toBeLessThan(0.04);
  await neutral(page); await axes(page, [-1, 0, 0.6, -0.8]); await page.waitForTimeout(200);
  expect((await state(page)).x).toBeLessThan(mouseAim.x - 15);
  await button(page, 9, true);
  await expect.poll(async () => (await state(page)).status).toBe('paused');
  const paused = await state(page); await page.waitForTimeout(300);
  expect((await state(page)).status).toBe('paused'); expect((await state(page)).x).toBe(paused.x);
  // Resume with RT held: the trigger must be released before another shot is allowed.
  await neutral(page); await button(page, 7, true); await button(page, 9, true);
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  await page.waitForTimeout(350); expect((await state(page)).shots).toBe(paused.shots);
  await neutral(page); await button(page, 7, true); await page.waitForTimeout(100); await button(page, 7, false);
  expect((await state(page)).shots).toBeGreaterThan(paused.shots); await isolate(page);
  await axes(page, [1, 0, 0, 0]); await page.waitForTimeout(120);
  await page.evaluate(() => { (window as any).__testPads = []; window.dispatchEvent(new Event('gamepaddisconnected')); });
  await expect.poll(async () => (await state(page)).status).toBe('paused');
  await expect(page.locator('.gamepad-status')).toContainText('desconectado');
  // Reconnection while RT is held also requires full release and preserves lives/mission.
  await connect(page, [1, 0, 0, 0], [7]); await page.keyboard.press('Escape');
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  const reconnected = await state(page); await page.waitForTimeout(180);
  expect((await state(page)).shots).toBe(reconnected.shots); expect((await state(page)).x).toBe(reconnected.x);
  expect((await state(page)).lives).toBe(3); expect((await state(page)).level).toBe(0);
  expect(errors).toEqual([]);
});

test('gamepad navigates mission selector, settings and pause without repeated confirmations', async ({ page }) => {
  test.setTimeout(90000);
  await mockAPI(page); await page.goto('/'); await connect(page); await neutral(page);
  await press(page, 13); await press(page, 13); await press(page, 13); // Un jugador -> Cooperativo -> Duelo -> Misiones.
  await expect(page.locator('#select')).toBeFocused();
  await button(page, 0, true);
  await expect(page.getByRole('heading', { name: 'Elige tu batalla' })).toBeVisible();
  await page.waitForTimeout(250); await expect(page.locator('.mission-choice').first()).toBeFocused();
  // Keeping A held cannot also launch the newly focused mission.
  await expect(page.locator('.modal')).toBeVisible(); await neutral(page); await press(page, 1);
  await expect(page.locator('#select')).toBeFocused();
  await press(page, 13); await expect(page.locator('#gamepad-settings')).toBeFocused(); await press(page, 0);
  await expect(page.locator('#left-deadzone')).toBeFocused();
  await press(page, 15); // D-pad right adjusts the focused slider.
  await expect(page.locator('#left-deadzone')).toHaveValue('0.19');
  await neutral(page); await press(page, 13); await expect(page.locator('#right-deadzone')).toBeFocused();
  await press(page, 14); await expect(page.locator('#right-deadzone')).toHaveValue('0.19');
  await neutral(page); await press(page, 1); await expect(page.locator('#gamepad-settings')).toBeFocused();
  await page.reload(); await page.locator('#gamepad-settings').click();
  await expect(page.locator('#left-deadzone')).toHaveValue('0.19'); await expect(page.locator('#right-deadzone')).toHaveValue('0.19');
  await page.getByRole('button', { name: 'Listo' }).click();
  await connect(page); await neutral(page);
  // Left stick navigates once per deflection; A starts the solo campaign.
  await axes(page, [0, -1, 0, 0]); await page.waitForTimeout(200); await neutral(page);
  await axes(page, [0, -1, 0, 0]); await page.waitForTimeout(200); await neutral(page);
  await axes(page, [0, -1, 0, 0]); await page.waitForTimeout(200); await neutral(page);
  await axes(page, [0, -1, 0, 0]); await page.waitForTimeout(200); await neutral(page);
  await expect(page.locator('#play')).toBeFocused(); await press(page, 0);
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  expect((await state(page)).level).toBe(0); await isolate(page); await neutral(page);
  await press(page, 9); await expect.poll(async () => (await state(page)).status).toBe('paused');
  // Configure within pause, and Menu closes both dialogs before resuming gameplay.
  await press(page, 13); await press(page, 13); await press(page, 13);
  await expect(page.getByRole('button', { name: 'Ajustes del control' })).toBeFocused(); await press(page, 0);
  await expect(page.getByRole('heading', { name: 'Tu control, tu zona' })).toBeVisible();
  expect((await state(page)).status).toBe('paused');
  await press(page, 9); await expect.poll(async () => (await state(page)).status).toBe('playing');
  await expect(page.locator('.modal')).toHaveCount(0);
  await press(page, 9); await press(page, 1); await expect.poll(async () => (await state(page)).status).toBe('playing');
  await press(page, 9); await press(page, 13); await expect(page.getByRole('button', { name: 'Reiniciar misión' })).toBeFocused();
  await press(page, 0); await expect.poll(async () => (await state(page)).status).toBe('playing');
  expect((await state(page)).shots).toBe(0); expect((await state(page)).lives).toBe(3);
});

test('unsupported/missing Gamepad API keeps keyboard and mouse fully playable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: undefined }));
  await page.goto('/'); await page.locator('#play').click();
  await expect.poll(async () => (await state(page)).status).toBe('playing'); await isolate(page);
  const initial = await state(page); await page.keyboard.down('d'); await page.waitForTimeout(220); await page.keyboard.up('d');
  expect((await state(page)).x).toBeGreaterThan(initial.x + 15);
  await page.mouse.click(950, 400); await expect.poll(async () => (await state(page)).shots).toBeGreaterThan(0);
  await expect(page.locator('.gamepad-status')).toBeHidden();
});

test('A confirms and B returns from Game Over and victory screens', async ({ page }) => {
  test.setTimeout(90000);
  await mockAPI(page); await page.goto('/'); await connect(page); await neutral(page); await press(page, 0);
  await expect.poll(async () => (await state(page)).status).toBe('playing'); await neutral(page);
  for (let lives = 2; lives >= 0; lives--) {
    await page.evaluate(() => {
      const w = (window as any).__wooden.world; w.enemies.forEach((t: any) => { t.cooldown = 1000; });
      w.projectiles.push({ id: 9999, owner: 1, x: w.player.x - 45, y: w.player.y, vx: 430, vy: 0, age: 1, bounces: 0, alive: true });
    });
    await expect.poll(async () => (await state(page)).lives).toBe(lives);
    if (lives) await expect.poll(async () => (await state(page)).status).toBe('playing');
  }
  await expect(page.getByRole('heading', { name: 'Hasta la próxima batalla' })).toBeVisible();
  await neutral(page); await press(page, 0);
  await expect.poll(async () => (await state(page)).status).toBe('playing'); expect((await state(page)).lives).toBe(3);
  await neutral(page); await press(page, 9); await press(page, 13); await press(page, 13); await press(page, 0);
  await expect(page.locator('#play')).toBeVisible();
  await press(page, 0);
  await expect.poll(async () => (await state(page)).status).toBe('playing'); await neutral(page);
  await page.evaluate(() => { const s = (window as any).__wooden; s.scene.restart({ session: { ...s.session, level: 19 } }); });
  await expect.poll(async () => (await state(page)).level).toBe(19);
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  await page.evaluate(() => {
    const w = (window as any).__wooden.world;
    w.enemies.forEach((t: any, i: number) => { t.cooldown = 1000; w.projectiles.push({ id: 8000 + i, owner: 0, x: t.x - 28, y: t.y, vx: 430, vy: 0, age: 1, bounces: 0, alive: true }); });
  });
  await expect(page.getByRole('heading', { name: 'Maestro del taller' })).toBeVisible();
  await neutral(page); await press(page, 1); await expect(page.locator('#play')).toBeVisible();
});
