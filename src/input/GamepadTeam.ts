import { GamepadController, isMapped, STANDARD_BUTTONS } from './GamepadController';
import type { GamepadConfig, PadSnapshot } from './GamepadController';
export type CoopLayout = 'two-pads' | 'keyboard-pad';
type Assignment = Pick<PadSnapshot, 'index' | 'id'>;

/** Reserve devices for a session: a disconnect must never hand P2's pad to P1. */
export class GamepadTeam {
  private primary: GamepadController;
  private secondary: GamepadController;
  private assignments: (Assignment | null)[] = [null, null];
  layout: CoopLayout | null = null;
  connectedCount = 0;
  pauseRequested = false;
  private pauseLatch = false;
  constructor(config: Partial<GamepadConfig> = {}) {
    this.primary = new GamepadController(config); this.secondary = new GamepadController(config);
  }
  get frame() { return this.primary.frame; }
  get secondFrame() { return this.secondary.frame; }
  get frames() { return [this.frame, this.secondFrame]; }
  get config() { return this.primary.config; }
  get ready() { return !this.layout || (this.secondFrame.mapped && (this.layout === 'keyboard-pad' || this.frame.mapped)); }
  configure(config: Partial<GamepadConfig>) { this.primary.configure(config); this.secondary.configure(config); }
  suppress() { this.primary.suppress(); this.secondary.suppress(); }
  keyboardMouse() { if (!this.layout) this.primary.keyboardMouse(); }
  startCoop(layout: CoopLayout, pads: readonly (PadSnapshot | null)[]): boolean {
    const mapped = pads.filter((p): p is PadSnapshot => !!p && p.connected && isMapped(p));
    if (mapped.length < (layout === 'two-pads' ? 2 : 1)) return false;
    // Keep the controller already used in menus as P1 when playing with two pads.
    const first = mapped.find(p => p.index === this.frame.index && p.id === this.frame.id) ?? mapped[0];
    const second = layout === 'two-pads' ? mapped.find(p => p.index !== first.index)! : first;
    this.assignments = [layout === 'two-pads' ? { index: first.index, id: first.id } : null, { index: second.index, id: second.id }];
    this.layout = layout; this.suppress(); this.poll(pads); this.suppress();
    return true;
  }
  endCoop() { this.layout = null; this.assignments = [null, null]; this.pauseLatch = false; this.pauseRequested = false; this.suppress(); }
  poll(pads: readonly (PadSnapshot | null)[]) {
    this.connectedCount = pads.filter(p => p?.connected && isMapped(p)).length;
    if (!this.layout) { this.primary.poll(pads); this.secondary.poll([]); }
    else {
      const assigned = (slot: number) => pads.filter(p => p?.connected && p.index === this.assignments[slot]?.index && p.id === this.assignments[slot]?.id);
      this.primary.poll(assigned(0)); this.secondary.poll(assigned(1));
    }
    const pauseHeld = this.frames.some(frame => frame.mapped && pads.some(p => p?.connected && p.index === frame.index && p.id === frame.id &&
      (p.buttons[STANDARD_BUTTONS.pause]?.pressed || p.buttons[STANDARD_BUTTONS.pause]?.value >= 0.5)));
    if (!pauseHeld) this.pauseLatch = false;
    this.pauseRequested = !this.pauseLatch && this.frames.some(f => f.pause);
    if (this.pauseRequested) this.pauseLatch = true;
    return this.frame;
  }
}
