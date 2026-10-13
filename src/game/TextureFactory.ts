import Phaser from 'phaser';
import { TANK_COLORS } from './Tank';
type Ctx = CanvasRenderingContext2D;
function random(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function canvas(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return { canvas: c, ctx: c.getContext('2d')! }; }
function rounded(c: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) { c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function hex(color: number) { return `#${color.toString(16).padStart(6, '0')}`; }
function wood(c: Ctx, x: number, y: number, w: number, h: number, seed: number, dark = false) {
  const rng = random(seed); c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const gradient = c.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, dark ? '#b79861' : '#f2d99c'); gradient.addColorStop(0.5, dark ? '#937444' : '#e2c187'); gradient.addColorStop(1, dark ? '#a98b54' : '#efd49a');
  c.fillStyle = gradient; c.fillRect(x, y, w, h);
  const knots = [{ x: x + w * (0.18 + rng() * 0.15), y: y + h * (0.3 + rng() * 0.4) }, { x: x + w * (0.68 + rng() * 0.16), y: y + h * (0.3 + rng() * 0.4) }];
  for (let i = 0; i < h * 1.15; i++) {
    const yy = y + rng() * h, amplitude = rng() * 2 + 0.4;
    c.strokeStyle = rng() > 0.45 ? `rgba(139,96,43,${rng() * 0.13 + 0.025})` : `rgba(255,245,200,${rng() * 0.2})`;
    c.lineWidth = rng() * 1.2 + 0.3; c.beginPath();
    for (let xx = 0; xx <= w + 12; xx += Math.max(4, w / 60)) {
      let deviation = Math.sin(xx / 90 + seed) * amplitude;
      for (const knot of knots) {
        const dx = x + xx - knot.x, dy = yy - knot.y;
        deviation += Math.exp(-dx * dx / 17000) * Math.exp(-dy * dy / 450) * Math.sign(dy) * 13;
      }
      if (!xx) c.moveTo(x + xx, yy + deviation); else c.lineTo(x + xx, yy + deviation);
    }
    c.stroke();
  }
  for (const knot of knots) {
    for (let ring = 1; ring < 9; ring++) {
      c.strokeStyle = `rgba(145,100,48,${0.14 - ring * 0.009})`; c.lineWidth = 1;
      c.beginPath(); c.ellipse(knot.x, knot.y, ring * Math.min(8, w / 25), ring * 1.5, 0.015, 0, Math.PI * 2); c.stroke();
    }
    c.fillStyle = 'rgba(136,91,40,.13)'; c.beginPath(); c.ellipse(knot.x, knot.y, Math.min(11, w / 15), 2, 0, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}
export function createTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('floor')) return;
  const floor = canvas(1280, 720); const c = floor.ctx;
  for (let i = 0; i < 8; i++) {
    wood(c, 0, i * 96, 1280, 96, i * 22 + 99);
    c.fillStyle = 'rgba(110,75,35,.12)'; c.fillRect(0, i * 96, 1280, 1);
    c.fillStyle = 'rgba(255,247,218,.4)'; c.fillRect(0, i * 96 + 1, 1280, 1);
  }
  // Finely textured fibers, generated once instead of per frame.
  const rng = random(888);
  for (let i = 0; i < 14000; i++) { c.fillStyle = rng() > 0.5 ? 'rgba(116,78,35,.035)' : 'rgba(255,255,235,.07)'; c.fillRect(rng() * 1280, rng() * 720, 1 + rng() * 10, 0.7); }
  const vignette = c.createRadialGradient(640, 330, 200, 640, 330, 740);
  vignette.addColorStop(0, 'rgba(76,44,15,0)'); vignette.addColorStop(1, 'rgba(76,44,15,.18)'); c.fillStyle = vignette; c.fillRect(0, 0, 1280, 720);
  scene.textures.addCanvas('floor', floor.canvas);
  // A recessed opening: shadow at the upper inner lip, lit lower cut edge,
  // and no cast shadow outside the opening (unlike a raised wooden block).
  const hole = canvas(48, 48); const pit = hole.ctx;
  pit.translate(24, 24);
  pit.fillStyle = '#997b48'; pit.beginPath(); pit.arc(0, 0, 16, 0, Math.PI * 2); pit.fill();
  pit.save(); pit.beginPath(); pit.arc(0, 0, 15, 0, Math.PI * 2); pit.clip();
  const depth = pit.createLinearGradient(-5, -15, 5, 15);
  depth.addColorStop(0, '#332b20'); depth.addColorStop(0.45, '#53422b'); depth.addColorStop(1, '#a68a56');
  pit.fillStyle = depth; pit.fillRect(-16, -16, 32, 32);
  pit.fillStyle = '#2a241cb3'; pit.beginPath(); pit.ellipse(-2, -4, 13, 9, -0.15, 0, Math.PI * 2); pit.fill();
  pit.lineWidth = 5; pit.strokeStyle = '#b59a6555'; pit.beginPath(); pit.arc(0, -1, 14, 0.1, Math.PI - 0.1); pit.stroke();
  pit.restore();
  pit.lineWidth = 1.6; pit.strokeStyle = '#f3dda4'; pit.beginPath(); pit.arc(0, 0, 16, 0.15, Math.PI - 0.15); pit.stroke();
  pit.lineWidth = 1.2; pit.strokeStyle = '#6d532f'; pit.beginPath(); pit.arc(0, 0, 15.5, Math.PI + 0.1, Math.PI * 2 - 0.1); pit.stroke();
  scene.textures.addCanvas('hole', hole.canvas);
  const shadow = canvas(100, 100); const s = shadow.ctx;
  const grad = s.createRadialGradient(50, 50, 8, 50, 50, 49); grad.addColorStop(0, 'rgba(46,32,18,.5)'); grad.addColorStop(0.55, 'rgba(46,32,18,.25)'); grad.addColorStop(1, 'rgba(46,32,18,0)');
  s.fillStyle = grad; s.fillRect(0, 0, 100, 100); scene.textures.addCanvas('shadow', shadow.canvas);
  const spark = canvas(24, 24); const sp = spark.ctx;
  const sg = sp.createRadialGradient(12, 12, 0, 12, 12, 12); sg.addColorStop(0, '#fff9d9'); sg.addColorStop(0.25, '#ffd376'); sg.addColorStop(1, 'rgba(255,162,57,0)'); sp.fillStyle = sg; sp.fillRect(0, 0, 24, 24); scene.textures.addCanvas('spark', spark.canvas);
  const smoke = canvas(50, 50); const sm = smoke.ctx;
  const mg = sm.createRadialGradient(25, 25, 0, 25, 25, 25); mg.addColorStop(0, 'rgba(146,130,104,.6)'); mg.addColorStop(0.5, 'rgba(146,130,104,.3)'); mg.addColorStop(1, 'rgba(146,130,104,0)'); sm.fillStyle = mg; sm.fillRect(0, 0, 50, 50); scene.textures.addCanvas('smoke', smoke.canvas);
  const chip = canvas(10, 6); rounded(chip.ctx, 0, 0, 10, 6, 1, '#b98a4b'); chip.ctx.fillStyle = '#f1c480'; chip.ctx.fillRect(0, 0, 9, 2); scene.textures.addCanvas('chip', chip.canvas);
  const shell = canvas(24, 12); const b = shell.ctx;
  rounded(b, 3, 3, 17, 7, 3, '#4d3924'); rounded(b, 4, 2, 16, 6, 3, '#c39c52'); rounded(b, 6, 2, 13, 3, 2, '#fff1b0'); b.fillStyle = '#6c5736'; b.fillRect(4, 3, 3, 5); scene.textures.addCanvas('shell', shell.canvas);
  for (const [kind, color] of Object.entries({ ...TANK_COLORS, partner: 0xd54b47, third: 0x53a65c, fourth: 0xe3bf38 })) {
    const body = canvas(90, 90), t = body.ctx;
    t.translate(45, 45);
    for (const y of [-21, 12]) {
      rounded(t, -23, y, 45, 10, 4, '#292c27'); rounded(t, -21, y + 1, 41, 3, 2, '#656559');
      for (let x = -18; x <= 18; x += 6) { t.fillStyle = '#ada588'; t.fillRect(x, y + 2, 2, 6); t.fillStyle = '#181c18'; t.fillRect(x + 2, y + 3, 3, 4); }
    }
    rounded(t, -20, -16, 40, 33, 6, '#222d29'); rounded(t, -21, -18, 40, 32, 5, hex(color));
    const hull = t.createLinearGradient(-20, -18, 20, 14); hull.addColorStop(0, '#ffffff55'); hull.addColorStop(0.45, '#ffffff08'); hull.addColorStop(1, '#00000055');
    t.fillStyle = hull; t.beginPath(); t.roundRect(-21, -18, 40, 32, 5); t.fill();
    t.strokeStyle = '#ffffff55'; t.lineWidth = 1.5; t.strokeRect(-16, -14, 28, 22);
    t.fillStyle = '#151e1d99'; t.fillRect(-16, -10, 5, 18);
    for (const y of [-13, 9]) { t.fillStyle = '#f8e7b6'; t.fillRect(12, y, 4, 4); }
    t.fillStyle = '#d9c597'; for (const y of [-13, 10]) { t.beginPath(); t.arc(-16, y, 1.5, 0, Math.PI * 2); t.fill(); }
    if (!['player', 'partner', 'third', 'fourth'].includes(kind)) {
      t.fillStyle = '#20232a';
      for (const x of [-9, 4]) { t.save(); t.translate(x, 0); t.rotate(-0.45); t.fillRect(-2, -17, 4, 30); t.restore(); }
      if (kind === 'tactical') { t.fillStyle = '#e87929'; t.fillRect(-21, -15, 7, 27); t.fillRect(12, -15, 7, 27); }
      if (kind === 'hunter') {
        t.fillStyle = '#be8057'; t.fillRect(-19, -15, 6, 26); t.fillRect(11, -15, 6, 26);
        t.strokeStyle = '#e1ad7c'; t.lineWidth = 2; t.beginPath(); t.moveTo(-6,-10); t.lineTo(2,0); t.lineTo(-6,10); t.stroke();
      }
    }
    scene.textures.addCanvas(`body-${kind}`, body.canvas);
    const turret = canvas(90, 90), u = turret.ctx; u.translate(45, 45);
    rounded(u, -10, -9, 27, 23, 8, '#00000044');
    rounded(u, 4, -3, 30, 7, 2, '#4c3d28'); rounded(u, 4, -5, 29, 6, 2, '#dcc189'); u.fillStyle = '#f7e3ae'; u.fillRect(6, -5, 25, 2); u.fillStyle = '#2e2a21'; u.fillRect(31, -4, 3, 4);
    rounded(u, -12, -12, 27, 23, 7, hex(color));
    const tg = u.createLinearGradient(0, -12, 0, 12); tg.addColorStop(0, '#ffffff66'); tg.addColorStop(0.5, '#ffffff00'); tg.addColorStop(1, '#00000066'); u.fillStyle = tg; u.beginPath(); u.roundRect(-12, -12, 27, 23, 7); u.fill();
    rounded(u, -7, -8, 15, 12, 4, '#18272088'); u.strokeStyle = '#ffffff55'; u.lineWidth = 1; u.beginPath(); u.roundRect(-7, -8, 15, 12, 4); u.stroke();
    u.fillStyle = '#ead7a0'; u.fillRect(-4, -9, 8, 2);
    if (!['player', 'partner', 'third', 'fourth'].includes(kind)) { u.fillStyle = kind === 'tactical' ? '#eb7628' : '#25232d'; u.fillRect(-11, -3, 25, 4); }
    if (kind === 'hunter') { u.fillStyle = '#be8057'; u.fillRect(-10,-9,4,17); u.fillRect(12,-4,16,4); }
    scene.textures.addCanvas(`turret-${kind}`, turret.canvas);
  }
}
export function obstacleTexture(scene: Phaser.Scene, w: number, h: number, destructible = false): string {
  const key = `block-${w}-${h}-${destructible}`; if (scene.textures.exists(key)) return key;
  const { canvas: image, ctx: c } = canvas(w + 48, h + 56);
  c.shadowColor = 'rgba(53,38,20,.38)'; c.shadowBlur = 13; c.shadowOffsetX = 5; c.shadowOffsetY = 10;
  c.fillStyle = '#8e733e'; c.fillRect(24, 18, w, h + 10); c.shadowColor = 'transparent';
  const side = c.createLinearGradient(0, h + 10, 0, h + 30); side.addColorStop(0, '#a28854'); side.addColorStop(1, '#695c3b');
  c.fillStyle = side; c.fillRect(24, 24 + h - 14, w, 24); c.fillStyle = '#594d32'; c.fillRect(24, 24 + h + 9, w, 2);
  if (destructible) {
    const g = c.createLinearGradient(0, 16, 0, h + 16); g.addColorStop(0, '#dbb69b'); g.addColorStop(1, '#b28970'); c.fillStyle = g; c.fillRect(24, 16, w, h);
    const rng = random(w + h * 7);
    for (let i = 0; i < w * h / 8; i++) { c.fillStyle = ['#936e56', '#f0d3b1', '#c5a085'][Math.floor(rng() * 3)]; const x = 24 + rng() * w, y = 16 + rng() * h; c.beginPath(); c.ellipse(x, y, rng() * 3 + 1, rng() * 2 + 0.5, rng() * 3, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#86654f'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(24 + w * 0.7, 16); c.lineTo(24 + w * 0.4, 16 + h * 0.4); c.lineTo(24 + w * 0.6, 16 + h * 0.7); c.lineTo(24 + w * 0.35, 16 + h); c.stroke();
  } else {
    for (let yy = 0; yy < h; yy += 44) for (let xx = 0; xx < w; xx += 44) {
      const bw = Math.min(44, w - xx), bh = Math.min(44, h - yy);
      wood(c, 24 + xx, 16 + yy, bw, bh, 42 + xx * 31 + yy * 97);
      c.fillStyle = 'rgba(255,248,197,.55)'; c.fillRect(24 + xx, 16 + yy, bw, 2); c.fillRect(24 + xx, 16 + yy, 2, bh);
      c.fillStyle = 'rgba(92,64,31,.28)'; c.fillRect(24 + xx + bw - 1, 16 + yy, 1, bh); c.fillRect(24 + xx, 16 + yy + bh - 1, bw, 1);
    }
  }
  c.strokeStyle = '#9a7c4666'; c.lineWidth = 1; c.strokeRect(24.5, 16.5, w - 1, h - 1);
  scene.textures.addCanvas(key, image); return key;
}
