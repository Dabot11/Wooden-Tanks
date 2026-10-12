import Phaser from 'phaser';
import { World } from '../game/World';
import { demo, levels } from '../game/LevelManager';
import { BoardRenderer } from '../game/BoardRenderer';
import { progress } from '../game/Progress';
import { audio } from '../game/AudioManager';
import { tankIcon } from '../ui/HUD';
import { showOverlay } from '../ui/Overlay';
import { gamepad } from '../input/GamepadRuntime';
import { showGamepadSettings } from '../ui/GamepadSettings';
export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    gamepad.suppress();
    const world = new World(demo); new BoardRenderer(this, world);
    // The menu is a physical board preview; real combat begins on selection.
    world.player.turret = -Math.PI / 2;
    const root = document.querySelector<HTMLElement>('#ui')!;
    root.innerHTML = `<div class="menu"><header class="menu-header"><span class="mini-brand">WOODEN <b>TANKS</b><span class="brand-dot"></span></span><span class="edition">LA COLECCIÓN DEL TALLER · Nº 01</span><button class="menu-sound icon-button" aria-label="Activar o silenciar sonido">${progress.data.muted ? '♪̸' : '♪'}</button></header><section class="menu-copy"><span class="eyebrow"><i></i> COMBATE TÁCTICO DE JUGUETE</span><h1>Wooden<br/><span>Tanks<span class="title-dot">.</span></span></h1><p class="menu-description">Pequeños tanques. Grandes estrategias.<br/>Encuentra tu ángulo y deja tu huella.</p><div class="menu-actions"><button id="play" class="button primary">Jugar campaña <span>→</span></button><button id="demo" class="button secondary">El tablero de referencia <span>→</span></button><div class="menu-links"><button id="select" class="text-button">Seleccionar misión <span>+</span></button><button id="gamepad-settings" class="text-button">Ajustes del control <span>→</span></button></div></div><div class="menu-record"><span class="label">TU RÉCORD</span><strong>${String(progress.data.best).padStart(6, '0')}</strong><span class="record-rule"></span><span class="label">10 MISIONES<br/>3 VIDAS · 2 REBOTES</span></div></section><div class="board-caption"><span class="caption-line"></span><span>EL TALLER</span><b>65</b><small>UN TABLERO. TU PRÓXIMA BATALLA.</small></div><footer class="menu-footer"><span>${tankIcon} Hecho de madera. Diseñado para pensar.</span><span><kbd>WASD</kbd> mover <i>·</i> mouse apuntar <i>·</i> clic disparar</span></footer></div>`;
    const start = (index: number) => { audio.unlock(); audio.muted = progress.data.muted; this.scene.start('Game', { session: { level: index, score: 0, lives: 3, missionStartScore: 0 } }); };
    root.querySelector('#play')!.addEventListener('click', () => start(0));
    root.querySelector('#demo')!.addEventListener('click', () => start(-1));
    root.querySelector('.menu-sound')!.addEventListener('click', e => { audio.unlock(); audio.muted = !progress.data.muted; progress.data.muted = audio.muted; progress.save(); (e.currentTarget as HTMLElement).textContent = audio.muted ? '♪̸' : '♪'; });
    root.querySelector('#gamepad-settings')!.addEventListener('click', () => showGamepadSettings(root));
    root.querySelector('#select')!.addEventListener('click', () => {
      const close = () => { remove(); gamepad.suppress(); root.querySelector<HTMLElement>('#select')!.focus(); };
      gamepad.suppress();
      const remove = showOverlay(root, { cancel: close, eyebrow: 'TU CAMPAÑA', title: 'Elige tu batalla', description: 'Completa una misión para desbloquear la siguiente.', actions: [{ text: 'Volver al taller', secondary: true, run: close }] });
      const grid = document.createElement('div'); grid.className = 'mission-grid';
      for (const level of levels) {
        const button = document.createElement('button'); button.className = 'mission-choice'; button.disabled = level.id > progress.data.unlocked;
        button.innerHTML = `<strong>${String(level.id).padStart(2, '0')}</strong><span>${level.name}</span><small>${button.disabled ? 'BLOQUEADA' : 'JUGAR →'}</small>`;
        button.onclick = () => { remove(); start(level.id - 1); }; grid.append(button);
      }
      root.querySelector('.modal')!.classList.add('selector-modal'); root.querySelector('.modal-actions')!.before(grid);
      grid.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    });
  }
}
