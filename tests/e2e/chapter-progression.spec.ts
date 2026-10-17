import {test,expect,type Page} from '@playwright/test';
import {getLevel,ENEMY_CHAPTERS} from '../../src/game/LevelManager';
import {waitForPlaying} from './mission-flow';
async function start(page:Page,count:1|2|3|4){
  await page.addInitScript(count=>{
    localStorage.setItem('wooden-tanks-v1',JSON.stringify({unlocked:40,completedThrough:0,wins:0,best:1234,muted:true}));
    (window as any).__chapterPads=Array.from({length:count===1?0:count},(_,index)=>({index,id:'Xbox Series Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
    Object.defineProperty(navigator,'getGamepads',{value:()=>(window as any).__chapterPads});
  },count);
  await page.goto('/');
  if(count===1)await page.locator('#play').click();
  else{
    await page.locator('#coop').click();if(count>2)await page.getByRole('button',{name:`${count} jugadores`,exact:true}).click();
    await page.getByRole('button',{name:'Jugar con controles →',exact:true}).click();await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Empezar partida →', exact: true }).click();
  }
  await page.waitForFunction(()=>(window as any).__wooden?.status==='intro');
}
async function mission(page:Page,id:number){
  await page.evaluate(id=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:id-1}});},id);
  await page.waitForFunction(id=>(window as any).__wooden?.world.level.id===id,id);
}
for(const count of [1,2,3,4]as const)test(`${count} players: all forty chapter layouts, formations and briefings render exactly`,async({page})=>{
  test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page,count);
  for(let id=1;id<=40;id++){
    if(id>1)await mission(page,id);const l=getLevel(id-1,count);
    await expect(page.getByRole('heading',{name:l.name,exact:true})).toBeVisible();
    for(const name of ['Continuar →','Salir de la campaña'])await expect(page.getByRole('button',{name,exact:true})).toBeInViewport({ratio:1});
    const kinds=new Set(l.enemies.map(e=>e.kind));await expect(page.locator('.enemy-brief-row')).toHaveCount(kinds.size);
    for(const k of kinds)await expect(page.locator(`.enemy-brief-row[data-kind="${k}"]`)).toContainText(`× ${l.enemies.filter(e=>e.kind===k).length}`);
    expect(await page.evaluate(()=>{const w=(window as any).__wooden.world;return {players:w.players.map((p:any)=>({x:p.x,y:p.y})),enemies:w.enemies.map((e:any)=>({x:e.x,y:e.y,kind:e.kind})),elapsed:w.elapsed};})).toEqual({players:l.playerSpawns??[l.player],enemies:l.enemies,elapsed:0});
    if([11,21,26,31,40].includes(id)){await page.waitForTimeout(550);await page.screenshot({path:`.playwright/chapter-${id}-${count}-brief.png`});}
  }
  await page.evaluate(()=>{(window as any).__wooden.world.ai.update=()=>{};});await waitForPlaying(page);await page.waitForFunction(()=>(window as any).__wooden.world.elapsed>.2);
  if(count>1){await page.evaluate(()=>(window as any).__chapterPads.at(-1).buttons[9]={pressed:true,value:1});}else await page.keyboard.press('P');
  await page.getByRole('button',{name:'Reanudar →',exact:true}).waitFor();expect(errors).toEqual([]);
});
for(const count of [1,2,3,4]as const)test(`${count} players: real victories introduce one new enemy at 11, 21 and 31 without losing team or save`,async({page})=>{
  test.setTimeout(60000);await start(page,count);
  for(const id of [10,20,30]){
    await mission(page,id);await page.evaluate(()=>{(window as any).__wooden.world.ai.update=()=>{};});await waitForPlaying(page);
    await page.evaluate(()=>{const w=(window as any).__wooden.world;w.projectiles=w.enemies.map((e:any,i:number)=>({id:8000+i,owner:0,x:e.x,y:e.y,vx:322.5,vy:0,age:1,bounces:0,alive:true}));});
    await page.waitForFunction(id=>{const s=(window as any).__wooden;return s.world.level.id===id+1&&s.status==='intro';},id);
    const kind=ENEMY_CHAPTERS[id/10].kind;await expect(page.locator(`.enemy-brief-row[data-kind="${kind}"]`)).toContainText('× 1');
    expect(await page.evaluate(()=>(window as any).__wooden.world.players.length)).toBe(count);
    expect(await page.evaluate(()=>(window as any).__wooden.session.lives)).toBe(3);
    const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('wooden-tanks-v1')!));expect(save.completedThrough).toBe(id);expect(save.muted).toBe(true);expect(save.best).toBeGreaterThanOrEqual(1234);
  }
});
test('the complete atlas browses all 160 variants and marks chapter debuts and real gallery ricochets',async({page})=>{
  await page.goto('/campaign-review.html#mission-11');await expect(page.locator('#mission option')).toHaveCount(40);await expect(page.locator('[data-chapter="2"]')).toHaveClass('active');
  for(const [id,kind,total]of [[11,'patrol',1],[21,'tactical',1],[31,'hunter',1],[33,'hunter',2],[36,'hunter',3]]as const){
    await page.locator('#mission').selectOption(String(id-1));for(const count of [1,2,3,4])await expect(page.locator(`#map${count} [data-kind="${kind}"]`)).toHaveCount(total);
  }
  await page.locator('#mission').selectOption('25');for(const [count,total]of [[1,3],[2,4],[3,4],[4,5]])await expect(page.locator(`#map${count} [data-bank]`)).toHaveCount(total);
  await page.screenshot({path:'.playwright/chapter-atlas-gallery.png',fullPage:true});await page.locator('#paths').uncheck();await expect(page.locator('polyline')).toHaveCount(0);
});
