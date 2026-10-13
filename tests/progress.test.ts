import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Progress } from '../src/game/Progress.ts';
function storage(t: { after(fn: () => void): void }, initial: unknown) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let value = typeof initial === 'string' ? initial : JSON.stringify(initial);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => value, setItem: (_key: string, next: string) => { value = next; },
  } });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else Reflect.deleteProperty(globalThis, 'localStorage'); });
  return () => JSON.parse(value);
}
test('a completed original campaign unlocks mission 11 and preserves the record and preferences', t => {
  const saved = storage(t, { unlocked: 10, wins: 2, best: 12005, muted: true });
  const p = new Progress();
  assert.deepEqual(p.data, { unlocked: 11, wins: 2, best: 12005, muted: true });
  assert.deepEqual(saved(), p.data);
});
test('an unfinished original campaign must still complete mission 10', t => {
  storage(t, { unlocked: 10, wins: 0, best: 6000 });
  const p = new Progress(); assert.equal(p.data.unlocked, 10);
  p.unlock(11); assert.equal(p.data.unlocked, 11);
});
test('new campaign progress persists beyond mission 10 and caps at mission 30', t => {
  const saved = storage(t, { unlocked: 17, wins: 0, best: 14000, muted: false });
  const p = new Progress(); assert.equal(p.data.unlocked, 17);
  p.unlock(30); assert.equal(saved().unlocked, 30);
  assert.equal(new Progress().data.unlocked, 30);
  p.unlock(999); assert.equal(p.data.unlocked, 30);
  p.unlock(11); assert.equal(p.data.unlocked, 30);
});
test('corrupt saved data does not unlock the new chapter or prevent playing', t => {
  storage(t, '{broken');
  assert.deepEqual(new Progress().data, { unlocked: 1, wins: 0, best: 0, muted: false });
});

test('a completed twenty-mission save unlocks mission 21 without losing preferences', t => {
  storage(t, { unlocked: 20, wins: 1, best: 22000, muted: true });
  assert.deepEqual(new Progress().data, { unlocked: 21, wins: 1, best: 22000, muted: true });
});
test('an unfinished mission 20 still has to be won', t => {
  storage(t, { unlocked: 20, wins: 0, best: 9000 });
  assert.equal(new Progress().data.unlocked, 20);
});
