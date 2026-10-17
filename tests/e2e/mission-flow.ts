import { expect, type Page } from '@playwright/test';
export async function waitForPlaying(page: Page) {
  await page.waitForFunction(() => { const scene = (window as any).__wooden; return scene && (scene.status === 'intro' || scene.status === 'countdown' || scene.status === 'playing' || (scene.status === 'ended' && scene.session.lives > 0 && scene.session.mode !== 'duel')); });
  if (await page.getByRole('button', { name: 'Reintentar misión →', exact: true }).count()) {
    await page.getByRole('button', { name: 'Reintentar misión →', exact: true }).click();
    await page.waitForFunction(() => (window as any).__wooden?.status === 'intro');
  }
  const needsBriefing = await page.evaluate(() => { const scene=(window as any).__wooden; return scene?.status==='intro' && scene.session.mode!=='duel'; });
  if(needsBriefing && await page.locator('.mission-briefing').count()) await page.getByRole('button',{name:'Continuar →',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__wooden?.status)).toBe('playing');
}
