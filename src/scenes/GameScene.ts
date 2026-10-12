import Phaser from 'phaser';
import { World } from '../game/World';
import { getLevel, levels } from '../game/LevelManager';
import { BoardRenderer } from '../game/BoardRenderer';
import { ParticleEffects } from '../game/ParticleEffects';
import { progress } from '../game/Progress';
import { audio } from '../game/AudioManager';
import { HUD } from '../ui/HUD';
import { showOverlay } from '../ui/Overlay';
import { ARENA } from '../game/types';
export interface Session { level: number; score: number; lives: number; missionStartScore: number }
export class GameScene extends Phaser.Scene {
  world!: World; session!: Session; status: 'intro' | 'playing' | 'paused' | 'won' | 'dead' | 'ended' = 'intro';
  private board!: BoardRenderer; private effects!: ParticleEffects; private hud!: HUD;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>; private root!: HTMLElement;
  private reticle!: Phaser.GameObjects.Graphics; private queuedShot = false; private aimEnabled = false;
  private closePause?: () => void;
  constructor() { super('Game'); }
  init(data: { session?: Session }) {
    this.session = { ...(data.session ?? { level: 0, score: 0, lives: 3, missionStartScore: 0 }) };
    this.status = 'intro'; this.queuedShot = false; this.aimEnabled = false; this.closePause = undefined;
  }
  create() {
    this.world = new World(getLevel(this.session.level));
    this.board = new BoardRenderer(this, this.world); this.effects = new ParticleEffects(this);
    this.root = document.querySelector<HTMLElement>('#ui')!;
    this.hud = new HUD(this.root, this.world, this.session, () => this.pauseGame());
    this.reticle = this.add.graphics().setDepth(50);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ESC,M') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'ESC']);
    this.input.keyboard!.on('keydown-ESC', (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (this.status === 'paused') this.resumeGame(); else this.pauseGame();
    });
    this.input.keyboard!.on('keydown-M', (event: KeyboardEvent) => { if (!event.repeat) this.hud.toggleSound(); });
    this.input.keyboard!.on('keydown-SPACE', (event: KeyboardEvent) => {
      if (!event.repeat && this.status === 'playing') this.queuedShot = true;
    });
    this.input.mouse!.disableContextMenu();
    this.input.on('pointermove', () => { this.aimEnabled = true; });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => { audio.unlock(); if (pointer.leftButtonDown() && this.status === 'playing') { this.queuedShot = true; this.aimEnabled = true; } });
    const blur = () => { if (this.status === 'playing') this.pauseGame(); };
    this.game.events.on(Phaser.Core.Events.BLUR, blur);
    this.events.once('shutdown', () => {
      this.game.events.off(Phaser.Core.Events.BLUR, blur); this.closePause?.(); this.time.paused = false;
      document.querySelector('#app')!.classList.remove('gameplay');
      if (import.meta.env.DEV) delete (window as any).__wooden;
    });
    const intro = document.createElement('div'); intro.className = 'mission-intro';
    intro.innerHTML = `<span class="eyebrow">${this.session.level === -1 ? 'EL TABLERO DE REFERENCIA' : 'PREPARA TU ESTRATEGIA'}</span><strong>Misión ${String(this.world.level.id).padStart(2, '0')}</strong><span>${this.world.level.subtitle}</span>`;
    this.root.append(intro);
    this.time.delayedCall(1500, () => { intro.remove(); this.status = 'playing'; document.querySelector('#app')!.classList.add('gameplay'); });
    if (import.meta.env.DEV) (window as any).__wooden = this;
  }
  pauseGame() {
    if (this.status !== 'playing') return;
    this.status = 'paused'; this.queuedShot = false; this.reticle.clear(); this.tweens.pauseAll(); this.time.paused = true;
    document.querySelector('#app')!.classList.remove('gameplay');
    this.closePause = showOverlay(this.root, { eyebrow: `MISIÓN ${this.world.level.id}`, title: 'Una pequeña pausa', description: 'El taller puede esperar. Vuelve cuando estés listo.', symbol: '<span class="pause-icon" style="margin:auto;width:24px;height:26px"></span>', actions: [
      { text: 'Reanudar →', run: () => this.resumeGame() },
      { text: 'Reiniciar misión', secondary: true, run: () => this.restartMission() },
      { text: 'Volver al menú', secondary: true, run: () => this.menu() },
    ] });
  }
  resumeGame() {
    if (this.status !== 'paused') return;
    this.closePause?.(); this.closePause = undefined; this.status = 'playing'; this.queuedShot = false;
    this.input.keyboard!.resetKeys(); this.tweens.resumeAll(); this.time.paused = false;
    document.querySelector('#app')!.classList.add('gameplay'); (document.activeElement as HTMLElement)?.blur();
  }
  private restartMission() { this.time.paused = false; this.scene.restart({ session: { ...this.session, score: this.session.missionStartScore } }); }
  private menu() { progress.record(this.session.score); this.time.paused = false; this.scene.start('Menu'); }
  private win() {
    this.status = 'won'; this.reticle.clear(); document.querySelector('#app')!.classList.remove('gameplay');
    const bonus = Math.max(100, Math.round(500 - this.world.elapsed * 3)); this.session.score += bonus;
    progress.record(this.session.score); audio.play('win'); this.hud.update(this.world, this.session);
    const final = this.session.level === levels.length - 1 || this.session.level === -1;
    if (this.session.level !== -1) progress.unlock(this.session.level + 2);
    const banner = document.createElement('div'); banner.className = 'mission-intro victory-toast';
    banner.innerHTML = `<span class="eyebrow">TABLERO DESPEJADO</span><strong>Misión cumplida</strong><span>+${bonus} puntos por completar la misión</span>`; this.root.append(banner);
    this.time.delayedCall(1800, () => {
      banner.remove();
      if (final) {
        this.status = 'ended';
        if (this.session.level !== -1) { progress.data.wins++; progress.save(); }
        showOverlay(this.root, { eyebrow: this.session.level === -1 ? 'DEMOSTRACIÓN COMPLETADA' : 'CAMPAÑA COMPLETADA', title: this.session.level === -1 ? 'El taller es tuyo' : 'Maestro del taller', description: `${String(this.session.score).padStart(6, '0')} puntos. Cada huella cuenta.`, symbol: '+', actions: [
          { text: this.session.level === -1 ? 'Jugar campaña →' : 'Una nueva partida →', run: () => this.scene.restart({ session: { level: 0, score: 0, lives: 3, missionStartScore: 0 } }) },
          { text: 'Volver al menú', secondary: true, run: () => this.menu() },
        ] });
      } else this.scene.restart({ session: { ...this.session, level: this.session.level + 1, missionStartScore: this.session.score } });
    });
  }
  private loseLife() {
    this.status = 'dead'; this.reticle.clear(); this.session.lives--; progress.record(this.session.score); this.hud.update(this.world, this.session);
    this.time.delayedCall(1300, () => {
      if (this.session.lives > 0) this.restartMission();
      else {
        this.status = 'ended'; document.querySelector('#app')!.classList.remove('gameplay');
        showOverlay(this.root, { eyebrow: 'GAME OVER', title: 'Hasta la próxima batalla', description: `${String(this.session.score).padStart(6, '0')} puntos · Récord ${String(progress.data.best).padStart(6, '0')}`, actions: [
          { text: 'Volver a intentarlo →', run: () => this.scene.restart({ session: { level: this.session.level === -1 ? -1 : 0, score: 0, lives: 3, missionStartScore: 0 } }) },
          { text: 'Volver al menú', secondary: true, run: () => this.menu() },
        ] });
      }
    });
  }
  update(_time: number, delta: number) {
    if (!this.world || !this.keys) return;
    if (this.status !== 'playing') return;
    const down = (key: string) => this.keys[key].isDown, pointer = this.input.activePointer;
    this.world.update(delta / 1000, {
      move: { x: +!!(down('D') || down('RIGHT')) - +!!(down('A') || down('LEFT')), y: +!!(down('S') || down('DOWN')) - +!!(down('W') || down('UP')) },
      aim: !this.aimEnabled ? { x: this.world.player.x, y: this.world.player.y - 100 } : pointer,
      fire: this.queuedShot || pointer.leftButtonDown() || down('SPACE'),
    });
    this.queuedShot = false;
    for (const event of this.world.events) {
      this.effects.event(event);
      if (event.type === 'destroy' && !event.player) this.session.score += 100 + ({ basic: 0, patrol: 50, offensive: 75, tactical: 100, player: 0 }[event.kind]);
    }
    this.world.events.length = 0;
    this.board.render(delta / 1000); this.hud.update(this.world, this.session);
    this.reticle.clear();
    if (this.aimEnabled && pointer.x > ARENA.x && pointer.x < ARENA.x + ARENA.w && pointer.y > ARENA.y && pointer.y < ARENA.y + ARENA.h) {
      this.reticle.lineStyle(1.2, 0x314d4b, 0.72).strokeCircle(pointer.x, pointer.y, 9);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) this.reticle.lineBetween(pointer.x + dx * 12, pointer.y + dy * 12, pointer.x + dx * 17, pointer.y + dy * 17);
      this.reticle.fillStyle(0x314d4b, 0.8).fillCircle(pointer.x, pointer.y, 1.5);
    }
    if (!this.world.player.alive) this.loseLife(); else if (!this.world.enemies.length) this.win();
  }
}
