import type { World } from '../game/World';
import { showOverlay } from './Overlay';
import { tankIcon } from './HUD';
export const ENEMY_BRIEF = [
  { kind: 'basic', name: 'Explorador gris', details: 'Móvil · un misil · sin rebotes', color: '#81868a' },
  { kind: 'patrol', name: 'Patrullero violeta', details: 'Móvil · un rebote · puede esquivar', color: '#82659b' },
  { kind: 'tactical', name: 'Centinela', details: 'Inmóvil · un rebote · misiles rápidos · intercepta', color: '#b97835' },
  { kind: 'hunter', name: 'Cazador cobrizo', details: 'Flanquea y esquiva · contratiro · misil veloz · un rebote', color: '#a66d48' },
] as const;
export function showMissionBriefing(root: HTMLElement, world: World, proceed: () => void, cancel: () => void) {
  const remove = showOverlay(root, { eyebrow: `MISIÓN ${String(world.level.id).padStart(2, '0')}`, title: world.level.name,
    description: world.level.subtitle, cancel, actions: [{ text: 'Continuar →', run: proceed }, { text: 'Volver al menú', secondary: true, run: cancel }] });
  const card = root.querySelector<HTMLElement>('.modal:last-child')!;
  card.classList.add('mission-briefing'); card.querySelector('.modal-symbol')!.remove();
  const roster = document.createElement('div'); roster.className = 'enemy-brief';
  const hasHunter=world.enemies.some(t=>t.kind==='hunter');
  for (const enemy of ENEMY_BRIEF) {
    const count = world.enemies.filter(t => t.kind === enemy.kind).length;
    if(!count&&(hasHunter||enemy.kind==='hunter'))continue;
    const row = document.createElement('div'); row.className = 'enemy-brief-row'; row.dataset.kind = enemy.kind;
    row.innerHTML = `<span class="brief-tank" style="color:${enemy.color}">${tankIcon}</span><div><strong>${enemy.name}</strong><small>${enemy.details}</small></div><b>× ${count}</b>`;
    roster.append(row);
  }
  const total = document.createElement('p'); total.className = 'brief-total'; total.textContent = `${world.enemies.length} ${world.enemies.length===1?'tanque enemigo':'tanques enemigos'} · ${world.players.length} ${world.players.length === 1 ? 'jugador' : 'jugadores'}`;
  card.querySelector('.modal-actions')!.before(roster, total);
  const cooperation = world.level.design?.cooperation;
  if (cooperation && cooperation.roles.length === world.players.length) {
    const plan = document.createElement('div'); plan.className = 'coop-plan'; plan.setAttribute('aria-label', 'Plan sugerido para la pareja');
    for (const role of cooperation.roles) {
      const hint = document.createElement('p'); hint.textContent = role; plan.append(hint);
    }
    total.before(plan);
  }
  return remove;
}
