import { GamepadController, isMapped, STANDARD_BUTTONS } from './GamepadController';
import type { GamepadConfig, PadSnapshot } from './GamepadController';
export type CoopLayout = 'two-pads' | 'keyboard-pad';
import type { PlayerCount } from '../game/types';
type Assignment = Pick<PadSnapshot, 'index' | 'id'>;

/** Reserve devices for a session: a disconnect must never hand P2's pad to P1. */
export class GamepadTeam {
  private controllers: GamepadController[];
  playerCount: PlayerCount = 2;
  private assignments: (Assignment | null)[] = [null, null, null, null];
  layout: CoopLayout | null = null;
  connectedCount = 0;
  pauseRequested = false;
  private pauseLatch = false;
  constructor(config: Partial<GamepadConfig> = {}) {
    this.controllers = Array.from({ length: 4 }, () => new GamepadController(config));
  }
  get frame() { return this.controllers[0].frame; }
  get secondFrame() { return this.controllers[1].frame; }
  get frames() { return this.controllers.map(c => c.frame); }
  get config() { return this.controllers[0].config; }
  get ready() { return !this.layout || this.frames.slice(this.layout === 'keyboard-pad' ? 1 : 0, this.playerCount).every(f => f.mapped); }
  configure(config: Partial<GamepadConfig>) { this.controllers.forEach(c => c.configure(config)); }
  suppress() { this.controllers.forEach(c => c.suppress()); }
  prepareBattle() { this.controllers.forEach(c => c.prepareBattle()); }
  keyboardMouse() { if (!this.layout) this.controllers[0].keyboardMouse(); }
  startCoop(layout: CoopLayout, pads: readonly (PadSnapshot | null)[], playerCount: PlayerCount = 2, preserveOrder = false): boolean {
    const mapped = pads.filter((p): p is PadSnapshot => !!p && p.connected && isMapped(p));
    if (mapped.length < (layout === 'two-pads' ? playerCount : playerCount - 1)) return false;
    // Keep the controller already used in menus as P1 when playing with two pads.
    const first = (preserveOrder ? mapped[0] : mapped.find(p => p.index === this.frame.index && p.id === this.frame.id)) ?? mapped[0];
    const ordered = [first, ...mapped.filter(p => p.index !== first.index)];
    this.playerCount = playerCount;
    this.assignments = Array.from({ length: 4 }, (_, slot) => {
      if (slot >= playerCount || (slot === 0 && layout === 'keyboard-pad')) return null;
      const pad = ordered[slot - (layout === 'keyboard-pad' ? 1 : 0)];
      return { index: pad.index, id: pad.id };
    });
    this.layout = layout; this.suppress(); this.poll(pads); this.suppress();
    return true;
  }
  endCoop() { this.layout = null; this.assignments = [null, null, null, null]; this.pauseLatch = false; this.pauseRequested = false; this.suppress(); }
  poll(pads: readonly (PadSnapshot | null)[]) {
    this.connectedCount = pads.filter(p => p?.connected && isMapped(p)).length;
    if (!this.layout) { this.controllers.forEach((c, i) => c.poll(i === 0 ? pads : [])); }
    else {
      const assigned = (slot: number) => pads.filter(p => p?.connected && p.index === this.assignments[slot]?.index && p.id === this.assignments[slot]?.id);
      this.controllers.forEach((c, i) => c.poll(assigned(i)));
    }
    const pauseHeld = this.frames.some(frame => frame.mapped && pads.some(p => p?.connected && p.index === frame.index && p.id === frame.id &&
      (p.buttons[STANDARD_BUTTONS.pause]?.pressed || p.buttons[STANDARD_BUTTONS.pause]?.value >= 0.5)));
    if (!pauseHeld) this.pauseLatch = false;
    this.pauseRequested = !this.pauseLatch && this.frames.some(f => f.pause);
    if (this.pauseRequested) this.pauseLatch = true;
    return this.frame;
  }
}
