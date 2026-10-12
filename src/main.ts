import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import './style.css';
const app = document.querySelector<HTMLElement>('#app')!;
function fit() {
  const width = Math.min(window.innerWidth, window.innerHeight * 16 / 9);
  app.style.width = `${width}px`; app.style.height = `${width * 9 / 16}px`;
  app.style.setProperty('--unit', `${width / 1280}px`);
}
window.addEventListener('resize', fit); fit();
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 1280, height: 720,
  backgroundColor: '#e6c885', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, GameScene], render: { antialias: true, roundPixels: false },
  input: { keyboard: true, mouse: true }, audio: { noAudio: true } });
