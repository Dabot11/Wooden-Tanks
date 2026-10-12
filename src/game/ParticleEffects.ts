import Phaser from 'phaser';
import type { CombatEvent } from './types';
import { audio } from './AudioManager';
export class ParticleEffects {
  private count = 0;
  constructor(private scene: Phaser.Scene) {}
  private particle(texture: string, x: number, y: number, dx: number, dy: number, duration: number, scale: number, tint?: number) {
    if (this.count > 200) return;
    this.count++;
    const image = this.scene.add.image(x, y, texture).setDepth(40).setScale(scale);
    if (tint !== undefined) image.setTint(tint);
    this.scene.tweens.add({ targets: image, x: x + dx, y: y + dy, angle: Math.random() * 180, alpha: 0, scale: texture === 'smoke' ? scale * 2.4 : scale * 0.4, duration, ease: 'Cubic.Out', onComplete: () => { image.destroy(); this.count--; } });
  }
  event(event: CombatEvent) {
    audio.play(event.type);
    const { x, y, type } = event;
    if (type === 'shot') {
      this.particle('spark', x, y, Math.cos(event.angle) * 6, Math.sin(event.angle) * 6, 110, 1.3);
      this.particle('smoke', x, y, Math.cos(event.angle) * 20, Math.sin(event.angle) * 20 - 4, 350, 0.3);
    } else if (type === 'shellCollision') {
      const flash = this.scene.add.image(x, y, 'spark').setDepth(42).setScale(0.5).setBlendMode(Phaser.BlendModes.ADD);
      const ring = this.scene.add.circle(x, y, 8, 0xffbc5a, 0.3).setStrokeStyle(2, 0xffedb0, 0.9).setDepth(41);
      flash.setData('shell-explosion', true); ring.setData('shell-explosion', true);
      this.scene.tweens.add({ targets: flash, scale: 3.8, alpha: 0, duration: 260, ease: 'Cubic.Out', onComplete: () => flash.destroy() });
      this.scene.tweens.add({ targets: ring, scale: 4.2, alpha: 0, duration: 340, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
      for (let i = 0; i < 12; i++) {
        const angle = Math.PI * 2 * i / 12, distance = 24 + Math.random() * 25;
        this.particle('spark', x, y, Math.cos(angle) * distance, Math.sin(angle) * distance, 260 + Math.random() * 140, 0.8 + Math.random() * 0.8);
      }
      for (let i = 0; i < 5; i++) this.particle('smoke', x, y, (Math.random() - 0.5) * 32, -12 - Math.random() * 20, 450 + Math.random() * 200, 0.45);
    } else if (type === 'destroy') {
      this.scene.cameras.main.shake(160, event.player ? 0.003 : 0.0014);
      for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 45; this.particle('spark', x, y, Math.cos(a) * d, Math.sin(a) * d, 250 + Math.random() * 200, 0.7 + Math.random()); }
      for (let i = 0; i < 8; i++) this.particle('smoke', x, y, (Math.random() - 0.5) * 65, -20 - Math.random() * 45, 650 + Math.random() * 500, 0.8);
      for (let i = 0; i < 10; i++) this.particle('chip', x, y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 600, 1.4);
    } else {
      const amount = type === 'break' ? 20 : 5;
      for (let i = 0; i < amount; i++) this.particle(type === 'break' ? 'chip' : 'spark', x, y, (Math.random() - 0.5) * 65, (Math.random() - 0.5) * 65, type === 'break' ? 650 : 200, type === 'break' ? 1.2 : 0.5);
      if (type === 'break') this.particle('smoke', x, y, 10, -15, 700, 0.8);
    }
  }
}
