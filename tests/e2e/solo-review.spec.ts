import { test, expect } from '@playwright/test';
import { levels, cooperativeLevels } from '../../src/game/LevelManager';
import { waitForPlaying } from './mission-flow';

test('all forty solo layouts render their authored briefing, deploy safely and accept movement', async ({ page }) => {
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/'); await page.locator('#play').click();
  for(const level of levels) {
    if(level.id>1) {
      await page.evaluate(index=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:index}});},level.id-1);
      await page.waitForFunction(id=>(window as any).__wooden?.world.level.id===id,level.id);
    }
    await expect(page.getByRole('heading',{name:level.name,exact:true})).toBeVisible();
    await expect(page.locator('.mission-briefing')).toContainText(level.design!.lesson);
    await expect(page.locator('.brief-total')).toContainText(`${level.enemies.length} tanques enemigos`);
    await page.evaluate(()=>{(window as any).__wooden.world.ai.update=()=>{};});
    await waitForPlaying(page);
    expect(await page.evaluate(()=>{const w=(window as any).__wooden.world;return {player:{x:w.player.x,y:w.player.y},enemies:w.enemies.length,holes:w.holes.length,obstacles:w.obstacles.length};}))
      .toEqual({player:level.player,enemies:level.enemies.length,holes:level.holes!.length,obstacles:level.obstacles.length});
    await page.keyboard.down('d');await page.waitForTimeout(100);await page.keyboard.up('d');
    expect(await page.evaluate(()=>(window as any).__wooden.world.player.x)).toBeGreaterThan(level.player.x);
    if([1,5,7,12,16,26,31,40].includes(level.id))await page.screenshot({path:`.playwright/solo-${level.id}.png`});
  }
  expect(errors).toEqual([]);
});

test('mission 26 cork opens a real route using ordinary shooting and keyboard movement', async ({ page }) => {
  await page.goto('/');await page.locator('#play').click();
  await page.evaluate(()=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:25}});});
  await page.waitForFunction(()=>(window as any).__wooden?.world.level.id===26);
  await page.evaluate(()=>{const w=(window as any).__wooden.world;w.ai.update=()=>{};w.player.x=360;w.player.y=364;w.player.turret=0;});
  await waitForPlaying(page);
  await page.mouse.move(530,364);await page.keyboard.down('d');await page.waitForTimeout(600);await page.keyboard.up('d');
  expect(await page.evaluate(()=>(window as any).__wooden.world.player.x)).toBeLessThanOrEqual(401);
  await page.keyboard.down('a');await page.waitForTimeout(400);await page.keyboard.up('a');
  await page.keyboard.down('Space');
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.world.obstacles[1].alive)).toBe(false);
  await page.keyboard.up('Space');
  await page.keyboard.down('d');
  try { await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.world.player.x)).toBeGreaterThan(510); }
  finally { await page.keyboard.up('d'); }
  expect(await page.evaluate(()=>(window as any).__wooden.world.player.alive)).toBe(true);
  await page.screenshot({path:'.playwright/solo-gate-26.png'});
});

test('first sentinel can be defeated by real ricochet salvos from the protected tactical post', async ({ page }) => {
  await page.goto('/');await page.locator('#play').click();
  await page.evaluate(()=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:6}});});
  await page.waitForFunction(()=>(window as any).__wooden?.world.level.id===7);
  const aim=await page.evaluate(async()=>{
    const {bankAngle}=await import('/src/game/EnemyAI.ts');
    const w=(window as any).__wooden.world;
    // Isolate the fortified encounter after the support guard has been cleared.
    w.tanks.filter((t:any)=>t.kind==='basic').forEach((t:any)=>t.alive=false);
    w.player.x=827;w.player.y=481;
    const target=w.enemies[0];target.cooldown=0;
    const angle=bankAngle(w.player,target,w.solids,2193);w.player.turret=angle;
    return {x:w.player.x+Math.cos(angle)*160,y:w.player.y+Math.sin(angle)*160};
  });
  await waitForPlaying(page);await page.mouse.move(aim.x,aim.y);await page.waitForTimeout(200);
  await page.keyboard.down('Space');
  try { await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.status),{timeout:15000}).toBe('won'); }
  finally { await page.keyboard.up('Space'); }
  expect(await page.evaluate(()=>(window as any).__wooden.world.player.alive)).toBe(true);
  expect(await page.evaluate(()=>(window as any).__wooden.world.tanks.find((t:any)=>t.kind==='tactical').shots)).toBeGreaterThan(0);
});
