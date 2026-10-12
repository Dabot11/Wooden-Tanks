import { progress } from '../game/Progress';
import { SHOT_LIMIT } from '../game/types';
import type { World } from '../game/World';
import type { Session } from '../scenes/GameScene';
import { audio } from '../game/AudioManager';
export const tankIcon = '<svg viewBox="0 0 34 24" aria-hidden="true"><rect x="3" y="4" width="27" height="5" rx="2"/><rect x="3" y="17" width="27" height="5" rx="2"/><rect x="5" y="7" width="23" height="12" rx="3"/><rect x="13" y="10" width="13" height="6" rx="3"/><rect x="22" y="12" width="11" height="3" rx="1"/></svg>';
export class HUD {
  private previous = { score: -1, lives: -1, enemies: -1, ammo: -1 };
  private partnerAmmo?: HTMLElement; private teamStatus?: HTMLElement;
  private score: HTMLElement; private lives: HTMLElement; private enemies: HTMLElement; private ammo: HTMLElement;
  constructor(private root: HTMLElement, world: World, session: Session, pause: () => void) {
    root.innerHTML = `<div class="game-top"><span class="mini-brand">WOODEN <b>TANKS</b><span class="brand-dot"></span></span><span class="level-name">${world.level.name}</span>${session.coop ? '<span id="team-status" class="team-status" role="status"></span>' : ''}<button class="icon-button pause-button" aria-label="Pausar" title="Pausar (Esc)"><span class="pause-icon"></span></button></div>
    <div class="game-hud ${session.coop ? 'coop-hud' : ''}"><div class="player-score"><span class="player-id">${session.coop ? 'P1<span class="partner-id">P2</span>' : 'P1'}</span><div><span class="label">${session.coop ? 'PUNTUACIÓN DEL EQUIPO' : 'PUNTUACIÓN'}</span><strong id="score">000000</strong></div></div><div class="mission-plaque"><span class="label">${session.level === -1 ? 'DEMOSTRACIÓN' : 'CAMPAÑA'}</span><span>MISIÓN <b>${String(world.level.id).padStart(2, '0')}</b></span><i></i><span class="lives">${tankIcon}<b id="lives">× ${session.lives}</b></span></div><div class="combat-stats"><div><span class="label">ENEMIGOS</span><strong id="enemies"></strong></div><div class="ammo-wrap"><span class="label">PROYECTILES</span>${session.coop ? '<div class="coop-ammo-row"><b>P1</b><div id="ammo"></div></div><div class="coop-ammo-row partner-ammo"><b>P2</b><div id="ammo-p2"></div></div>' : '<div id="ammo"></div>'}</div><button class="icon-button sound-button" aria-label="Activar o silenciar sonido" title="Sonido (M)">${audio.muted ? '♪̸' : '♪'}</button></div></div><div class="controls-strip">${session.coop ? `<span>P1: ${session.coop === 'two-pads' ? 'control 1 · LS / RS / RT' : 'WASD · mouse · clic / espacio'}</span><span>P2: control ${session.coop === 'two-pads' ? '2' : '1'} · LS / RS / RT</span><span>Sin daño entre compañeros · MENÚ / ESC pausa</span>` : '<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> mover</span><span><span class="mouse-symbol">→</span> apuntar · clic / espacio disparar</span><span>2 rebotes · 5 proyectiles · <kbd>ESC</kbd> pausa</span>'}</div>`;
    this.score = root.querySelector('#score')!; this.lives = root.querySelector('#lives')!; this.enemies = root.querySelector('#enemies')!; this.ammo = root.querySelector('#ammo')!;
    this.partnerAmmo = root.querySelector<HTMLElement>('#ammo-p2') ?? undefined; this.teamStatus = root.querySelector<HTMLElement>('#team-status') ?? undefined;
    root.querySelector('.pause-button')!.addEventListener('click', pause);
    root.querySelector('.sound-button')!.addEventListener('click', () => this.toggleSound());
    this.update(world, session);
  }
  toggleSound() { audio.unlock(); audio.muted = !audio.muted; progress.data.muted = audio.muted; progress.save(); this.root.querySelector('.sound-button')!.textContent = audio.muted ? '♪̸' : '♪'; }
  update(world: World, session: Session) {
    if (this.previous.score !== session.score) this.score.textContent = String(session.score).padStart(6, '0');
    if (this.previous.lives !== session.lives) this.lives.textContent = `× ${session.lives}`;
    const count = world.enemies.length;
    if (this.previous.enemies !== count) this.enemies.textContent = String(count).padStart(2, '0');
    const active = world.projectiles.filter(p => p.owner === 0).length;
    if (this.previous.ammo !== active) this.ammo.innerHTML = Array.from({ length: SHOT_LIMIT }, (_, i) => `<i class="ammo ${i < SHOT_LIMIT - active ? 'ready' : ''}"></i>`).join('');
    if (this.partnerAmmo) {
      const partner = world.players[1];
      const ammo = (id: number, alive: boolean) => Array.from({ length: SHOT_LIMIT }, (_, i) => `<i class="ammo ${alive && i < SHOT_LIMIT - world.projectiles.filter(p => p.owner === id).length ? 'ready' : ''}"></i>`).join('');
      const first = ammo(world.player.id, world.player.alive), second = ammo(partner.id, partner.alive);
      if (this.ammo.innerHTML !== first) this.ammo.innerHTML = first;
      if (this.partnerAmmo.innerHTML !== second) this.partnerAmmo.innerHTML = second;
      const status = world.players.map((p, i) => `P${i + 1} ${p.alive ? 'en juego' : 'fuera'}`).join(' · ') + (world.alivePlayers.length === 1 ? ' · vuelve en la siguiente misión' : '');
      if (this.teamStatus!.textContent !== status) this.teamStatus!.textContent = status;
    }
    this.previous = { score: session.score, lives: session.lives, enemies: count, ammo: active };
  }
}
