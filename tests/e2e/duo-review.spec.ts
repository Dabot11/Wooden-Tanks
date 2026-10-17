import { test, expect, type Page } from '@playwright/test';
import { duoLevels } from '../../src/game/LevelManager';
import { waitForPlaying } from './mission-flow';
async function startDuo(page:Page,keyboard=false){
  await page.addInitScript(count=>{
    (window as any).__duoPads=Array.from({length:count},(_,index)=>({index,id:'Xbox Series Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>(window as any).__duoPads});
  },keyboard?1:2);
  await page.goto('/');await page.locator('#coop').click();
  await page.getByRole('button',{name:keyboard?'Teclado + controles →':'Jugar con controles →',exact:true}).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Empezar partida →', exact: true }).click();
  await page.waitForFunction(()=>(window as any).__wooden?.status==='intro');
}
test('all forty duo variants render exact formations and accept independent Gamepad API inputs',async({page})=>{
  test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await startDuo(page);
  for(const l of duoLevels){
    if(l.id>1){await page.evaluate(i=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:i}});},l.id-1);await page.waitForFunction(id=>(window as any).__wooden?.world.level.id===id,l.id);}
    await expect(page.getByRole('heading',{name:l.name,exact:true})).toBeVisible();
    await expect(page.locator('.mission-briefing')).toContainText(l.subtitle);
    await expect(page.locator('.brief-total')).toContainText(`${l.enemies.length} tanques enemigos`);
    for(const role of l.design!.cooperation!.roles)await expect(page.locator('.coop-plan')).toContainText(role);
    expect(await page.evaluate(()=>{const w=(window as any).__wooden.world;return {players:w.players.map((p:any)=>({x:p.x,y:p.y})),enemies:w.enemies.map((p:any)=>({x:p.x,y:p.y,kind:p.kind})),arena:w.arena,holes:w.holes.length,obstacles:w.obstacles.length};}))
      .toEqual({players:l.playerSpawns,enemies:l.enemies,arena:l.arena,holes:l.holes!.length,obstacles:l.obstacles.length});
    await page.evaluate(()=>{(window as any).__wooden.world.ai.update=()=>{};});await waitForPlaying(page);
    await page.waitForTimeout(150); // Neutral input must be observed after beginBattle suppresses held controls.
    await page.evaluate(()=>(window as any).__duoPads.forEach((p:any)=>p.axes=[1,0,0,0]));await page.waitForTimeout(160);
    await page.evaluate(()=>(window as any).__duoPads.forEach((p:any)=>p.axes=[0,0,0,0]));
    const positions=await page.evaluate(()=>(window as any).__wooden.world.players.map((p:any)=>({x:p.x,alive:p.alive})));
    positions.forEach((p:any,i:number)=>{expect(p.x).toBeGreaterThan(l.playerSpawns![i].x+5);expect(p.alive).toBe(true);});
    if([1,4,7,16,26,31,36,40].includes(l.id))await page.screenshot({path:`.playwright/duo-${l.id}.png`});
  }
  expect(errors).toEqual([]);
});
test('the real two-controller campaign advances through every briefing and preserves assignments through victory',async({page})=>{
  test.setTimeout(210000);await startDuo(page);
  for(const l of duoLevels){
    await page.waitForFunction(id=>(window as any).__wooden?.world.level.id===id,l.id);
    await expect(page.locator('.brief-total')).toContainText(`${l.enemies.length} tanques enemigos`);
    await page.waitForTimeout(80);
    expect(await page.evaluate(()=>(window as any).__wooden.world.elapsed)).toBe(0);
    await page.evaluate(()=>{(window as any).__wooden.world.ai.update=()=>{};});await waitForPlaying(page);
    // Deterministic lethal projectile impacts isolate campaign transitions from combat skill.
    await page.evaluate(()=>{const w=(window as any).__wooden.world;w.projectiles=w.enemies.map((p:any,i:number)=>({id:99000+i,owner:0,x:p.x,y:p.y,vx:322.5,vy:0,age:1,bounces:0,alive:true}));});
    if(l.id<40)await page.waitForFunction(id=>(window as any).__wooden?.world.level.id===id,l.id+1);
  }
  await expect(page.getByRole('heading',{name:'Maestro del taller'})).toBeVisible();
  await page.getByRole('button',{name:'Una nueva partida →',exact:true}).click();
  await page.waitForFunction(()=>(window as any).__wooden?.world.level.id===1);
  expect(await page.evaluate(()=>({count:(window as any).__wooden.world.players.length,layout:(window as any).__wooden.session.coop}))).toEqual({count:2,layout:'two-pads'});
});
test('P2 opens and traverses the reviewed gate with ordinary controller shooting while P1 uses keyboard',async({page})=>{
  await startDuo(page,true);
  await page.evaluate(()=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:15}});});
  await page.waitForFunction(()=>(window as any).__wooden?.world.level.id===16);
  const gate=await page.evaluate(()=>{
    const w=(window as any).__wooden.world,o=w.obstacles[1],p=w.players[1];w.ai.update=()=>{};
    Object.assign(p,{x:o.x-60,y:o.y+o.h/2,turret:0});return {x:o.x,w:o.w};
  });
  await waitForPlaying(page);
  await page.waitForTimeout(150);
  await page.evaluate(()=>(window as any).__duoPads[0].axes=[1,0,1,0]);await page.waitForTimeout(400);
  expect(await page.evaluate(()=>(window as any).__wooden.world.players[1].x)).toBeLessThan(gate.x-18);
  // Back away from the intact wall so the barrel can clear its muzzle, as in ordinary play.
  await page.evaluate(()=>(window as any).__duoPads[0].axes=[-1,0,1,0]);await page.waitForTimeout(350);
  await page.evaluate(()=>{const p=(window as any).__duoPads[0];p.axes=[0,0,1,0];p.buttons[7]={pressed:true,value:1};});
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.world.obstacles[1].alive)).toBe(false);
  await page.evaluate(()=>{const p=(window as any).__duoPads[0];p.buttons[7]={pressed:false,value:0};p.axes=[1,0,1,0];});
  try{await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.world.players[1].x)).toBeGreaterThan(gate.x+gate.w+25);}
  finally{await page.evaluate(()=>(window as any).__duoPads[0].axes=[0,0,0,0]);}
  expect(await page.evaluate(()=>(window as any).__wooden.world.alivePlayers.length)).toBe(2);
});
test('duo atlas shows forty selectable maps, roles, deployment and real open-gate paths',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/duo-campaign-review.html#mission-16');await expect(page.locator('#title')).toContainText('16 ·');
  await expect(page.locator('#mission option')).toHaveCount(40);
  await expect(page.locator('#duo [data-route]')).toHaveCount(2);await expect(page.locator('#duo [data-rally]')).toHaveCount(1);
  await expect(page.locator('#roles')).toContainText('P1');await expect(page.locator('#roles')).toContainText('P2');
  await page.locator('#gates').check();await expect(page.locator('#duo [data-cork]')).toHaveCount(2);
  await page.locator('#mission').selectOption('25');await expect(page.locator('#duo [data-bank]')).toHaveCount(4);
  await page.locator('#paths').uncheck();await expect(page.locator('#duo [data-route]')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');await expect(page.locator('#title')).toContainText('27 ·');
  await page.setViewportSize({width:390,height:844});await expect(page.locator('#duo svg')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:'.playwright/duo-atlas-mobile.png'});expect(errors).toEqual([]);
});
