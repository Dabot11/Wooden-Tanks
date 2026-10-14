import {test,expect,type Page} from '@playwright/test';
import {getLevel} from '../../src/game/LevelManager';
import type {PlayerCount} from '../../src/game/types';
import {waitForPlaying} from './mission-flow';

async function start(page:Page,count:PlayerCount,keyboard=false){
  await page.addInitScript(({count,keyboard})=>{
    localStorage.setItem('wooden-tanks-v1',JSON.stringify({unlocked:40,completedThrough:39,wins:0,best:0,muted:true}));
    (window as any).__campaignPads=Array.from({length:count===1?0:count-(keyboard?1:0)},(_,index)=>({index,id:'Xbox Series Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
    Object.defineProperty(navigator,'getGamepads',{value:()=>(window as any).__campaignPads});
  },{count,keyboard});
  await page.goto('/');
  if(count===1)await page.locator('#play').click();
  else{
    await page.locator('#coop').click();if(count>2)await page.getByRole('button',{name:`${count} jugadores`,exact:true}).click();
    await page.getByRole('button',{name:keyboard?'Teclado + controles →':'Jugar con controles →',exact:true}).click();await page.waitForTimeout(200);
    if(keyboard)await page.keyboard.press('Enter');
    await page.evaluate(()=>(window as any).__campaignPads.forEach((p:any)=>p.buttons[0]={pressed:true,value:1}));await page.waitForTimeout(200);
    await page.evaluate(()=>(window as any).__campaignPads.forEach((p:any)=>p.buttons[0]={pressed:false,value:0}));
  }
  await page.waitForFunction(()=>(window as any).__wooden?.status==='intro');
}
async function mission(page:Page,id:number){
  await page.evaluate(id=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:id-1}});},id);
  await page.waitForFunction(id=>(window as any).__wooden?.world.level.id===id,id);
}
for(const count of [1,2,3,4]as PlayerCount[])test(`late campaign: all 19 formations and briefings render correctly for ${count} players`,async({page})=>{
  test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page,count);
  for(let id=22;id<=40;id++){
    await mission(page,id);const level=getLevel(id-1,count);
    await expect(page.locator('.brief-total')).toContainText(`${level.enemies.length} tanques enemigos`);
    await expect(page.getByRole('button',{name:'Continuar →',exact:true})).toBeInViewport();
    if(count>1)await expect(page.locator('.coop-plan p')).toHaveCount(count);
    const actual=await page.evaluate(()=>{const s=(window as any).__wooden,w=s.world;return {enemies:w.enemies.map((t:any)=>({x:t.x,y:t.y,kind:t.kind})),players:w.players.map((t:any)=>({x:t.x,y:t.y})),hunterTexture:s.textures.exists('body-hunter')};});
    expect(actual.enemies).toEqual(level.enemies);expect(actual.players).toEqual(level.playerSpawns??[level.player]);expect(actual.hunterTexture).toBe(true);
    if(id===35||id===40)await page.screenshot({path:`.playwright/campaign-${id}-${count}-brief.png`});
  }
  await page.evaluate(()=>{(window as any).__wooden.world.ai.update=()=>{};});await waitForPlaying(page);
  await page.waitForFunction(()=>(window as any).__wooden.world.elapsed>.2);
  const before=await page.evaluate(()=>(window as any).__wooden.world.players.map((p:any)=>p.x));
  if(count===1)await page.keyboard.down('D');else await page.evaluate(()=>(window as any).__campaignPads.forEach((p:any)=>p.axes=[1,0,0,0]));
  await page.waitForFunction(xs=>(window as any).__wooden.world.players.every((p:any,i:number)=>p.x>xs[i]+10),before,{timeout:2500});
  if(count===1)await page.keyboard.up('D');else await page.evaluate(()=>(window as any).__campaignPads.forEach((p:any)=>p.axes=[0,0,0,0]));
  await page.keyboard.press('P');await page.getByRole('button',{name:'Reanudar →',exact:true}).waitFor();
  await page.screenshot({path:`.playwright/campaign-40-${count}-board.png`});expect(errors).toEqual([]);
});
test('late-party atlas covers every mission and shows exact bounded forces, routes and hunter progression',async({page})=>{
  await page.goto('/party-campaign-review.html#mission-40');await expect(page.locator('#title')).toContainText('40');
  await expect(page.locator('#mission option')).toHaveCount(40);await expect(page.locator('#map3 [data-kind="hunter"]')).toHaveCount(2);await expect(page.locator('#map4 [data-kind="hunter"]')).toHaveCount(3);
  await expect(page.locator('#map4 polyline[data-player]')).toHaveCount(4);
  await page.locator('#mission').selectOption('22');await expect(page.locator('#title')).toContainText('23');await expect(page.locator('[data-kind="hunter"]')).toHaveCount(0);
  await page.locator('#paths').uncheck();await expect(page.locator('polyline[data-player]')).toHaveCount(0);
  await page.locator('#mission').selectOption('35');await expect(page.locator('#map4 [data-kind="tactical"]')).toHaveCount(5);
});
test('four-player bastion accepts a real mouse-fired bank shot under the larger camera zoom',async({page})=>{
  await start(page,4,true);await mission(page,31);
  const shot=getLevel(30,4).design!.bankTargets![0];
  const bearing=await page.evaluate(shot=>{
    const w=(window as any).__wooden.world,p=w.player,t=w.enemies[shot.enemy];w.ai.update=()=>{};Object.assign(p,shot.from);
    // This authored post banks off the top edge of the actual larger arena.
    const reflected={x:t.x,y:2*(w.arena.y+4)-t.y},angle=Math.atan2(reflected.y-p.y,reflected.x-p.x);p.turret=angle;
    return {x:p.x+Math.cos(angle)*400,y:p.y+Math.sin(angle)*400,angle};
  },shot);
  await waitForPlaying(page);
  const cursor=await page.evaluate(aim=>{
    const c=(window as any).__wooden.cameras.main,origin=c.getWorldPoint(0,0);
    return {x:(aim.x-origin.x)*c.zoom,y:(aim.y-origin.y)*c.zoom};
  },bearing);
  await page.mouse.move(cursor.x,cursor.y);
  await expect.poll(()=>page.evaluate(angle=>{const p=(window as any).__wooden.world.player;return Math.abs(Math.atan2(Math.sin(p.turret-angle),Math.cos(p.turret-angle)));},bearing.angle)).toBeLessThan(.02);
  await page.keyboard.press('Space');
  await expect.poll(()=>page.evaluate(i=>(window as any).__wooden.world.tanks[i+1].alive,shot.enemy),{timeout:10000}).toBe(false);
  expect(await page.evaluate(()=>(window as any).__wooden.world.players.every((p:any)=>p.alive))).toBe(true);
  await page.screenshot({path:'.playwright/campaign-bastion-four-bank.png'});
});
