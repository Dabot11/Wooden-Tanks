import type Phaser from 'phaser';
import type { World } from '../game/World';
import { showOverlay } from './Overlay';
export const ENEMY_BRIEF = [
  { kind: 'basic', name: 'Explorador gris', details: 'Móvil · un misil · sin rebotes', color: '#81868a' },
  { kind: 'patrol', name: 'Patrullero violeta', details: 'Móvil · un rebote · puede esquivar', color: '#82659b' },
  { kind: 'tactical', name: 'Centinela', details: 'Inmóvil · un rebote · misiles rápidos · intercepta', color: '#b97835' },
  { kind: 'hunter', name: 'Cazador cobrizo', details: 'Flanquea y esquiva · contratiro · misil veloz · un rebote', color: '#a66d48' },
] as const;
const portraits = new WeakMap<Phaser.Textures.TextureManager, Map<string, string>>();
const wood = new WeakMap<Phaser.Textures.TextureManager, string>();
/** Compose the same hull and turret textures used on the battlefield. */
function tankPortrait(textures: Phaser.Textures.TextureManager, kind: string) {
  let cache = portraits.get(textures);
  if (!cache) { cache = new Map(); portraits.set(textures, cache); }
  if (!cache.has(kind)) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(100, 100); ctx.rotate(-Math.PI / 4); ctx.scale(2.4, 2.4);
    for (const part of ['body', 'turret']) ctx.drawImage(textures.get(`${part}-${kind}`).getSourceImage() as HTMLCanvasElement, -45, -45);
    cache.set(kind, canvas.toDataURL());
  }
  return cache.get(kind)!;
}
export function showMissionBriefing(root: HTMLElement, world: World, proceed: () => void, cancel: () => void, textures: Phaser.Textures.TextureManager) {
  const remove = showOverlay(root, { eyebrow: `MISIÓN ${String(world.level.id).padStart(2, '0')}`, title: world.level.name,
    description: world.level.subtitle, cancel, actions: [{ text: 'Continuar →', run: proceed }, { text: 'Salir de la campaña', secondary: true, danger: true, run: cancel }] });
  const card = root.querySelector<HTMLElement>('.modal:last-child')!;
  card.classList.add('mission-briefing'); card.querySelector('.modal-symbol')!.remove();
  // JPEG keeps the floor preview small enough for a CSS custom property.
  if (!wood.has(textures)) wood.set(textures, textures.getBase64('floor', undefined, 'image/jpeg', .8));
  card.style.setProperty('--brief-wood', `url("${wood.get(textures)}")`);
  const heading = card.querySelector('h2')!; heading.id = 'mission-brief-title'; card.setAttribute('aria-labelledby', heading.id);
  const header = document.createElement('header'); header.className = 'brief-header';
  const number = document.createElement('span'); number.className = 'brief-mission-number'; number.textContent = String(world.level.id).padStart(2, '0'); number.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('div'); copy.append(card.querySelector('.eyebrow')!, heading, card.querySelector('p')!);
  header.append(number, copy); card.prepend(header);
  const roster = document.createElement('div'); roster.className = 'enemy-brief'; roster.setAttribute('role', 'list'); roster.setAttribute('aria-label', 'Enemigos de la misión');
  for (const enemy of ENEMY_BRIEF) {
    const count = world.enemies.filter(t => t.kind === enemy.kind).length;
    if (!count) continue;
    const row = document.createElement('div'); row.className = 'enemy-brief-row'; row.dataset.kind = enemy.kind;
    row.setAttribute('role', 'listitem'); row.setAttribute('aria-label', `${enemy.name}: ${count}. ${enemy.details}`);
    row.style.setProperty('--enemy-paint', enemy.color);
    row.innerHTML = `<div class="brief-tank"><img src="${tankPortrait(textures, enemy.kind)}" alt="" width="200" height="200" draggable="false"><b>× ${count}</b></div><strong>${enemy.name}</strong>`;
    roster.append(row);
  }
  const label = document.createElement('span'); label.className = 'brief-roster-label'; label.textContent = 'FUERZAS ENEMIGAS';
  const total = document.createElement('p'); total.className = 'brief-total'; total.textContent = `${world.enemies.length} ${world.enemies.length===1?'tanque enemigo':'tanques enemigos'} · ${world.players.length} ${world.players.length === 1 ? 'jugador' : 'jugadores'}`;
  card.querySelector('.modal-actions')!.before(label, roster, total);
  const cooperation = world.level.design?.cooperation;
  if (cooperation && cooperation.roles.length === world.players.length) {
    const plan = document.createElement('div'); plan.className = 'coop-plan'; plan.setAttribute('aria-label', 'Plan sugerido para el equipo');
    for (const role of cooperation.roles) {
      const hint = document.createElement('p'); hint.textContent = role; plan.append(hint);
    }
    total.before(plan);
  }
  return remove;
}
