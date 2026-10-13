import Phaser from 'phaser';
import { CHAPTER_SIZE } from '../game/Campaign';
import { levels } from '../game/LevelManager';
import { createTextures } from '../game/TextureFactory';
import { progress } from '../game/Progress';
import { audio } from '../game/AudioManager';
import { tankIcon } from '../ui/HUD';
import { showOverlay } from '../ui/Overlay';
import { gamepad } from '../input/GamepadRuntime';
import { showCoopSetup } from '../ui/CoopSetup';
import { showGamepadSettings } from '../ui/GamepadSettings';
export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    gamepad.endCoop(); audio.muted = progress.data.muted; audio.setScene('menu');
    createTextures(this); this.add.image(640, 360, 'floor');
    const root = document.querySelector<HTMLElement>('#ui')!;
    root.innerHTML = `<div class="menu"><header class="menu-header"><span class="mini-brand">WOODEN <b>TANKS</b><span class="brand-dot"></span></span><span class="edition">COMBATE TÁCTICO LOCAL</span><button class="menu-sound icon-button" aria-label="Activar o silenciar sonido">${progress.data.muted ? '♪̸' : '♪'}</button></header>
    <section class="menu-copy"><span class="eyebrow"><i></i> ELIGE CÓMO JUGAR</span><h1>Wooden<br/><span>Tanks<span class="title-dot">.</span></span></h1><p class="menu-description">Encuentra tu ángulo. Defiende tu equipo.<br/>${levels.length} misiones para jugar solo o acompañado.</p>
    <nav class="menu-actions" aria-label="Menú principal"><button id="play" class="mode-button solo-mode"><span class="mode-icon">${tankIcon}</span><span class="mode-copy"><strong>Un jugador</strong><small>Teclado y mouse o un control</small></span><span class="mode-arrow">→</span></button><button id="coop" class="mode-button coop-mode"><span class="mode-icon duo-icon">${tankIcon}${tankIcon}</span><span class="mode-copy"><strong>Cooperativo local</strong><small>De 2 a 4 jugadores · fuego amigo</small></span><span class="mode-arrow">→</span></button><button id="duel" class="mode-button duel-mode"><span class="mode-icon">⚔</span><span class="mode-copy"><strong>Duelo</strong><small>De 2 a 4 jugadores · todos contra todos</small></span><span class="mode-arrow">→</span></button><div class="menu-links"><button id="select" class="text-button">Misiones <span>→</span></button><button id="gamepad-settings" class="text-button">Ajustes del control <span>→</span></button><button id="hunter-test" class="text-button">Probar cazador <span>→</span></button></div></nav>
    <div class="menu-record"><span class="label">RÉCORD</span><strong>${String(progress.data.best).padStart(6, '0')}</strong><span class="record-rule"></span><span class="label">${Math.min(progress.data.unlocked, levels.length)} / ${levels.length} MISIONES DESBLOQUEADAS</span></div></section>
    <aside class="menu-guide" aria-label="Cómo jugar"><span class="eyebrow">PEQUEÑOS TANQUES. GRANDES ESTRATEGIAS.</span><div class="menu-tanks" aria-hidden="true"><span class="guide-tank p1-tank">${tankIcon}<b>P1</b></span><span class="team-plus">+</span><span class="guide-tank p2-tank">${tankIcon}<b>P2</b></span></div><h2>Encuentra tu ángulo.</h2><p>Muévete, apunta y aprovecha los rebotes.<br/>En equipo, cuida la espalda de tu compañero.</p><div class="guide-facts"><span><b>${levels.length}</b> misiones</span><span><b>3</b> vidas</span><span><b>2</b> rebotes</span></div><span class="guide-note">Un jugador o cooperativo · Sin cuentas</span></aside>
    <footer class="menu-footer"><span>${tankIcon} Hecho de madera. Diseñado para pensar.</span><span><kbd>↑ ↓</kbd> elegir <i>·</i> <kbd>Enter</kbd> confirmar <i>·</i> <kbd>Esc</kbd> volver</span></footer></div>`;
    const navigate = (event: KeyboardEvent) => {
      if (root.querySelector('.modal')) return;
      const controls = Array.from(root.querySelectorAll<HTMLButtonElement>('.menu-actions button'));
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const current = controls.indexOf(document.activeElement as HTMLButtonElement);
      const direction = event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1;
      const index = current < 0 ? 0 : (current + direction + controls.length) % controls.length;
      controls[index].focus();
    };
    window.addEventListener('keydown', navigate);
    this.events.once('shutdown', () => window.removeEventListener('keydown', navigate));
    root.querySelector<HTMLElement>('#play')!.focus({ preventScroll: true });
    const start = (index: number) => { audio.unlock(); audio.muted = progress.data.muted; this.scene.start('Game', { session: { level: index, score: 0, lives: 3, missionStartScore: 0 } }); };
    root.querySelector('#coop')!.addEventListener('click', () => { audio.unlock(); showCoopSetup(root, coop => { audio.unlock(); audio.muted = progress.data.muted; this.scene.start('Game', { session: { level: 0, score: 0, lives: 3, missionStartScore: 0, coop } }); }); });
    root.querySelector('#duel')!.addEventListener('click', () => { audio.unlock(); showCoopSetup(root, coop => { audio.unlock(); audio.muted = progress.data.muted; this.scene.start('Game', { session: { level: 0, score: 0, lives: 3, missionStartScore: 0, coop, mode: 'duel', round: 1, wins: [0, 0, 0, 0] } }); }, 'duel'); });
    root.querySelector('#hunter-test')!.addEventListener('click',()=>{
      audio.unlock();let close:()=>void;
      const dismiss=()=>{close();root.querySelector<HTMLElement>('#hunter-test')!.focus({preventScroll:true});};
      close=showOverlay(root,{eyebrow:'TALLER DE PRUEBAS',title:'Conoce al cazador',description:'Un cazador y dos coberturas. Prueba sus flancos y su preparación de disparo sin avanzar la campaña.',cancel:dismiss,actions:[
        {text:'Probar solo →',run:()=>{close();audio.muted=progress.data.muted;this.scene.start('Game',{session:{level:20,score:0,lives:3,missionStartScore:0,practice:true}});}},
        {text:'Probar en equipo →',secondary:true,run:()=>{close();showCoopSetup(root,coop=>{audio.muted=progress.data.muted;this.scene.start('Game',{session:{level:20,score:0,lives:3,missionStartScore:0,coop,practice:true}});});}},
        {text:'Volver',secondary:true,run:dismiss},
      ]});
    });
    root.querySelector('#play')!.addEventListener('click', () => start(0));
    root.querySelector('.menu-sound')!.addEventListener('click', e => { audio.unlock(); audio.muted = !progress.data.muted; progress.data.muted = audio.muted; progress.save(); (e.currentTarget as HTMLElement).textContent = audio.muted ? '♪̸' : '♪'; });
    root.querySelector('#gamepad-settings')!.addEventListener('click', () => showGamepadSettings(root));
    root.querySelector('#select')!.addEventListener('click', () => {
      const close = () => { remove(); gamepad.suppress(); root.querySelector<HTMLElement>('#select')!.focus(); };
      gamepad.suppress();
      const remove = showOverlay(root, { cancel: close, eyebrow: 'TU CAMPAÑA', title: 'Elige tu batalla', description: 'Completa una misión para desbloquear la siguiente.', actions: [{ text: 'Volver al taller', secondary: true, run: close }] });
      const grid = document.createElement('div'); grid.className = 'mission-grid';
      for (const level of levels) {
        if ((level.id - 1) % CHAPTER_SIZE === 0) {
          const heading = document.createElement('h3'); heading.className = 'mission-chapter';
          heading.textContent = `Capítulo ${Math.ceil(level.id / CHAPTER_SIZE)} · Misiones ${level.id}–${Math.min(level.id + CHAPTER_SIZE - 1, levels.length)}`;
          grid.append(heading);
        }
        const button = document.createElement('button'); button.className = 'mission-choice'; button.disabled = level.id > progress.data.unlocked;
        button.innerHTML = `<strong>${String(level.id).padStart(2, '0')}</strong><span>${level.name}</span><small>${button.disabled ? 'BLOQUEADA' : 'JUGAR →'}</small>`;
        button.onclick = () => { remove(); start(level.id - 1); }; grid.append(button);
      }
      root.querySelector('.modal')!.classList.add('selector-modal'); root.querySelector('.modal-actions')!.before(grid);
      grid.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    });
  }
}
