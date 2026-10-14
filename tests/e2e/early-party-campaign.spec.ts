import {test,expect,type Page} from '@playwright/test';
import {getLevel} from '../../src/game/LevelManager';
import {bankAngle} from '../../src/game/Navigation';
import {World} from '../../src/game/World';
import {waitForPlaying} from './mission-flow';
async function setup(page:Page,count:3|4,keyboard=false){
  await page.addInitScript(({count,keyboard})=>{
    localStorage.setItem('wooden-tanks-v1',JSON.stringify({unlocked:40,completedThrough:39,wins:0,best:0,muted:true}));
    (window as any).__earlyPads=Array.from({length:count-(keyboard?1:0)},(_,index)=>({index,id:'Xbox Series Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
    Object.defineProperty(navigator,'getGamepads',{value:()=>(window as any).__earlyPads});
  },{count,keyboard});
  await page.goto('/');await page.locator('#coop').click();await page.getByRole('button',{name:`${count} jugadores`,exact:true}).click();
  await page.getByRole('button',{name:keyboard?'Teclado + controles →':'Jugar con controles →',exact:true}).click();await page.waitForTimeout(200);
  if(keyboard)await page.keyboard.press('Enter');
  await page.evaluate(()=>(window as any).__earlyPads.forEach((p:any)=>p.buttons[0]={pressed:true,value:1}));await page.waitForTimeout(200);
  await page.evaluate(()=>(window as any).__earlyPads.forEach((p:any)=>p.buttons[0]={pressed:false,value:0}));
  await page.waitForFunction(()=>(window as any).__wooden?.status==='intro');
}
async function mission(page:Page,id:number){
  await page.evaluate(id=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:id-1}});},id);
  await page.waitForFunction(id=>(window as any).__wooden?.world.level.id===id,id);
}
for(const count of [3,4]as const)test(`${count} controllers: all twenty early formations, briefings and assigned roles are usable`,async({page})=>{
  test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page,count);
  for(let id=1;id<=20;id++){
    if(id>1)await mission(page,id);const l=getLevel(id-1,count);
    await expect(page.locator('.brief-total')).toContainText(`${l.enemies.length} tanques enemigos · ${count} jugadores`);
    await expect(page.locator('.coop-plan p')).toHaveCount(count);await expect(page.getByRole('button',{name:'Continuar →',exact:true})).toBeInViewport({ratio:1});
    const state=await page.evaluate(()=>{const w=(window as any).__wooden.world;return {players:w.players.map((p:any)=>({x:p.x,y:p.y})),enemies:w.enemies.map((e:any)=>({x:e.x,y:e.y,kind:e.kind}))};});
    expect(state.players).toEqual(l.playerSpawns);expect(state.enemies).toEqual(l.enemies);
    if(id===7||id===16||id===20)await page.screenshot({path:`.playwright/early-${id}-${count}-brief.png`});
  }
  await page.evaluate(()=>{(window as any).__wooden.world.ai.update=()=>{};});
  // Confirm with the real gamepad menu input, then leave a neutral frame before movement.
  await page.evaluate(()=>(window as any).__earlyPads[0].buttons[0]={pressed:true,value:1});
  await page.waitForFunction(()=>(window as any).__wooden.status==='playing');
  await page.evaluate(()=>(window as any).__earlyPads[0].buttons[0]={pressed:false,value:0});await page.waitForFunction(()=>(window as any).__wooden.world.elapsed>.2);
  const before=await page.evaluate(()=>(window as any).__wooden.world.players.map((p:any)=>p.x));
  await page.evaluate(()=>(window as any).__earlyPads.forEach((p:any)=>p.axes=[1,0,0,0]));
  await page.waitForFunction(xs=>(window as any).__wooden.world.players.every((p:any,i:number)=>p.x>xs[i]+10),before,{timeout:2500});
  await page.evaluate(()=>(window as any).__earlyPads.forEach((p:any)=>p.axes=[0,0,0,0]));
  await page.evaluate(()=>(window as any).__earlyPads.at(-1).buttons[9]={pressed:true,value:1});await page.getByRole('button',{name:'Reanudar →',exact:true}).waitFor();
  await page.evaluate(()=>(window as any).__earlyPads.at(-1).buttons[9]={pressed:false,value:0});
  await page.getByRole('button',{name:'Reiniciar misión',exact:true}).click();await page.waitForFunction(()=>(window as any).__wooden.status==='intro');
  expect(await page.evaluate(()=>(window as any).__wooden.world.players.length)).toBe(count);expect(errors).toEqual([]);
});
for(const count of [3,4]as const)test(`${count} players: gallery fires a real bank shot with ${count===4?'mouse and three controllers':'the first controller'}`,async({page})=>{
  await setup(page,count,count===4);await mission(page,26);
  const l=getLevel(25,count),b=l.design!.bankTargets![0],w=new World(l,count),angle=bankAngle(b.from,w.enemies[b.enemy],w.solids,2193)!;
  await page.evaluate(from=>{const w=(window as any).__wooden.world;w.ai.update=()=>{};Object.assign(w.player,from);},b.from);await waitForPlaying(page);await page.waitForFunction(()=>(window as any).__wooden.world.elapsed>.2);
  if(count===4){
    const cursor=await page.evaluate(({from,angle})=>{const c=(window as any).__wooden.cameras.main,origin=c.getWorldPoint(0,0);return {x:(from.x+Math.cos(angle)*300-origin.x)*c.zoom,y:(from.y+Math.sin(angle)*300-origin.y)*c.zoom};},{from:b.from,angle});
    await page.mouse.move(cursor.x,cursor.y);
  }else await page.evaluate(angle=>{(window as any).__earlyPads[0].axes=[0,0,Math.cos(angle),Math.sin(angle)];},angle);
  await expect.poll(()=>page.evaluate(angle=>{const p=(window as any).__wooden.world.player;return Math.abs(Math.atan2(Math.sin(p.turret-angle),Math.cos(p.turret-angle)));},angle)).toBeLessThan(.02);
  if(count===4)await page.keyboard.press('Space');else await page.evaluate(()=>(window as any).__earlyPads[0].buttons[7]={pressed:true,value:1});
  await expect.poll(()=>page.evaluate(i=>(window as any).__wooden.world.tanks[i+1].alive,b.enemy),{timeout:10000}).toBe(false);
  if(count===3)await page.evaluate(()=>(window as any).__earlyPads[0].buttons[7]={pressed:false,value:0});
  expect(await page.evaluate(()=>(window as any).__wooden.world.players.every((p:any)=>p.alive))).toBe(true);
  await page.screenshot({path:`.playwright/early-gallery-${count}-bank.png`});
});
test('the full party atlas preserves deep links and shows actual gallery ricochets',async({page})=>{
  await page.goto('/party-campaign-review.html#mission-26');await expect(page.locator('#mission option')).toHaveCount(40);
  await expect(page.locator('#title')).toContainText('26');await expect(page.locator('#map3 [data-kind="tactical"]')).toHaveCount(4);await expect(page.locator('#map4 [data-kind="tactical"]')).toHaveCount(5);
  await expect(page.locator('#map3 polyline[data-bank]')).toHaveCount(4);await expect(page.locator('#map4 polyline[data-bank]')).toHaveCount(5);
  await page.locator('#mission').selectOption('10');await expect(page.locator('#map4 [data-kind="patrol"]')).toHaveCount(1);
  await page.locator('#mission').selectOption('20');await expect(page.locator('#map3 [data-kind="tactical"]')).toHaveCount(1);await expect(page.locator('#map4 [data-kind="tactical"]')).toHaveCount(1);
  await page.locator('#mission').selectOption('39');await expect(page.locator('#title')).toContainText('40');await expect(page.locator('#map4 [data-kind="hunter"]')).toHaveCount(3);
});
for(const count of [3,4]as const)test(`${count} players: campaign keeps the team through gallery and hunter chapter transitions`,async({page})=>{
  test.setTimeout(60000);await setup(page,count);
  for(const id of [25,26,30]){
    await mission(page,id);await page.evaluate(()=>{(window as any).__wooden.world.ai.update=()=>{};});await waitForPlaying(page);
    // Complete this formation to exercise the real victory, score and next-mission flow.
    await page.evaluate(()=>{(window as any).__wooden.world.enemies.forEach((e:any)=>e.alive=false);});
    await page.waitForFunction(next=>{const s=(window as any).__wooden;return s.world.level.id===next&&s.status==='intro';},id+1);
    const next=getLevel(id,count);await expect(page.locator('.brief-total')).toContainText(`${next.enemies.length} tanques enemigos · ${count} jugadores`);
    expect(await page.evaluate(()=>{const s=(window as any).__wooden;return {players:s.world.players.map((p:any)=>({x:p.x,y:p.y})),lives:s.session.lives,score:s.session.score};})).toMatchObject({players:next.playerSpawns,lives:3});
    expect(await page.evaluate(()=>(window as any).__wooden.session.score)).toBeGreaterThan(0);
    if(id===30)await expect(page.locator('.enemy-brief-row[data-kind="hunter"]')).toContainText('× 1');
  }
});
