import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PlayerLobby, deviceName, readyButton } from '../src/input/PlayerLobby.ts';
import type { PadSnapshot } from '../src/input/GamepadController.ts';
import { GamepadTeam } from '../src/input/GamepadTeam.ts';
import { duelLevel, duelResult, DUEL_TARGET } from '../src/game/Duel.ts';
import { World } from '../src/game/World.ts';
const pad = (index: number, id = 'Xbox'): PadSnapshot => ({ index, id, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) });
const press = (p: PadSnapshot, held: boolean) => p.buttons[0] = { pressed: held, value: held ? 1 : 0 };
test('device identification and ready hints support Xbox, Nintendo, Sony and generic devices', () => {
  for (const [id, name] of [['Xbox Series Controller', 'Xbox'], ['Pro Controller (Vendor: 057e)', 'Nintendo'], ['DualSense (054c)', 'PlayStation'], ['Other pad', 'Control']]) assert.equal(deviceName(id), name);
  assert.equal(readyButton('DualSense'), '✕'); assert.match(readyButton('Nintendo'), /B/); assert.equal(readyButton('Xbox'), 'A');
});
test('four players must confirm their own device, held buttons do not ready or repeatedly toggle', () => {
  const pads = [pad(0), pad(2), pad(3), pad(5)], lobby = new PlayerLobby(4);
  press(pads[0], true); lobby.update(pads); assert.equal(lobby.slots[0].ready, false);
  press(pads[0], false); lobby.update(pads);
  pads.forEach(p => press(p, true)); lobby.update(pads); assert.equal(lobby.allReady, true);
  lobby.update(pads); assert.equal(lobby.allReady, true);
  pads.forEach(p => press(p, false)); lobby.update(pads); press(pads[2], true); lobby.update(pads);
  assert.equal(lobby.slots[2].ready, false); assert.equal(lobby.allReady, false);
});
test('missing and incompatible devices cannot ready; disconnect cancels readiness and preserves slots', () => {
  const a = pad(0), b = pad(1), c = pad(2), lobby = new PlayerLobby(3);
  c.mapping = ''; lobby.update([a, b, c]); assert.equal(lobby.missing, 1);
  c.mapping = 'standard'; lobby.update([a, b, c]); [a,b,c].forEach(p => press(p,true)); lobby.update([a,b,c]); assert.equal(lobby.allReady,true);
  lobby.update([a,null,c,pad(9)]); assert.equal(lobby.slots[1].device?.index, 1); assert.equal(lobby.slots[1].ready,false);
  lobby.update([a,b,c]); assert.equal(lobby.slots[1].ready,false);
  press(b,false); lobby.update([a,b,c]); press(b,true); lobby.update([a,b,c]); assert.equal(lobby.allReady,true);
});
test('keyboard readiness and changes to party size or scheme reset confirmations', () => {
  const lobby = new PlayerLobby(4,'keyboard-pad'), pads = [pad(0),pad(1),pad(2)]; lobby.update(pads);
  assert.equal(lobby.missing,0); assert.equal(lobby.slots[0].keyboard,true);
  lobby.keyboardReady(); pads.forEach(p=>press(p,true)); lobby.update(pads); assert.equal(lobby.allReady,true);
  lobby.reset(2,'two-pads'); lobby.update(pads); assert.equal(lobby.allReady,false); assert.equal(lobby.slots.length,2);
});
test('lobby device order exactly matches the live team even when another pad was used in menus', () => {
  const a = pad(0), b = pad(4), team = new GamepadTeam(); team.poll([b]);
  const lobby = new PlayerLobby(2); lobby.update([a,b]);
  assert.ok(team.startCoop(lobby.layout,lobby.devices([a,b]),lobby.count,true));
  assert.equal(team.frame.index,0); assert.equal(team.secondFrame.index,4);
});
for (const count of [2,3,4] as const) test(`${count}-player duels have separated, safe spawns and no AI on every arena`, () => {
  for (let round=1;round<=6;round++) {
    const w = new World(duelLevel(round),count,'duel'); assert.equal(w.enemies.length,0); assert.equal(w.players.length,count);
    for (const p of w.players) assert.ok(w.canStand(p,p.radius,p.id));
    for (let i=0;i<count;i++) for(let j=i+1;j<count;j++) assert.ok(Math.hypot(w.players[i].x-w.players[j].x,w.players[i].y-w.players[j].y)>300);
    if (count === 3) {
      const lengths = w.players.map((p, i) => { const q = w.players[(i + 1) % 3]; return Math.hypot(p.x - q.x, p.y - q.y); });
      assert.ok(Math.max(...lengths) - Math.min(...lengths) < 2, 'three players start at equal distances');
    }
    assert.equal(duelResult(w.players),undefined);
    w.players.slice(1).forEach(p=>p.alive=false); assert.equal(duelResult(w.players),0);
    w.player.alive=false; assert.equal(duelResult(w.players),null);
  }
  assert.equal(DUEL_TARGET,3);
});
