import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import './style.css';
import { audio } from './game/AudioManager';
import { GamepadRuntime } from './input/GamepadRuntime';
const app = document.querySelector<HTMLElement>('#app')!;
function fit() {
  const width = Math.min(window.innerWidth, window.innerHeight * 16 / 9);
  app.style.width = `${width}px`; app.style.height = `${width * 9 / 16}px`;
  app.style.setProperty('--unit', `${width / 1280}px`);
}
window.addEventListener('resize', fit); fit();
const audioVisibility = () => audio.setHidden(document.hidden);
document.addEventListener('visibilitychange', audioVisibility);
const audioBlur = () => audio.setHidden(true), audioFocus = () => audio.setHidden(document.hidden), unlockAudio = () => audio.unlock();
window.addEventListener('blur', audioBlur); window.addEventListener('focus', audioFocus);
window.addEventListener('pointerdown', unlockAudio); window.addEventListener('keydown', unlockAudio);
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 1280, height: 720,
  backgroundColor: '#e6c885', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, GameScene], render: { antialias: true, roundPixels: false },
  input: { keyboard: true, mouse: true }, audio: { noAudio: true } });

const activeGame = () => game.scene.getScene('Game') as GameScene;
const controller = new GamepadRuntime(app,
  () => { if (game.scene.isActive('Game')) activeGame().pauseGame(); },
  () => {
    if (!game.scene.isActive('Game')) return;
    const scene = activeGame();
    if (scene.status === 'paused') scene.resumeGame(); else scene.pauseGame();
  });
game.events.on(Phaser.Core.Events.PRE_STEP, () => controller.update());
game.events.once(Phaser.Core.Events.DESTROY, () => { controller.destroy(); audio.dispose(); document.removeEventListener('visibilitychange', audioVisibility); window.removeEventListener('blur', audioBlur); window.removeEventListener('focus', audioFocus); window.removeEventListener('pointerdown', unlockAudio); window.removeEventListener('keydown', unlockAudio); });
if (import.meta.hot) import.meta.hot.dispose(() => game.destroy(true));
