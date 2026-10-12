import { test, expect, type Page } from '@playwright/test';
async function mockPads(page: Page, count = 2) {
  await page.addInitScript(count => {
    (window as any).__testPads = Array.from({ length: count }, (_, index) => ({ id: 'Xbox Series Controller', index, connected: true,
      mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => (window as any).__testPads });
  }, count);
}
async function start(page: Page, keyboard = false) {
  await page.goto('/'); await page.locator('#coop').click();
  await page.getByRole('button', { name: keyboard ? 'Teclado + control →' : 'Dos controles →', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__wooden?.status)).toBe('playing');
  await page.evaluate(() => { (window as any).__wooden.world.ai.update = () => {}; });
  await page.waitForTimeout(100);
}
async function sticks(page: Page, index: number, axes: number[]) {
  await page.evaluate(({ index, axes }) => { (window as any).__testPads[index].axes = axes; }, { index, axes });
}
async function button(page: Page, index: number, button: number, value: number) {
  await page.evaluate(({ index, button, value }) => { (window as any).__testPads[index].buttons[button] = { pressed: value > 0, value }; }, { index, button, value });
}
async function neutral(page: Page) {
  await page.evaluate(() => (window as any).__testPads.forEach((p: any) => { if (p) { p.axes = [0, 0, 0, 0]; p.buttons.forEach((b: any) => { b.value = 0; b.pressed = false; }); } }));
  await page.waitForTimeout(150);
}
async function press(page: Page, index: number, key: number) {
  await button(page, index, key, 1); await page.waitForTimeout(120); await button(page, index, key, 0); await page.waitForTimeout(150);
}
const state = (page: Page) => page.evaluate(() => {
  const s = (window as any).__wooden;
  return { status: s.status, level: s.session.level, coop: s.session.coop, lives: s.session.lives, score: s.session.score,
    players: s.world.players.map((p: any) => ({ x: p.x, y: p.y, turret: p.turret, alive: p.alive, shots: p.shots })) };
});
async function kill(page: Page, index: number) {
  await page.evaluate(index => {
    const w = (window as any).__wooden.world, p = w.players[index];
    w.projectiles.push({ id: 90000 + index, owner: w.enemies[0].id, x: p.x, y: p.y, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true });
  }, index);
}
test('two identical controllers independently move, aim, fire and pause the cooperative game', async ({ page }) => {
  test.setTimeout(60000); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await mockPads(page); await start(page);
  const before = await state(page); expect(before.players).toHaveLength(2);
  await sticks(page, 0, [0, -1, 1, 0]); await sticks(page, 1, [0, 1, 0, 1]); await page.waitForTimeout(350); await neutral(page);
  const moved = await state(page);
  expect(moved.players[0].y).toBeLessThan(before.players[0].y - 25);
  expect(moved.players[1].y).toBeGreaterThan(before.players[1].y + 25);
  expect(Math.abs(moved.players[0].turret)).toBeLessThan(0.1);
  expect(Math.abs(moved.players[1].turret - Math.PI / 2)).toBeLessThan(0.1);
  // Fire across the open board: downward ricochets at the nearby rim can kill their owner.
  await sticks(page, 1, [0, 0, 1, 0]); await page.waitForTimeout(200); await neutral(page);
  await button(page, 0, 7, 1); await button(page, 1, 7, 1); await page.waitForTimeout(650); await neutral(page);
  expect((await state(page)).players.every(p => p.shots >= 3)).toBe(true);
  await expect(page.locator('#ammo-p2 .ready')).toHaveCount(2);
  const aim = (await state(page)).players[1].turret;
  await sticks(page, 1, [1, 0, 0, 0]); await page.waitForTimeout(220); await neutral(page);
  expect(Math.abs((await state(page)).players[1].turret - aim)).toBeLessThan(0.03);
  // Mouse and keyboard cannot commandeer either tank in two-controller mode.
  const fixed = await state(page); await page.mouse.move(100, 100); await page.keyboard.down('d'); await page.waitForTimeout(200); await page.keyboard.up('d');
  for (const [i, p] of (await state(page)).players.entries()) {
    expect({ x: p.x, y: p.y, shots: p.shots, alive: p.alive }).toEqual({ x: fixed.players[i].x, y: fixed.players[i].y, shots: fixed.players[i].shots, alive: fixed.players[i].alive });
    expect(p.turret).toBeCloseTo(fixed.players[i].turret, 5);
  }
  await press(page, 1, 9); expect((await state(page)).status).toBe('paused');
  const paused = await state(page); await sticks(page, 0, [0, -1, 0, 0]); await button(page, 1, 7, 1); await page.waitForTimeout(200);
  expect((await state(page)).players).toEqual(paused.players);
  await neutral(page); await press(page, 0, 9); expect((await state(page)).status).toBe('playing');
  // Simultaneous menu buttons toggle pause once, not twice.
  await button(page, 0, 9, 1); await page.waitForTimeout(80); await button(page, 1, 9, 1); await page.waitForTimeout(250);
  expect((await state(page)).status).toBe('paused'); await neutral(page); await press(page, 1, 1);
  expect((await state(page)).status).toBe('playing'); expect(errors).toEqual([]);
  await page.screenshot({ path: '.playwright/cooperative-board.png' });
});
test('keyboard and mouse control P1 while a single controller controls P2', async ({ page }) => {
  await mockPads(page, 1); await start(page, true);
  const before = await state(page);
  await page.mouse.move(900, 520); await page.keyboard.down('w'); await sticks(page, 0, [0, 1, -1, 0]);
  await page.waitForTimeout(350); await page.keyboard.up('w'); await neutral(page);
  const after = await state(page);
  expect(after.players[0].y).toBeLessThan(before.players[0].y - 25);
  expect(after.players[1].y).toBeGreaterThan(before.players[1].y + 25);
  const desired = Math.atan2(520 - after.players[0].y, 900 - after.players[0].x);
  expect(Math.abs(after.players[0].turret - desired)).toBeLessThan(0.1);
  expect(Math.abs(Math.abs(after.players[1].turret) - Math.PI)).toBeLessThan(0.1);
  await page.keyboard.press('Space'); await button(page, 0, 7, 1); await page.waitForTimeout(100); await neutral(page);
  expect((await state(page)).players.every(p => p.shots >= 1)).toBe(true);
  await press(page, 0, 9); expect((await state(page)).status).toBe('paused');
  await press(page, 0, 0); expect((await state(page)).status).toBe('playing');
});
test('disconnect pauses both players, reserves slots and safely reconnects without accidental fire', async ({ page }) => {
  await mockPads(page); await start(page);
  await page.evaluate(() => {
    (window as any).__savedPad = (window as any).__testPads[0]; (window as any).__testPads[0] = null;
    window.dispatchEvent(new Event('gamepaddisconnected'));
  });
  await expect.poll(async () => (await state(page)).status).toBe('paused');
  await expect(page.locator('.gamepad-status')).toContainText('Reconecta el control de P1');
  const before = await state(page);
  await page.getByRole('button', { name: 'Reanudar →', exact: true }).click(); expect((await state(page)).status).toBe('paused');
  await sticks(page, 1, [0, -1, 0, 0]); await page.waitForTimeout(200); expect((await state(page)).players).toEqual(before.players);
  await page.evaluate(() => {
    const p = (window as any).__savedPad; p.axes = [0, -1, 1, 0]; p.buttons[7] = { value: 1, pressed: true };
    (window as any).__testPads[0] = p; window.dispatchEvent(new Event('gamepadconnected'));
  });
  await page.getByRole('button', { name: 'Reanudar →', exact: true }).click(); await page.waitForTimeout(250);
  expect((await state(page)).status).toBe('playing'); expect((await state(page)).players).toEqual(before.players);
  await neutral(page); await sticks(page, 1, [0, 1, 0, 0]); await page.waitForTimeout(250); await neutral(page);
  const after = await state(page); expect(after.players[0]).toEqual(before.players[0]); expect(after.players[1].y).toBeGreaterThan(before.players[1].y + 15);
});
test('a survivor can win, both return next mission, and a team wipe costs only one shared life', async ({ page }) => {
  test.setTimeout(60000); await mockPads(page); await start(page);
  await kill(page, 0); await expect.poll(async () => (await state(page)).players[0].alive).toBe(false);
  expect((await state(page)).status).toBe('playing'); expect((await state(page)).lives).toBe(3); expect((await state(page)).score).toBe(0);
  await expect(page.locator('#team-status')).toContainText('P1 fuera');
  await sticks(page, 1, [0, -1, 1, 0]); await page.waitForTimeout(250); await neutral(page); await button(page, 1, 7, 1); await page.waitForTimeout(100); await neutral(page);
  expect((await state(page)).players[1].shots).toBeGreaterThan(0);
  await page.evaluate(() => {
    const w = (window as any).__wooden.world, p = w.enemies[0];
    w.projectiles = [{ id: 90003, owner: -1, x: p.x, y: p.y, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true }];
  });
  await expect.poll(async () => (await state(page)).level).toBe(1);
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  expect((await state(page)).coop).toBe('two-pads'); expect((await state(page)).players.every(p => p.alive)).toBe(true);
  await page.evaluate(() => { (window as any).__wooden.world.ai.update = () => {}; });
  await kill(page, 0); await expect.poll(async () => (await state(page)).players[0].alive).toBe(false);
  await kill(page, 1); await expect.poll(async () => (await state(page)).lives).toBe(2);
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  expect((await state(page)).players.every(p => p.alive)).toBe(true); expect((await state(page)).level).toBe(1);
  await press(page, 0, 9); await page.getByRole('button', { name: 'Volver al menú', exact: true }).click();
  await expect(page.locator('#play')).toBeVisible(); await page.locator('#play').click();
  await expect.poll(async () => (await state(page)).status).toBe('playing'); expect((await state(page)).players).toHaveLength(1);
});
test('co-op setup requires the appropriate number of compatible controllers', async ({ page }) => {
  await page.goto('/'); await page.locator('#coop').click();
  await expect(page.getByRole('button', { name: 'Dos controles →', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Teclado + control →', exact: true })).toBeDisabled();
  await expect(page.locator('.coop-detection')).toContainText('0 controles detectados');
  await page.getByRole('button', { name: 'Volver', exact: true }).click(); await expect(page.locator('#coop')).toBeFocused();
});

test('Game Over retry and campaign victory replay preserve both players and controller assignments', async ({ page }) => {
  test.setTimeout(90000); await mockPads(page); await start(page);
  for (let lives = 2; lives >= 0; lives--) {
    await page.evaluate(() => {
      const w = (window as any).__wooden.world;
      w.ai.update = () => {};
      w.projectiles = w.players.map((p: any, i: number) => ({ id: 91000 + i, owner: w.enemies[0].id, x: p.x, y: p.y, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true }));
    });
    await expect.poll(async () => (await state(page)).lives).toBe(lives);
    await expect.poll(async () => (await state(page)).status).toBe(lives ? 'playing' : 'ended');
  }
  await expect(page.getByRole('heading', { name: 'Hasta la próxima batalla' })).toBeVisible();
  await neutral(page); await press(page, 1, 0);
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  expect((await state(page)).coop).toBe('two-pads'); expect((await state(page)).players).toHaveLength(2);
  expect((await state(page)).lives).toBe(3);
  // Start the real final mission, then produce its lethal impacts with controlled shells.
  await page.evaluate(() => {
    const s = (window as any).__wooden;
    s.scene.restart({ session: { ...s.session, level: 9 } });
  });
  await expect.poll(async () => (await state(page)).level).toBe(9);
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  await page.evaluate(() => {
    const w = (window as any).__wooden.world;
    w.projectiles = w.enemies.map((p: any, i: number) => ({ id: 92000 + i, owner: -1, x: p.x, y: p.y, vx: 322.5, vy: 0, age: 1, bounces: 0, alive: true }));
  });
  await expect(page.getByRole('heading', { name: 'Maestro del taller' })).toBeVisible();
  await neutral(page); await press(page, 1, 0);
  await expect.poll(async () => (await state(page)).level).toBe(0);
  await expect.poll(async () => (await state(page)).status).toBe('playing');
  expect((await state(page)).coop).toBe('two-pads'); expect((await state(page)).players.every(p => p.alive)).toBe(true);
  await page.evaluate(() => { (window as any).__wooden.world.ai.update = () => {}; });
  const before = await state(page); await neutral(page); await sticks(page, 1, [0, -1, 0, 0]); await page.waitForTimeout(250); await neutral(page);
  expect((await state(page)).players[0].x).toBe(before.players[0].x);
  expect((await state(page)).players[1].y).toBeLessThan(before.players[1].y - 15);
});
