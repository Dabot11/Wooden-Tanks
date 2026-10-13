import { expect, type Page } from '@playwright/test';
export async function waitForPlaying(page: Page) {
  await page.waitForFunction(() => { const scene = (window as any).__wooden; return scene && (scene.status === 'intro' || scene.status === 'playing'); });
  const needsBriefing = await page.evaluate(() => { const scene=(window as any).__wooden; return scene?.status==='intro' && scene.session.mode!=='duel'; });
  if(needsBriefing) await page.getByRole('button',{name:'Continuar →',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden?.status)).toBe('playing');
}
