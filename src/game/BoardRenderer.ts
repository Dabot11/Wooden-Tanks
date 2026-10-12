import Phaser from 'phaser';
import type { Tank, Vec } from './types';
import type { World } from './World';
import { createTextures, obstacleTexture } from './TextureFactory';
interface TankSprite { body: Phaser.GameObjects.Image; turret: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image; last: number }
interface Mark extends Vec { angle: number; alpha: number }
export class BoardRenderer {
  private tanks = new Map<number, TankSprite>();
  private blocks = new Map<number, Phaser.GameObjects.Image>();
  private shells = new Map<number, Phaser.GameObjects.Image>();
  private marks: Mark[] = [];
  private tracks: Phaser.GameObjects.Graphics;
  private trails: Phaser.GameObjects.Graphics;
  private cracks: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene, private world: World) {
    createTextures(scene);
    scene.add.image(640, 360, 'floor').setDepth(0);
    this.tracks = scene.add.graphics().setDepth(1);
    this.trails = scene.add.graphics().setDepth(25);
    this.cracks = scene.add.graphics().setDepth(12);
    const decor = scene.add.graphics().setDepth(2);
    // Countersunk holes and chalk marks on the toy board.
    for (const p of [{ x: 156, y: 415 }, { x: 198, y: 415 }, { x: 240, y: 415 }, { x: 562, y: 572 }, { x: 562, y: 604 }, { x: 1030, y: 342 }, { x: 1075, y: 342 }, { x: 1120, y: 342 }]) {
      decor.fillStyle(0x624e2f, 0.38).fillEllipse(p.x, p.y, 30, 20);
      decor.fillStyle(0x463c29, 0.27).fillEllipse(p.x, p.y + 3, 22, 12);
      decor.lineStyle(2, 0xffe8ad, 0.6).beginPath().arc(p.x, p.y, 15, Math.PI, Math.PI * 2).strokePath();
    }
    decor.lineStyle(5, 0xfff5d6, 0.8);
    for (const p of [{ x: 578, y: 90 }, { x: 660, y: 585 }]) { decor.lineBetween(p.x - 10, p.y - 8, p.x + 10, p.y + 8); decor.lineBetween(p.x + 10, p.y - 8, p.x - 10, p.y + 8); }
    // Rim made of separate wooden pieces, with rounded outer corner caps.
    for (let x = 10; x < 1270; x += 70) {
      this.blockImage(x, 14, Math.min(70, 1270 - x), 30).setDepth(14);
      this.blockImage(x, 622, Math.min(70, 1270 - x), 30).setDepth(14);
    }
    for (let y = 44; y < 622; y += 76) {
      this.blockImage(10, y, 38, Math.min(76, 622 - y)).setDepth(14);
      this.blockImage(1232, y, 38, Math.min(76, 622 - y)).setDepth(14);
    }
    for (const obstacle of world.obstacles) this.blocks.set(obstacle.id, this.blockImage(obstacle.x, obstacle.y, obstacle.w, obstacle.h, obstacle.destructible));
    for (const tank of world.tanks) this.createTank(tank);
    // A few faded winding tracks establish the handmade reference composition.
    for (let path = 0; path < 3; path++) for (let i = 0; i < 160; i++) {
      const t = i / 160 * Math.PI * 2;
      const x = 300 + path * 300 + Math.cos(t) * (170 - path * 20);
      const y = 310 + Math.sin(t) * 130 + Math.sin(t * 3) * 35;
      if (!world.solids.some(b => x > b.x - 12 && x < b.x + b.w + 12 && y > b.y - 12 && y < b.y + b.h + 12)) this.marks.push({ x, y, angle: Math.atan2(Math.cos(t) * 130 + Math.cos(t * 3) * 105, -Math.sin(t) * (170 - path * 20)), alpha: 0.065 });
    }
    this.render(0);
  }
  private blockImage(x: number, y: number, w: number, h: number, destructible = false) {
    return this.scene.add.image(x - 24, y - 24, obstacleTexture(this.scene, w, h, destructible)).setOrigin(0).setDepth(10);
  }
  private createTank(tank: Tank) {
    this.tanks.set(tank.id, {
      shadow: this.scene.add.image(tank.x + 5, tank.y + 7, 'shadow').setScale(0.78, 0.64).setDepth(17),
      body: this.scene.add.image(tank.x, tank.y, `body-${tank.kind}`).setDepth(20),
      turret: this.scene.add.image(tank.x, tank.y, `turret-${tank.kind}`).setDepth(22), last: 0,
    });
  }
  render(dt: number) {
    let dirty = false;
    for (const tank of this.world.tanks) {
      const sprite = this.tanks.get(tank.id)!;
      sprite.body.setVisible(tank.alive).setPosition(tank.x, tank.y).setRotation(tank.angle);
      sprite.turret.setVisible(tank.alive).setPosition(tank.x, tank.y).setRotation(tank.turret);
      sprite.shadow.setVisible(tank.alive).setPosition(tank.x + 5, tank.y + 7);
      if (tank.alive && tank.distance - sprite.last > 7) {
        sprite.last = tank.distance; this.marks.push({ x: tank.x, y: tank.y, angle: tank.angle, alpha: 0.13 }); dirty = true;
      }
    }
    if (this.marks.length > 1800) { this.marks.splice(0, 20); dirty = true; }
    if (dirty || dt === 0) {
      const g = this.tracks.clear();
      for (const m of this.marks) {
        g.fillStyle(0x735a32, m.alpha);
        for (const side of [-17, 17]) {
          const x = m.x - Math.sin(m.angle) * side, y = m.y + Math.cos(m.angle) * side;
          const dx = Math.cos(m.angle) * 2.4, dy = Math.sin(m.angle) * 2.4;
          const nx = -Math.sin(m.angle) * 4, ny = Math.cos(m.angle) * 4;
          g.fillPoints([{ x: x - dx - nx, y: y - dy - ny }, { x: x + dx - nx, y: y + dy - ny }, { x: x + dx + nx, y: y + dy + ny }, { x: x - dx + nx, y: y - dy + ny }], true);
        }
      }
    }
    this.cracks.clear();
    for (const o of this.world.obstacles) {
      this.blocks.get(o.id)!.setVisible(o.alive);
      if (o.alive && o.destructible && o.hp < 3) {
        this.cracks.lineStyle(1.5, 0x694b3b, 0.8).beginPath().moveTo(o.x + 3, o.y + 12).lineTo(o.x + o.w * 0.65, o.y + o.h * 0.5).lineTo(o.x + 5, o.y + o.h - 10).strokePath();
        if (o.hp === 1) this.cracks.lineBetween(o.x + o.w * 0.65, o.y + o.h * 0.5, o.x + o.w, o.y + 2);
      }
    }
    this.trails.clear();
    for (const p of this.world.projectiles) {
      let sprite = this.shells.get(p.id);
      if (!sprite) { sprite = this.scene.add.image(p.x, p.y, 'shell').setDepth(30); this.shells.set(p.id, sprite); }
      sprite.setPosition(p.x, p.y).setRotation(Math.atan2(p.vy, p.vx));
      this.trails.lineStyle(2.2, 0xfff2bb, 0.45).lineBetween(p.x, p.y, p.x - p.vx * 0.028, p.y - p.vy * 0.028);
    }
    for (const [id, sprite] of this.shells) if (!this.world.projectiles.some(p => p.id === id)) { sprite.destroy(); this.shells.delete(id); }
  }
}
