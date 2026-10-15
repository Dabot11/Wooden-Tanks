import Phaser from 'phaser';
import type { Tank, Vec } from './types';
import type { World } from './World';
import { createTextures, obstacleTexture } from './TextureFactory';
interface TankSprite { body: Phaser.GameObjects.Image; turret: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image; last: number; destroyed?: boolean; label?: Phaser.GameObjects.Text }
interface Mark extends Vec { angle: number; alpha: number }
export class BoardRenderer {
  private tanks = new Map<number, TankSprite>();
  private blocks = new Map<number, Phaser.GameObjects.Image>();
  private shells = new Map<number, Phaser.GameObjects.Image>();
  private marks: Mark[] = [];
  private tracks: Phaser.GameObjects.Graphics;
  private trails: Phaser.GameObjects.Graphics;
  private cracks: Phaser.GameObjects.Graphics;
  private hunterCharge: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene, private world: World) {
    createTextures(scene);
    const a = world.arena;
    const scale = a.w / 1184;
    scene.add.tileSprite(a.x + a.w / 2, a.y + a.h / 2, a.w + 96, a.h + 142, 'floor').setDepth(0);
    // Keep the expanded arena in the same visible playfield, with fixed DOM HUD.
    const camera = scene.cameras.main;
    camera.setZoom(1 / scale);
    camera.centerOn(a.x + a.w / 2, a.y + a.h / 2 + 27 * scale);
    this.tracks = scene.add.graphics().setDepth(1);
    this.trails = scene.add.graphics().setDepth(25);
    this.cracks = scene.add.graphics().setDepth(12);
    this.hunterCharge = scene.add.graphics().setDepth(24).setData('hunter-charge',true);
    for (const hole of world.holes) scene.add.image(hole.x, hole.y, 'hole').setScale(hole.radius / 15).setDepth(2);
    // Rim made of separate wooden pieces, with rounded outer corner caps.
    for (let x = a.x - 38; x < a.x + a.w + 38; x += 70) {
      this.blockImage(x, a.y - 30, Math.min(70, a.x + a.w + 38 - x), 30).setDepth(14);
      this.blockImage(x, a.y + a.h, Math.min(70, a.x + a.w + 38 - x), 30).setDepth(14);
    }
    for (let y = a.y; y < a.y + a.h; y += 76) {
      this.blockImage(a.x - 38, y, 38, Math.min(76, a.y + a.h - y)).setDepth(14);
      this.blockImage(a.x + a.w, y, 38, Math.min(76, a.y + a.h - y)).setDepth(14);
    }
    for (const obstacle of world.obstacles) this.blocks.set(obstacle.id, this.blockImage(obstacle.x, obstacle.y, obstacle.w, obstacle.h, obstacle.destructible));
    for (const tank of world.tanks) this.createTank(tank);
    this.render(0);
  }
  private blockImage(x: number, y: number, w: number, h: number, destructible = false) {
    return this.scene.add.image(x - 24, y - 24, obstacleTexture(this.scene, w, h, destructible)).setOrigin(0).setDepth(10);
  }
  private createTank(tank: Tank) {
    const texture = tank.kind === 'player' ? ['player', 'partner', 'third', 'fourth'][-tank.id] : tank.kind;
    this.tanks.set(tank.id, {
      shadow: this.scene.add.image(tank.x + 5, tank.y + 7, 'shadow').setScale(0.78, 0.64).setDepth(17),
      body: this.scene.add.image(tank.x, tank.y, `body-${texture}`).setScale(1,tank.kind==='hunter'?.88:1).setDepth(20),
      turret: this.scene.add.image(tank.x, tank.y, `turret-${texture}`).setScale(tank.kind==='hunter'?.9:1).setDepth(22), last: 0,
      label: tank.kind === 'player' && this.world.players.length > 1 ? this.scene.add.text(tank.x, tank.y - 32, `P${1 - tank.id}`, { fontFamily: 'sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff5d5', backgroundColor: ['#24667b', '#a03130', '#31733b', '#8e751e'][-tank.id], padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(23) : undefined,
    });
  }
  render(dt: number) {
    let dirty = false;
    this.hunterCharge.clear();
    for (const tank of this.world.tanks) {
      const sprite = this.tanks.get(tank.id)!;
      if (!tank.alive && !sprite.destroyed) {
        sprite.destroyed = true;
        // Toss the actual painted toy parts through the blast before they fade.
        for (const [part, distance, duration] of [[sprite.body, 13, 700], [sprite.turret, 38, 1100]] as const) {
          const debris = this.scene.add.image(tank.x, tank.y, part.texture.key).setRotation(part === sprite.body ? tank.angle : tank.turret).setDepth(35).setData('tank-debris', true);
          this.scene.tweens.add({ targets: debris, x: tank.x + Math.cos(tank.angle + 1) * distance, y: tank.y - distance, rotation: debris.rotation + 1.8, scale: 0.6, alpha: 0, duration, ease: 'Cubic.Out', onComplete: () => debris.destroy() });
        }
      }
      sprite.label?.setVisible(tank.alive).setPosition(tank.x, tank.y - 32);
      sprite.body.setVisible(tank.alive).setPosition(tank.x, tank.y).setRotation(tank.angle);
      sprite.turret.setVisible(tank.alive).setPosition(tank.x, tank.y).setRotation(tank.turret);
      sprite.shadow.setVisible(tank.alive).setPosition(tank.x + 5, tank.y + 7);
      if(tank.alive&&tank.kind==='hunter'&&(tank.state==='Windup'||tank.state==='Guard')) {
        const charge=tank.hunter?.charge??0;
        this.hunterCharge.lineStyle(3,tank.state==='Guard'?0xa7d4d6:0xe1ad7c,.9).beginPath().arc(tank.x,tank.y,27,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(.05,charge),false).strokePath();
        this.hunterCharge.fillStyle(0xffd4a1,.5+.5*charge).fillCircle(tank.x+Math.cos(tank.turret)*24,tank.y+Math.sin(tank.turret)*24,3+charge*2);
      }
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
      if (p.propelled) {
        sprite.setTint(0xffbb66);
        const length = Math.hypot(p.vx, p.vy), flame = 20 + Math.sin(this.scene.time.now * 0.045 + p.id) * 7;
        const dx = p.vx / length, dy = p.vy / length;
        this.trails.lineStyle(7, 0xf07620, 0.65).lineBetween(p.x - dx * 8, p.y - dy * 8, p.x - dx * flame, p.y - dy * flame);
        this.trails.lineStyle(3, 0xffed9d, 0.95).lineBetween(p.x - dx * 8, p.y - dy * 8, p.x - dx * (flame - 6), p.y - dy * (flame - 6));
      }
      this.trails.lineStyle(2.2, 0xfff2bb, 0.45).lineBetween(p.x, p.y, p.x - p.vx * 0.028, p.y - p.vy * 0.028);
    }
    for (const [id, sprite] of this.shells) if (!this.world.projectiles.some(p => p.id === id)) { sprite.destroy(); this.shells.delete(id); }
  }
}
