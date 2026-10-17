import { levels, getLevel } from '../../src/game/LevelManager';
import { test, expect } from '@playwright/test';
test('briefing waits indefinitely, displays the roster, continues and returns before the next mission', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  await expect(page.getByRole('heading', { name: 'Primeras huellas', exact: true })).toBeVisible();
  await expect(page.locator('.enemy-brief-row[data-kind="basic"]')).toContainText('× 1');
  await expect(page.locator('.enemy-brief-row')).toHaveCount(1);
  await expect(page.locator('.enemy-brief-row[data-kind="tactical"]')).toHaveCount(0);
  await expect(page.locator('.enemy-brief-row img')).toBeVisible();
  expect(await page.locator('.mission-briefing').evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('url(');
  await expect(page.getByRole('button',{name:'Salir de la campaña',exact:true})).toBeInViewport({ratio:1});
  await page.waitForTimeout(600); // Let the decorative entrance finish for the visual review.
  await page.screenshot({path:'.playwright/briefing-new-solo.png'});
  const before=await page.evaluate(()=>{const w=(window as any).__wooden.world;return {elapsed:w.elapsed,positions:w.tanks.map((p:any)=>[p.x,p.y]),shots:w.projectiles.length};});
  await page.keyboard.down('w'); await page.keyboard.down('Space'); await page.waitForTimeout(1800); await page.keyboard.up('w'); await page.keyboard.up('Space');
  expect(await page.evaluate(()=>{const w=(window as any).__wooden.world;return {elapsed:w.elapsed,positions:w.tanks.map((p:any)=>[p.x,p.y]),shots:w.projectiles.length};})).toEqual(before);
  await page.getByRole('button',{name:'Continuar →',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.status)).toBe('playing');
  await page.evaluate(()=>{const w=(window as any).__wooden.world;w.ai.update=()=>{};w.projectiles=w.enemies.map((p:any,i:number)=>({id:9000+i,owner:0,x:p.x,y:p.y,vx:322.5,vy:0,age:1,bounces:0,alive:true}));});
  await expect(page.getByRole('heading',{name:'Dos esquinas',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>(window as any).__wooden.world.elapsed)).toBe(0);
  await expect(page.locator('.brief-total')).toContainText('2 tanques enemigos');
  await page.screenshot({path:'.playwright/mission-briefing.png'});
  await page.keyboard.press('Enter'); await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.status)).toBe('playing');
});
test('new campaign saves unlock 21 and the selector contains every published mission', async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('wooden-tanks-v1',JSON.stringify({unlocked:20,wins:1,best:24000,muted:true})));
  await page.goto('/');await page.locator('#select').click();await expect(page.locator('.mission-choice')).toHaveCount(levels.length);
  await expect(page.locator('.mission-choice').nth(20)).toBeEnabled();await expect(page.locator('.mission-choice').nth(21)).toBeDisabled();
  await page.locator('.mission-choice').nth(20).click();await expect(page.getByRole('heading',{name:'Primer centinela',exact:true})).toBeVisible();
  await expect(page.locator('.brief-total')).toContainText(`${levels[20].enemies.length} tanques enemigos`);
});
test('audio synthesis renders distinct finite wooden sounds and an audible march',async({page})=>{
  await page.goto('/');
  const results=await page.evaluate(async()=>{
    const module=await import('/src/game/AudioManager.ts');
    const render=async(type:string)=>{
      const ctx=new OfflineAudioContext(1,44100,44100);
      const noise=ctx.createBuffer(1,26460,44100); let seed=42; const data=noise.getChannelData(0); for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=seed/2147483648-1;}
      if(type==='music') for(let step=0;step<4;step++) module.synthMarch(ctx,ctx.destination,step,step*.2,noise);
      else module.synthSound(ctx,ctx.destination,type as any,0,noise);
      const buffer=await ctx.startRendering(), samples=buffer.getChannelData(0);
      const rms=(a:number,b:number)=>Math.sqrt(samples.slice(a,b).reduce((sum,v)=>sum+v*v,0)/(b-a));
      return {early:rms(0,8000),late:rms(30000,44100),peak:Math.max(...samples.map(Math.abs)),finite:samples.every(Number.isFinite),fingerprint:Array.from(samples.slice(0,4000)).reduce((s,v,i)=>s+v*Math.sin(i*.13),0)};
    };
    return await Promise.all(['shot','bounce','tread','music'].map(render));
  });
  for(const result of results) {expect(result.early).toBeGreaterThan(.005);expect(result.finite).toBe(true);expect(result.peak).toBeLessThan(1);}
  for(const result of results.slice(0,3)) expect(result.late).toBeLessThan(.0001);
  expect(results[0].fingerprint).not.toBeCloseTo(results[1].fingerprint,2);
});
test('music and tread effects obey actual movement, pause, mute and resume',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.locator('#play').click();await page.getByRole('button',{name:'Continuar →',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.audioState.context)).toBe('running');
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.audioState.musicScheduled)).toBe(true);
  await page.evaluate(async()=>{
    const {audio}=await import('/src/game/AudioManager.ts');const original=audio.play.bind(audio);
    (window as any).__treads=0;audio.play=(kind:any)=>{if(kind==='tread')(window as any).__treads++;original(kind);};
    (window as any).__wooden.world.ai.update=()=>{};
  });
  await page.waitForTimeout(200);expect(await page.evaluate(()=>(window as any).__treads)).toBe(0);
  await page.keyboard.down('d');await expect.poll(()=>page.evaluate(()=>(window as any).__treads)).toBeGreaterThan(1);await page.keyboard.up('d');
  await page.keyboard.press('p');await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.audioState.musicScheduled)).toBe(false);
  await page.waitForTimeout(150);expect(await page.evaluate(()=>(window as any).__wooden.audioState.voices)).toBe(0);
  await page.keyboard.press('p');await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.audioState.musicScheduled)).toBe(true);
  await page.keyboard.press('m');await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.audioState.muted)).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.audioState.musicScheduled)).toBe(false);
  await page.keyboard.press('m');await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.audioState.musicScheduled)).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.audioState.voices)).toBeLessThan(90);expect(errors).toEqual([]);
});
test('four-player chapter briefing includes all reinforcements and accepts Continue from P4',async({page})=>{
  await page.setViewportSize({width:1024,height:576});
  await page.addInitScript(()=>{
    (window as any).__briefPads=Array.from({length:4},(_,index)=>({index,id:'Xbox Series Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
    Object.defineProperty(navigator,'getGamepads',{value:()=>(window as any).__briefPads});
  });
  await page.goto('/');await page.locator('#coop').click();await page.getByRole('button',{name:'4 jugadores',exact:true}).click();
  await page.getByRole('button',{name:'Jugar con controles →',exact:true}).click();await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Empezar partida →', exact: true }).click();
  await expect(page.locator('.brief-total')).toContainText('4 tanques enemigos · 4 jugadores');
  await page.evaluate(()=>{const s=(window as any).__wooden;s.scene.restart({session:{...s.session,level:31}});});
  await expect(page.getByRole('heading',{name:'Callejón de astillas',exact:true})).toBeVisible();
  const level=getLevel(31,4);
  await expect(page.locator('.brief-total')).toContainText(`${level.enemies.length} tanques enemigos · 4 jugadores`);
  await expect(page.locator('.enemy-brief-row')).toHaveCount(4);
  for(const kind of ['basic','patrol','tactical','hunter']) {
    const row=page.locator(`.enemy-brief-row[data-kind="${kind}"]`);
    await expect(row).toContainText(`× ${level.enemies.filter(e=>e.kind===kind).length}`);
    await expect(row.locator('img')).toBeVisible();
  }
  const loaded=await page.locator('.enemy-brief-row img').evaluateAll(images=>images.every(i=>(i as HTMLImageElement).complete&&(i as HTMLImageElement).naturalWidth>0));expect(loaded).toBe(true);
  for(const name of ['Continuar →','Salir de la campaña'])await expect(page.getByRole('button',{name,exact:true})).toBeInViewport({ratio:1});
  await page.waitForTimeout(600);
  await page.screenshot({path:'.playwright/briefing-new-four.png'});
  await page.evaluate(()=>(window as any).__briefPads[3].buttons[0]={pressed:true,value:1});
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden.status)).toBe('playing');
  expect(await page.evaluate(()=>(window as any).__wooden.world.player.shots)).toBe(0);
});
test('a saved mute preference suppresses menu and mission music until explicitly enabled',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('wooden-tanks-v1',JSON.stringify({unlocked:1,best:0,wins:0,muted:true})));
  await page.goto('/');await page.keyboard.press('ArrowDown');
  const state=()=>page.evaluate(async()=>{const {audio}=await import('/src/game/AudioManager.ts');return audio.state;});
  await expect.poll(async()=>(await state()).context).toBe('running');
  expect((await state()).muted).toBe(true);expect((await state()).musicScheduled).toBe(false);
  await page.locator('#play').click();await page.getByRole('button',{name:'Continuar →',exact:true}).click();
  expect((await state()).muted).toBe(true);expect((await state()).musicScheduled).toBe(false);
  await page.keyboard.press('m');await expect.poll(async()=>(await state()).musicScheduled).toBe(true);
});
