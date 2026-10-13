import Phaser from 'phaser';
import { duelLevel, duelResult, DUEL_TARGET } from '../game/Duel';
import { World } from '../game/World';
import { getLevel, levels } from '../game/LevelManager';
import { BoardRenderer } from '../game/BoardRenderer';
import { ParticleEffects } from '../game/ParticleEffects';
import { progress } from '../game/Progress';
import { audio } from '../game/AudioManager';
import { HUD } from '../ui/HUD';
import { showMissionBriefing } from '../ui/MissionBriefing';
import { showOverlay } from '../ui/Overlay';
import type { PlayerCount } from '../game/types';
import type { CoopLayout } from '../input/GamepadTeam';
import { gamepad } from '../input/GamepadRuntime';
import { showGamepadSettings } from '../ui/GamepadSettings';
export interface Session { level: number; score: number; lives: number; missionStartScore: number; coop?: CoopLayout; playerCount?: PlayerCount; mode?: 'duel'; round?: number; wins?: number[] }
export class GameScene extends Phaser.Scene {
  world!: World; session!: Session; status: 'intro' | 'playing' | 'paused' | 'won' | 'dead' | 'ended' = 'intro';
  private board!: BoardRenderer; private effects!: ParticleEffects; private hud!: HUD;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>; private root!: HTMLElement;
  private queuedShot = false; private aimMode: 'default' | 'mouse' | 'gamepad' = 'default'; private padAim = { x: 0, y: -1 };
  private reticle!: HTMLElement; private mouseClient?: { x: number; y: number }; private mouseOnCanvas = false;
  private teamAims = Array.from({ length: 3 }, () => ({ x: 0, y: -1 }));
  private closeBriefing?: () => void;
  private closePause?: () => void; private closePadSettings?: () => void;
  constructor() { super('Game'); }
  init(data: { session?: Session }) {
    this.session = { ...(data.session ?? { level: 0, score: 0, lives: 3, missionStartScore: 0 }) };
    this.mouseClient = undefined; this.mouseOnCanvas = false;
    this.teamAims = Array.from({ length: 3 }, () => ({ x: this.session.coop ? 1 : 0, y: this.session.coop ? 0 : -1 }));
    this.status = 'intro'; this.queuedShot = false; this.aimMode = 'default'; this.padAim = this.session.coop ? { x: 1, y: 0 } : { x: 0, y: -1 }; this.closePause = undefined; this.closePadSettings = undefined;
  }
  create() {
    gamepad.suppress();
    if (this.session.coop && !this.session.playerCount) this.session.playerCount = gamepad.playerCount;
    this.world = new World(this.session.mode === 'duel' ? duelLevel(this.session.round ?? 1) : getLevel(this.session.level), this.session.coop ? this.session.playerCount ?? 2 : 1, this.session.mode === 'duel' ? 'duel' : 'campaign');
    this.board = new BoardRenderer(this, this.world); this.effects = new ParticleEffects(this);
    this.root = document.querySelector<HTMLElement>('#ui')!;
    this.hud = new HUD(this.root, this.world, this.session, () => this.pauseGame());
    this.reticle = document.createElement('div'); this.reticle.className = 'mouse-reticle'; this.reticle.hidden = true; this.reticle.setAttribute('aria-hidden', 'true'); this.root.append(this.reticle);
    const trackMouse = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      this.mouseClient = { x: event.clientX, y: event.clientY }; this.mouseOnCanvas = event.target === this.game.canvas;
      if (this.mouseOnCanvas && this.session.coop !== 'two-pads') this.aimMode = 'mouse';
    };
    window.addEventListener('pointermove', trackMouse); window.addEventListener('pointerdown', trackMouse);
    this.events.once('shutdown', () => { window.removeEventListener('pointermove', trackMouse); window.removeEventListener('pointerdown', trackMouse); this.reticle.remove(); });
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ESC,P,M') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'ESC', 'P']);
    const togglePause = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (this.status === 'paused') this.resumeGame(); else this.pauseGame();
    };
    this.input.keyboard!.on('keydown-ESC', togglePause); this.input.keyboard!.on('keydown-P', togglePause);
    this.input.keyboard!.on('keydown-M', (event: KeyboardEvent) => { if (!event.repeat) this.hud.toggleSound(); });
    this.input.keyboard!.on('keydown-SPACE', (event: KeyboardEvent) => {
      if (!event.repeat && this.status === 'playing') this.queuedShot = true;
    });
    this.input.mouse!.disableContextMenu();
    this.input.on('pointermove', () => { if (this.session.coop !== 'two-pads') this.aimMode = 'mouse'; });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => { audio.unlock(); if (this.session.coop !== 'two-pads' && pointer.leftButtonDown() && this.status === 'playing') { this.queuedShot = true; this.aimMode = 'mouse'; } });
    const blur = () => { if (this.status === 'playing') this.pauseGame(); };
    this.game.events.on(Phaser.Core.Events.BLUR, blur);
    this.events.once('shutdown', () => {
      this.game.events.off(Phaser.Core.Events.BLUR, blur); this.closeBriefing?.(); this.closeBriefing = undefined; audio.setScene('silent'); this.closePadSettings?.(); this.closePause?.(); this.time.paused = false;
      document.querySelector('#app')!.classList.remove('gameplay');
      if (import.meta.env.DEV) delete (window as any).__wooden;
    });
    if (this.session.mode === 'duel') {
      const intro = document.createElement('div'); intro.className = 'mission-intro';
      intro.innerHTML = `<span class="eyebrow">DUELO LOCAL</span><strong>Ronda ${this.session.round}</strong><span>${this.world.level.subtitle}</span>`;
      this.root.append(intro); audio.setScene('briefing');
      this.time.delayedCall(1500, () => { intro.remove(); this.beginBattle(); });
    } else {
      audio.setScene('briefing');
      this.closeBriefing = showMissionBriefing(this.root, this.world, () => {
        if (this.status !== 'intro' || (this.session.coop && !gamepad.ready)) return;
        this.closeBriefing?.(); this.closeBriefing = undefined; this.beginBattle();
      }, () => this.menu());
    }
    if (import.meta.env.DEV) (window as any).__wooden = this;
  }
  get audioState() { return audio.state; }
  private beginBattle() {
    audio.unlock(); audio.setScene('battle'); gamepad.suppress(); this.input.keyboard!.resetKeys(); this.queuedShot = false; this.status = 'playing'; document.querySelector('#app')!.classList.add('gameplay'); (document.activeElement as HTMLElement)?.blur();
  }
  pauseGame() {
    if (this.status !== 'playing') return;
    gamepad.suppress();
    this.reticle.hidden = true;
    audio.setScene('silent'); this.status = 'paused'; this.queuedShot = false; this.tweens.pauseAll(); this.time.paused = true;
    document.querySelector('#app')!.classList.remove('gameplay');
    this.closePause = showOverlay(this.root, { eyebrow: `${this.session.mode === 'duel' ? 'RONDA' : 'MISIÓN'} ${this.world.level.id}`, title: 'Una pequeña pausa', pauseKey: true, description: this.session.coop ? 'Pausa para todos los jugadores. Si un control se desconecta, reconéctalo antes de reanudar.' : 'El taller puede esperar. Vuelve cuando estés listo.', cancel: () => this.resumeGame(), symbol: '<span class="pause-icon" style="margin:auto;width:24px;height:26px"></span>', actions: [
      { text: 'Reanudar →', run: () => this.resumeGame() },
      { text: this.session.mode === 'duel' ? 'Reiniciar ronda' : 'Reiniciar misión', secondary: true, run: () => this.restartMission() },
      { text: 'Volver al menú', secondary: true, run: () => this.menu() },
      { text: 'Ajustes del control', secondary: true, run: () => { this.closePadSettings = showGamepadSettings(this.root); } },
    ] });
  }
  resumeGame() {
    if (this.status !== 'paused' || (this.session.coop && !gamepad.ready)) return;
    gamepad.suppress();
    this.closePadSettings?.(); this.closePadSettings = undefined;
    this.closePause?.(); this.closePause = undefined; audio.unlock(); audio.setScene('battle'); this.status = 'playing'; this.queuedShot = false;
    this.input.keyboard!.resetKeys(); this.tweens.resumeAll(); this.time.paused = false;
    document.querySelector('#app')!.classList.add('gameplay'); (document.activeElement as HTMLElement)?.blur();
  }
  private restartMission() { this.time.paused = false; this.scene.restart({ session: { ...this.session, score: this.session.missionStartScore } }); }
  private menu() { if (this.session.mode !== 'duel') progress.record(this.session.score); this.time.paused = false; this.scene.start('Menu'); }
  private finishDuel(result: number | null) {
    audio.setScene('briefing'); this.status = 'won'; gamepad.suppress(); this.reticle.hidden = true; this.queuedShot = false;
    document.querySelector('#app')!.classList.remove('gameplay');
    const wins = [...(this.session.wins ?? [0, 0, 0, 0])];
    if (result !== null) wins[result]++;
    this.session.wins = wins; this.hud.update(this.world, this.session);
    const champion = result !== null && wins[result] >= DUEL_TARGET;
    const round = this.session.round ?? 1;
    this.effects.settle(() => {
      this.status = 'ended';
      showOverlay(this.root, { eyebrow: champion ? 'DUELO TERMINADO' : `RONDA ${round}`, title: result === null ? 'Empate' : `P${result + 1} ${champion ? 'gana el duelo' : 'gana la ronda'}`,
        description: wins.slice(0, this.world.players.length).map((w, i) => `P${i + 1}: ${w} / ${DUEL_TARGET}`).join(' · '), cancel: () => this.menu(), actions: [
          { text: champion ? 'Revancha →' : result === null ? 'Repetir ronda →' : 'Siguiente ronda →', run: () => this.scene.restart({ session: { ...this.session, round: champion ? 1 : result === null ? round : round + 1, wins: champion ? [0, 0, 0, 0] : wins } }) },
          { text: 'Volver al menú', secondary: true, run: () => this.menu() },
        ] });
    });
  }
  private win() {
    gamepad.suppress();
    this.reticle.hidden = true;
    audio.setScene('briefing'); this.status = 'won'; document.querySelector('#app')!.classList.remove('gameplay');
    const bonus = Math.max(100, Math.round(500 - this.world.elapsed * 3)); this.session.score += bonus;
    progress.record(this.session.score); this.hud.update(this.world, this.session);
    const final = this.session.level === levels.length - 1;
    progress.complete(this.session.level + 1);
    this.effects.settle(() => {
      audio.play('win');
      const banner = document.createElement('div'); banner.className = 'mission-intro victory-toast';
      banner.innerHTML = `<span class="eyebrow">TABLERO DESPEJADO</span><strong>Misión cumplida</strong><span>+${bonus} puntos por completar la misión</span>`; this.root.append(banner);
      this.time.delayedCall(1000, () => {
        banner.remove();
        if (final) {
          this.status = 'ended';
          progress.data.wins++; progress.save();
          showOverlay(this.root, { eyebrow: 'CAMPAÑA COMPLETADA', title: 'Maestro del taller', description: `${String(this.session.score).padStart(6, '0')} puntos. Cada huella cuenta.`, symbol: '+', cancel: () => this.menu(), actions: [
            { text: 'Una nueva partida →', run: () => this.scene.restart({ session: { level: 0, score: 0, lives: 3, missionStartScore: 0, coop: this.session.coop, playerCount: this.session.playerCount } }) },
            { text: 'Volver al menú', secondary: true, run: () => this.menu() },
          ] });
        } else this.scene.restart({ session: { ...this.session, level: this.session.level + 1, missionStartScore: this.session.score } });
      });
    });
  }
  private loseLife() {
    gamepad.suppress();
    this.reticle.hidden = true;
    const defeatSound = audio.defeat(); this.status = 'dead'; document.querySelector('#app')!.classList.remove('gameplay'); this.session.lives--; progress.record(this.session.score); this.hud.update(this.world, this.session);
    const animation = new Promise<void>(resolve => this.effects.settle(resolve));
    void Promise.all([animation, defeatSound]).then(() => {
      if (!this.sys.isActive() || this.status !== 'dead') return;
      audio.setScene('briefing'); gamepad.suppress(); this.status = 'ended';
      if (this.session.lives > 0) {
        showOverlay(this.root, { eyebrow: 'MISIÓN FALLIDA', title: this.session.coop ? 'El equipo ha caído' : 'Tanque destruido', description: `${this.session.lives} ${this.session.lives === 1 ? 'vida restante' : 'vidas restantes'}. Vuelve a intentarlo cuando estés listo.`, cancel: () => this.menu(), actions: [
          { text: 'Reintentar misión →', run: () => this.restartMission() },
          { text: 'Volver al menú', secondary: true, run: () => this.menu() },
        ] });
      } else {
        this.status = 'ended'; document.querySelector('#app')!.classList.remove('gameplay');
        showOverlay(this.root, { eyebrow: 'GAME OVER', title: 'Hasta la próxima batalla', description: `${String(this.session.score).padStart(6, '0')} puntos · Récord ${String(progress.data.best).padStart(6, '0')}`, cancel: () => this.menu(), actions: [
          { text: 'Volver a intentarlo →', run: () => this.scene.restart({ session: { level: 0, score: 0, lives: 3, missionStartScore: 0, coop: this.session.coop, playerCount: this.session.playerCount } }) },
          { text: 'Volver al menú', secondary: true, run: () => this.menu() },
        ] });
      }
    });
  }
  update(_time: number, delta: number) {
    if (!this.world || !this.keys) return;
    if (this.status !== 'playing') return;
    if (this.session.coop && !gamepad.ready) { this.pauseGame(); return; }
    const down = (key: string) => this.keys[key].isDown, pointer = this.input.activePointer;
    const pad = gamepad.frame;
    const usePad = this.session.coop ? this.session.coop === 'two-pads' : pad.connected && pad.mapped && pad.mode === 'gamepad';
    if (usePad && Math.hypot(pad.aim.x, pad.aim.y)) {
      const length = Math.hypot(pad.aim.x, pad.aim.y);
      this.padAim = { x: pad.aim.x / length, y: pad.aim.y / length }; this.aimMode = 'gamepad';
    }
    const player = this.world.player;
    const bounds = this.root.getBoundingClientRect();
    const screen = this.mouseClient ? { x: (this.mouseClient.x - bounds.left) * 1280 / bounds.width, y: (this.mouseClient.y - bounds.top) * 720 / bounds.height } : pointer;
    const mouseAim = this.cameras.main.getWorldPoint(screen.x, screen.y);
    const partners = this.world.players.slice(1).map((partner, index) => {
      const second = gamepad.frames[index + 1];
      const length = Math.hypot(second.aim.x, second.aim.y);
      if (length) this.teamAims[index] = { x: second.aim.x / length, y: second.aim.y / length };
      const bearing = this.teamAims[index];
      return { move: second.move, aim: { x: partner.x + bearing.x * 100000, y: partner.y + bearing.y * 100000 }, fire: second.fire };
    });
    // A distant point expresses a bearing through World's existing point-based aim input.
    // This keeps the bearing stable as the tank moves, without changing the simulation.
    const aim = this.aimMode === 'gamepad' ? { x: player.x + this.padAim.x * 100000, y: player.y + this.padAim.y * 100000 } :
      this.aimMode === 'mouse' ? mouseAim : { x: player.x + (this.session.coop ? 100 : 0), y: player.y - (this.session.coop ? 0 : 100) };
    const beforeMovement = this.world.players.map(p => p.distance);
    this.world.update(delta / 1000, {
      move: usePad ? pad.move : { x: +!!(down('D') || down('RIGHT')) - +!!(down('A') || down('LEFT')), y: +!!(down('S') || down('DOWN')) - +!!(down('W') || down('UP')) },
      aim, fire: usePad ? pad.fire : this.queuedShot || pointer.leftButtonDown() || down('SPACE'),
    }, true, partners);
    audio.movement(Math.max(0, ...this.world.players.map((p, i) => p.distance - beforeMovement[i])));
    this.reticle.hidden = usePad || this.aimMode !== 'mouse' || !this.mouseOnCanvas || !this.mouseClient || !this.world.player.alive;
    if (!this.reticle.hidden && this.mouseClient) {
      this.reticle.style.left = `${this.mouseClient.x - bounds.left}px`; this.reticle.style.top = `${this.mouseClient.y - bounds.top}px`;
    }
    this.queuedShot = false;
    for (const event of this.world.events) {
      this.effects.event(event);
      if (event.type === 'destroy' && !event.player) this.session.score += 100 + ({ basic: 0, patrol: 50, tactical: 100, player: 0 }[event.kind]);
    }
    this.world.events.length = 0;
    this.board.render(delta / 1000); this.hud.update(this.world, this.session);
    if (this.session.mode === 'duel') { const result = duelResult(this.world.players); if (result !== undefined) this.finishDuel(result); }
    else if (!this.world.alivePlayers.length) this.loseLife(); else if (!this.world.enemies.length) this.win();
  }
}
