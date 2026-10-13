import { progress } from '../game/Progress';
import type { World } from '../game/World';
import type { Session } from '../scenes/GameScene';
import { audio } from '../game/AudioManager';
export const tankIcon = '<svg viewBox="0 0 34 24" aria-hidden="true"><rect x="3" y="4" width="27" height="5" rx="2"/><rect x="3" y="17" width="27" height="5" rx="2"/><rect x="5" y="7" width="23" height="12" rx="3"/><rect x="13" y="10" width="13" height="6" rx="3"/><rect x="22" y="12" width="11" height="3" rx="1"/></svg>';
export class HUD {
  private previous = { score: -1, lives: -1, enemies: -1, ammo: -1 };
  private partnerAmmo?: HTMLElement; private teamStatus?: HTMLElement;
  private score: HTMLElement; private lives: HTMLElement; private enemies: HTMLElement; private ammo: HTMLElement;
  constructor(private root: HTMLElement, world: World, session: Session, pause: () => void) {
    root.innerHTML = `<div class="game-top"><span class="mini-brand">WOODEN <b>TANKS</b><span class="brand-dot"></span></span><span class="level-name">${world.level.name}</span>${session.coop ? '<span id="team-status" class="team-status" role="status"></span>' : ''}<button class="icon-button pause-button" aria-label="Pausar" title="Pausar (P / Esc)"><span class="pause-icon"></span></button></div>
    <div class="game-hud ${session.coop ? 'coop-hud' : ''}"><div class="player-score"><span class="player-id">${session.coop ? 'P1<span class="partner-id">P2</span>' : 'P1'}</span><div><span class="label">${session.coop ? 'PUNTUACIÓN DEL EQUIPO' : 'PUNTUACIÓN'}</span><strong id="score">000000</strong></div></div><div class="mission-plaque"><span class="label">CAMPAÑA</span><span>MISIÓN <b>${String(world.level.id).padStart(2, '0')}</b></span><i></i><span class="lives">${tankIcon}<b id="lives">× ${session.lives}</b></span></div><div class="combat-stats"><div><span class="label">ENEMIGOS</span><strong id="enemies"></strong></div><div class="ammo-wrap"><span class="label">PROYECTILES</span>${session.coop ? '<div class="coop-ammo-row"><b>P1</b><div id="ammo"></div></div><div class="coop-ammo-row partner-ammo"><b>P2</b><div id="ammo-p2"></div></div>' : '<div id="ammo"></div>'}</div><button class="icon-button sound-button" aria-label="Activar o silenciar sonido" title="Sonido (M)">${audio.muted ? '♪̸' : '♪'}</button></div></div><div class="controls-strip">${session.coop ? `<span>P1: ${session.coop === 'two-pads' ? 'control 1 · LS / RS / RT' : 'WASD · mouse · clic / espacio'}</span><span>P2${world.players.length > 2 ? '–P' + world.players.length : ''}: LS / RS / RT</span><span>Fuego amigo activo · P / MENÚ / ESC pausa</span>` : '<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> mover</span><span><span class="mouse-symbol">→</span> apuntar · clic / espacio disparar</span><span>2 rebotes · disparo continuo · <kbd>P</kbd> / <kbd>ESC</kbd> pausa</span>'}</div>`;
    if (world.players.length > 2) {
      const container = root.querySelector('.ammo-wrap')!;
      for (let i = 2; i < world.players.length; i++) container.insertAdjacentHTML('beforeend', `<div class="coop-ammo-row player-${i + 1}"><b>P${i + 1}</b><div id="ammo-p${i + 1}"></div></div>`);
      root.querySelector('.player-id')!.innerHTML = world.players.map((_, i) => `<span style="color:${['#24667b', '#bc4240', '#31733b', '#8e751e'][i]}">P${i + 1}</span>`).join(' ');
    }
    if (session.mode === 'duel') {
      root.querySelector('.game-hud')!.classList.add('duel-hud');
      root.querySelector('.player-score .label')!.textContent = 'VICTORIAS · PRIMERO A 3';
      root.querySelector('.mission-plaque')!.innerHTML = `<span class="label">DUELO LOCAL</span><span>RONDA <b>${session.round ?? 1}</b></span><b id="lives">TODOS CONTRA TODOS</b>`;
      root.querySelector('.combat-stats > div > .label')!.textContent = 'EN JUEGO';
      root.querySelector('.controls-strip > span:last-child')!.textContent = 'Último tanque vivo · P / ESC / MENÚ pausa';
    }
    this.score = root.querySelector('#score')!; this.lives = root.querySelector('#lives')!; this.enemies = root.querySelector('#enemies')!; this.ammo = root.querySelector('#ammo')!;
    this.partnerAmmo = root.querySelector<HTMLElement>('#ammo-p2') ?? undefined; this.teamStatus = root.querySelector<HTMLElement>('#team-status') ?? undefined;
    root.querySelector('.pause-button')!.addEventListener('click', pause);
    root.querySelector('.sound-button')!.addEventListener('click', () => this.toggleSound());
    this.update(world, session);
  }
  toggleSound() { audio.unlock(); audio.muted = !audio.muted; progress.data.muted = audio.muted; progress.save(); this.root.querySelector('.sound-button')!.textContent = audio.muted ? '♪̸' : '♪'; }
  update(world: World, session: Session) {
    if (session.mode === 'duel') {
      this.score.textContent = world.players.map((_, i) => `P${i + 1}: ${session.wins?.[i] ?? 0}`).join(' · ');
      this.enemies.textContent = String(world.alivePlayers.length).padStart(2, '0');
      this.lives.textContent = 'TODOS CONTRA TODOS';
    }
    if (session.mode !== 'duel' && this.previous.score !== session.score) this.score.textContent = String(session.score).padStart(6, '0');
    if (session.mode !== 'duel' && this.previous.lives !== session.lives) this.lives.textContent = `× ${session.lives}`;
    const count = world.enemies.length;
    if (session.mode !== 'duel' && this.previous.enemies !== count) this.enemies.textContent = String(count).padStart(2, '0');
    const active = world.projectiles.filter(p => p.owner === 0).length;
    this.ammo.textContent = String(active).padStart(2, '0');
    if (this.partnerAmmo) {
      const partner = world.players[1];
      const ammo = (id: number, alive: boolean) => alive ? String(world.projectiles.filter(p => p.owner === id).length).padStart(2, '0') : '—';
      const first = ammo(world.player.id, world.player.alive), second = ammo(partner.id, partner.alive);
      if (this.ammo.innerHTML !== first) this.ammo.innerHTML = first;
      if (this.partnerAmmo.innerHTML !== second) this.partnerAmmo.innerHTML = second;
      world.players.slice(2).forEach((p, i) => {
        const element = this.root.querySelector(`#ammo-p${i + 3}`)!;
        const value = ammo(p.id, p.alive); if (element.innerHTML !== value) element.innerHTML = value;
      });
      const status = world.players.map((p, i) => `P${i + 1} ${p.alive ? 'en juego' : 'fuera'}`).join(' · ') + (session.mode !== 'duel' && world.alivePlayers.length === 1 ? ' · vuelve en la siguiente misión' : '');
      if (this.teamStatus!.textContent !== status) this.teamStatus!.textContent = status;
    }
    this.previous = { score: session.score, lives: session.lives, enemies: count, ammo: active };
  }
}
