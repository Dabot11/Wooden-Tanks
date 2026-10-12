import { test, expect, type Page } from '@playwright/test';
async function pads(page: Page, count: number) {
  await page.addInitScript(count => {
    const names=['Xbox Series Controller','Nintendo Switch Pro Controller','Sony DualSense','Xbox Series Controller'];
    (window as any).__lobbyPads=Array.from({length:count},(_,index)=>({index,id:names[index],connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
    Object.defineProperty(navigator,'getGamepads',{value:()=>(window as any).__lobbyPads});
    localStorage.setItem('wooden-tanks-v1',JSON.stringify({unlocked:3,best:100,muted:true,wins:1}));
  },count);
}
async function ready(page: Page, index: number) {
  await page.evaluate(i=>(window as any).__lobbyPads[i].buttons[0]={pressed:true,value:1},index);
  await page.waitForTimeout(120);
  await page.evaluate(i=>(window as any).__lobbyPads[i].buttons[0]={pressed:false,value:0},index);
  await page.waitForTimeout(80); // Let the lobby observe neutral before the next press.
}
async function open(page:Page,count:number,keyboard=false) {
  await pads(page,count-(keyboard?1:0)); await page.goto('/'); await page.locator('#duel').click();
  await page.getByRole('button',{name:`${count} jugadores`,exact:true}).click();
  if(keyboard) await page.getByRole('button',{name:'Teclado + controles →',exact:true}).click();
  await page.waitForTimeout(150);
  if(keyboard) await page.keyboard.press('Enter');
  for(let i=0;i<count-(keyboard?1:0);i++) await ready(page,i);
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden?.status)).toBe('playing');
  await page.waitForTimeout(100);
}
for(const count of [2,3,4]) test(`${count}-player duel waits for each device and supports P pause and unpause`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await open(page,count);
  expect(await page.evaluate(()=>(window as any).__wooden.world.players.length)).toBe(count);
  expect(await page.evaluate(()=>(window as any).__wooden.world.enemies.length)).toBe(0);
  await expect(page.locator('.mission-plaque')).toContainText('RONDA 1');
  await page.keyboard.down('p');await page.waitForTimeout(250);
  await expect(page.getByRole('heading',{name:'Una pequeña pausa'})).toBeVisible();
  await page.keyboard.up('p');await page.keyboard.press('p');
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.status)).toBe('playing');
  const score = await page.locator('#score').boundingBox(), plaque = await page.locator('.mission-plaque').boundingBox(), app = await page.locator('#app').boundingBox();
  expect(score!.x + score!.width).toBeLessThan(plaque!.x); expect(score!.y + score!.height).toBeLessThan(app!.y + app!.height);
  await page.screenshot({path:`.playwright/duel-${count}.png`});expect(errors).toEqual([]);
});
test('lobby shows brands, missing devices, individual readiness and reconnect confirmation',async({page})=>{
  await pads(page,3);await page.goto('/');await page.locator('#duel').click();await page.getByRole('button',{name:'4 jugadores',exact:true}).click();
  await expect(page.locator('.lobby-roster')).toContainText('Xbox');await expect(page.locator('.lobby-roster')).toContainText('Nintendo');await expect(page.locator('.lobby-roster')).toContainText('PlayStation');
  await expect(page.locator('.coop-detection')).toContainText('Falta agregar 1 control');
  await ready(page,0);await expect(page.locator('.lobby-player').nth(0)).toHaveAttribute('data-ready','true');
  await expect(page.locator('.player-lobby')).toBeVisible();
  await page.evaluate(()=>(window as any).__lobbyPads[0].connected=false);
  await expect(page.locator('.lobby-player').nth(0)).toContainText('Desconectado');
  await expect(page.locator('.lobby-player').nth(0)).toHaveAttribute('data-ready','false');
  await page.evaluate(()=>{(window as any).__lobbyPads[0].connected=true;(window as any).__lobbyPads[0].buttons[0]={pressed:true,value:1};});
  await page.waitForTimeout(150);await expect(page.locator('.lobby-player').nth(0)).toHaveAttribute('data-ready','false');
  await page.evaluate(()=>(window as any).__lobbyPads[0].buttons[0]={pressed:false,value:0});await page.waitForTimeout(100);await ready(page,0);
  await expect(page.locator('.lobby-player').nth(0)).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Teclado + controles →',exact:true}).click();
  await expect(page.locator('.lobby-player').nth(0)).toContainText('Teclado y mouse');
  await expect(page.locator('.lobby-player[data-ready="true"]')).toHaveCount(0);
  await expect(page.locator('.keyboard-ready')).toBeFocused();
  await page.keyboard.down('Enter'); await page.keyboard.down('Enter'); await page.keyboard.up('Enter');
  await expect(page.locator('.lobby-player').nth(0)).toHaveAttribute('data-ready','true');
  await page.screenshot({path:'.playwright/player-lobby.png'});
});
test('duel handles a draw, three victories and a rematch without changing campaign progress',async({page})=>{
  test.setTimeout(60000);await open(page,4,true);
  const save=await page.evaluate(()=>localStorage.getItem('wooden-tanks-v1'));
  await page.evaluate(()=>{const w=(window as any).__wooden.world;w.projectiles=w.players.map((p:any,i:number)=>({id:90000+i,owner:99,x:p.x,y:p.y,vx:322.5,vy:0,age:1,bounces:0,alive:true}));});
  await expect(page.getByRole('heading',{name:'Empate',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Repetir ronda →',exact:true}).click();
  for(let wins=1;wins<=3;wins++) {
    await expect.poll(()=>page.evaluate(()=>(window as any).__wooden?.status)).toBe('playing');
    await page.evaluate(()=>{const w=(window as any).__wooden.world;w.projectiles=w.players.filter((_:any,i:number)=>i!==2).map((p:any,i:number)=>({id:91000+i,owner:-2,x:p.x,y:p.y,vx:322.5,vy:0,age:1,bounces:0,alive:true}));});
    await expect(page.getByRole('heading',{name:wins===3?'P3 gana el duelo':'P3 gana la ronda',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>(window as any).__wooden.session.wins[2])).toBe(wins);
    await expect(page.locator('#score')).toContainText(`P3: ${wins}`);
    await page.getByRole('button',{name:wins===3?'Revancha →':'Siguiente ronda →',exact:true}).click();
  }
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden?.status)).toBe('playing');
  expect(await page.evaluate(()=>(window as any).__wooden.session.wins)).toEqual([0,0,0,0]);
  expect(await page.evaluate(()=>(window as any).__wooden.world.players.length)).toBe(4);
  expect(await page.evaluate(()=>localStorage.getItem('wooden-tanks-v1'))).toBe(save);
});
test('a controller can choose party size with D-pad and A, then ready without activating configuration again',async({page})=>{
  await pads(page,3);await page.goto('/');await page.locator('#duel').click();await page.waitForTimeout(150);
  for(let i=0;i<2;i++) {
    await page.evaluate(()=>(window as any).__lobbyPads[0].buttons[12]={pressed:true,value:1});await page.waitForTimeout(120);
    await page.evaluate(()=>(window as any).__lobbyPads[0].buttons[12]={pressed:false,value:0});await page.waitForTimeout(120);
  }
  await expect(page.getByRole('button',{name:'3 jugadores',exact:true})).toBeFocused();
  await ready(page,0);await expect(page.locator('.lobby-player')).toHaveCount(3);
  await expect(page.locator('.lobby-player[data-ready="true"]')).toHaveCount(0);
  await ready(page,0);await expect(page.locator('.lobby-player').nth(0)).toHaveAttribute('data-ready','true');
  await page.evaluate(()=>(window as any).__lobbyPads[0].buttons[12]={pressed:true,value:1});await page.waitForTimeout(120);
  await page.evaluate(()=>(window as any).__lobbyPads[0].buttons[12]={pressed:false,value:0});
  await page.getByRole('button',{name:'3 jugadores',exact:true}).click();
  await ready(page,0);await expect(page.locator('.lobby-player').nth(0)).toHaveAttribute('data-ready','true');
});
