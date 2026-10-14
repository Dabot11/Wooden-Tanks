import {test,expect,type Page} from '@playwright/test';
import {waitForPlaying} from './mission-flow';
async function seed(page:Page,count=0){
 await page.addInitScript(count=>{
   localStorage.setItem('wooden-tanks-v1',JSON.stringify({unlocked:1,completedThrough:0,wins:0,best:150,muted:true}));
   (window as any).__hunterPads=Array.from({length:count},(_,index)=>({index,id:'Xbox Series Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
   Object.defineProperty(navigator,'getGamepads',{value:()=>(window as any).__hunterPads});
 },count);
}
async function trial(page:Page,count=1){
 await page.goto('/');await page.locator('#hunter-test').click();
 if(count===1)await page.getByRole('button',{name:'Probar solo →',exact:true}).click();
 else{
   await page.getByRole('button',{name:'Probar en equipo →',exact:true}).click();
   if(count!==2)await page.getByRole('button',{name:`${count} jugadores`,exact:true}).click();
   await page.getByRole('button',{name:'Jugar con controles →',exact:true}).click();await page.waitForTimeout(200);
   await page.evaluate(()=>(window as any).__hunterPads.forEach((p:any)=>p.buttons[0]={pressed:true,value:1}));await page.waitForTimeout(200);
   await page.evaluate(()=>(window as any).__hunterPads.forEach((p:any)=>p.buttons[0]={pressed:false,value:0}));
 }
 await page.getByRole('heading',{name:'Encuentro con el cazador',exact:true}).waitFor();
}
test('solo practice shows copper texture, flanking and telegraph, permits a real kill, and never advances the save',async({page})=>{
 test.setTimeout(45000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await trial(page);
 const save=await page.evaluate(()=>localStorage.getItem('wooden-tanks-v1'));
 await expect(page.locator('.enemy-brief-row[data-kind="hunter"]')).toContainText('Cazador cobrizo');
 await expect(page.locator('.brief-total')).toContainText('1 tanque enemigo');await waitForPlaying(page);
 await page.waitForFunction(()=>(window as any).__wooden?.world.enemies[0]?.state==='Flank');
 const charging=await page.waitForFunction(()=>(window as any).__wooden?.world.enemies[0]?.state==='Windup',null,{timeout:15000});await charging.dispose();
 expect(await page.evaluate(()=>{const s=(window as any).__wooden;return s.textures.exists('body-hunter')&&s.children.list.some((o:any)=>o.getData?.('hunter-charge'));})).toBe(true);
 await page.screenshot({path:'.playwright/hunter-windup.png'});
 const shot=await page.evaluate(()=>{
   const w=(window as any).__wooden.world,h=w.enemies[0],p=w.player;
   const angle=Math.atan2(h.y-p.y,h.x-p.x);p.x=h.x-Math.cos(angle)*100;p.y=h.y-Math.sin(angle)*100;p.turret=angle;
   // Preserve hunter windup, but stop AI from advancing while checking the real input shot.
   w.ai.update=()=>{};return {x:h.x,y:h.y};
 });
 // Project world coordinates through the actual camera; the trial uses the ordinary mouse controls.
 const cursor=await page.evaluate(shot=>{const s=(window as any).__wooden,c=s.cameras.main;return {x:(shot.x-c.scrollX)*c.zoom,y:(shot.y-c.scrollY)*c.zoom};},shot);
 await page.mouse.move(cursor.x,cursor.y);await page.waitForTimeout(80);await page.keyboard.press('Space');
 await expect(page.getByRole('heading',{name:'Cazador derrotado',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('wooden-tanks-v1'))).toBe(save);
 await page.getByRole('button',{name:'Repetir práctica →',exact:true}).click();await page.getByRole('heading',{name:'Encuentro con el cazador',exact:true}).waitFor();
 expect(await page.evaluate(()=>(window as any).__wooden.session.practice)).toBe(true);
 await page.getByRole('button',{name:'Volver al menú',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('wooden-tanks-v1'))).toBe(save);expect(errors).toEqual([]);
});
for(const count of [2,3,4])test(`${count} controllers can enter hunter practice, move independently, pause and retry without spawning more hunters`,async({page})=>{
 await seed(page,count);await trial(page,count);
 await expect(page.locator('.brief-total')).toContainText(`1 tanque enemigo · ${count} jugadores`);
 await expect(page.getByRole('button',{name:'Continuar →',exact:true})).toBeInViewport();
 expect(await page.evaluate(()=>{const w=(window as any).__wooden.world;return {players:w.players.length,hunters:w.enemies.filter((e:any)=>e.kind==='hunter').length,obstacles:w.obstacles.length};})).toEqual({players:count,hunters:1,obstacles:2});
 await page.evaluate(()=>{(window as any).__wooden.world.ai.update=()=>{};});await waitForPlaying(page);
 await page.waitForFunction(()=>(window as any).__wooden.world.elapsed>.2);
 const before=await page.evaluate(()=>(window as any).__wooden.world.players.map((p:any)=>p.x));
 await page.evaluate(()=>(window as any).__hunterPads.forEach((p:any)=>p.axes=[1,0,0,0]));
 await page.waitForFunction(before=>(window as any).__wooden.world.players.every((p:any,i:number)=>p.x>before[i]+10),before,{timeout:2000});
 await page.evaluate(()=>(window as any).__hunterPads.forEach((p:any)=>p.axes=[0,0,0,0]));
 const after=await page.evaluate(()=>(window as any).__wooden.world.players.map((p:any)=>p.x));after.forEach((x:number,i:number)=>expect(x).toBeGreaterThan(before[i]+10));
 await page.evaluate(()=>(window as any).__hunterPads.at(-1).buttons[9]={pressed:true,value:1});await page.getByRole('button',{name:'Reanudar →',exact:true}).waitFor();
 await page.evaluate(()=>(window as any).__hunterPads.at(-1).buttons[9]={pressed:false,value:0});
 await page.getByRole('button',{name:'Reiniciar misión',exact:true}).click();await page.getByRole('heading',{name:'Encuentro con el cazador',exact:true}).waitFor();
 expect(await page.evaluate(()=>({practice:(window as any).__wooden.session.practice,count:(window as any).__wooden.world.players.length}))).toEqual({practice:true,count});
 await page.screenshot({path:`.playwright/hunter-team-${count}.png`});
});
test('mission 31 campaign briefing and atlas expose the reduced formation and hunter introduction',async({page})=>{
 await seed(page);await page.goto('/');await page.locator('#play').click();
 await page.evaluate(()=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:30}});});
 await page.waitForFunction(()=>(window as any).__wooden?.world.level.id===31);
 await expect(page.locator('.brief-total')).toContainText('5 tanques enemigos');await expect(page.locator('.enemy-brief-row[data-kind="hunter"]')).toContainText('× 1');
 await expect(page.locator('.mission-briefing')).toContainText('Un solo cazador debuta');
 await page.goto('/solo-campaign-review.html#mission-31');await expect(page.locator('#metrics div').first()).toContainText('5Enemigos');await expect(page.locator('#lesson')).toContainText('cazador');
 await page.goto('/duo-campaign-review.html#mission-31');await expect(page.locator('#metrics div').first()).toContainText('6Enemigos');await expect(page.locator('#lesson')).toContainText('cazador');
});
test('practice defeat finishes the animation and retries the same trial without touching campaign progress',async({page})=>{
 await seed(page);await trial(page);const save=await page.evaluate(()=>localStorage.getItem('wooden-tanks-v1'));await waitForPlaying(page);
 await page.evaluate(()=>{const w=(window as any).__wooden.world,p=w.player;w.projectiles=[{id:99001,owner:w.enemies[0].id,x:p.x,y:p.y,vx:322.5,vy:0,age:1,bounces:0,alive:true}];});
 await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.status)).toBe('dead');await page.waitForTimeout(1200);
 await expect(page.getByRole('button',{name:'Reintentar misión →',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Reintentar misión →',exact:true}).click();await page.getByRole('heading',{name:'Encuentro con el cazador',exact:true}).waitFor();
 expect(await page.evaluate(()=>localStorage.getItem('wooden-tanks-v1'))).toBe(save);expect(await page.evaluate(()=>(window as any).__wooden.session.practice)).toBe(true);
});
for(const scenario of [{count:1,block:false},{count:1,block:true},{count:4,block:true}])test(`${scenario.count} players: hunter ${scenario.block?'blocks':'evades'} a real input shot with its defensive AI active`,async({page})=>{
 await seed(page,scenario.count===1?0:scenario.count);await trial(page,scenario.count);await waitForPlaying(page);
 await page.waitForFunction(()=>{
   const s=(window as any).__wooden,h=s?.world.enemies[0];
   if(h?.state!=='Windup'||h.hunter.charge>.1)return false;
   // Hold the fixture while arranging the shot; resume the ordinary loop with its AI intact below.
   s.status='intro';return true;
 },null,{timeout:15000});
 const setup=await page.evaluate(block=>{
   const s=(window as any).__wooden,w=s.world,h=w.enemies[0],p=w.player,c=s.cameras.main;
   const angle=Math.atan2(h.y-p.y,h.x-p.x);p.x=h.x-Math.cos(angle)*250;p.y=h.y-Math.sin(angle)*250;p.turret=angle;
   h.turret=angle+Math.PI;h.cooldown=block?0:10;
   return {x:(h.x-c.scrollX)*c.zoom,y:(h.y-c.scrollY)*c.zoom,axisX:Math.cos(angle),axisY:Math.sin(angle),elapsed:w.elapsed};
 },scenario.block);
 if(scenario.count===1){await page.mouse.move(setup.x,setup.y);await page.keyboard.down('Space');}
 else await page.evaluate(({axisX,axisY})=>{const p=(window as any).__hunterPads[0];p.axes=[0,0,axisX,axisY];p.buttons[7]={pressed:true,value:1};},setup);
 await page.evaluate(()=>{(window as any).__wooden.status='playing';});
 const state=scenario.block?'Guard':'Evade';
 await page.waitForFunction(state=>(window as any).__wooden.world.enemies[0]?.state===state,state,{timeout:2000});
 if(scenario.count===1)await page.keyboard.up('Space');
 else await page.evaluate(()=>{(window as any).__hunterPads[0].buttons[7]={pressed:false,value:0};});
 if(scenario.block){
   expect(await page.evaluate(()=>{const s=(window as any).__wooden;return s.children.list.some((o:any)=>o.getData?.('hunter-charge')&&o.commandBuffer?.includes(0xa7d4d6));})).toBe(true);
   await page.waitForFunction(()=>(window as any).__wooden.children.list.some((o:any)=>o.getData?.('shell-explosion')),null,{timeout:2000});
   expect(await page.evaluate(()=>{const h=(window as any).__wooden.world.enemies[0];return {shots:h.shots,alive:h.alive,state:h.state};})).toEqual({shots:1,alive:true,state:'Recover'});
   expect(await page.evaluate(()=>(window as any).__wooden.children.list.some((o:any)=>o.getData?.('shell-explosion')))).toBe(true);
 }else{
   await page.waitForTimeout(850);expect(await page.evaluate(()=>{const h=(window as any).__wooden.world.enemies[0];return {alive:h.alive,shots:h.shots};})).toEqual({alive:true,shots:0});
 }
});
