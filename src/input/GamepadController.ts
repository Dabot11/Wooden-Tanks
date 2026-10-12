import type { Vec } from '../game/types';

export interface GamepadConfig { leftDeadzone: number; rightDeadzone: number }
export const DEFAULT_GAMEPAD_CONFIG: GamepadConfig = { leftDeadzone: 0.18, rightDeadzone: 0.2 };
export const STANDARD_BUTTONS = { confirm: 0, cancel: 1, fire: 7, pause: 9, up: 12, down: 13, left: 14, right: 15 } as const;
export interface PadButton { pressed: boolean; value: number }
export interface PadSnapshot {
  id: string; index: number; connected: boolean; mapping: string;
  axes: readonly number[]; buttons: readonly PadButton[];
}
export interface PadFrame {
  connected: boolean; mapped: boolean; id: string; index: number | null;
  move: Vec; aim: Vec; fire: boolean; confirm: boolean; cancel: boolean; pause: boolean;
  navigation: Vec; mode: 'keyboard-mouse' | 'gamepad';
}
const zero = (): Vec => ({ x: 0, y: 0 });
export function normalizeAxis(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
}
/** Radial deadzone avoids diagonal bias and remaps the remaining travel to [0, 1]. */
export function normalizeStick(x: number | undefined, y: number | undefined, deadzone: number): Vec {
  x = normalizeAxis(x); y = normalizeAxis(y);
  const dz = Number.isFinite(deadzone) ? Math.max(0, Math.min(0.95, deadzone)) : 0.2;
  const length = Math.hypot(x, y);
  if (length <= dz || length < 1e-9) return zero();
  const magnitude = (Math.min(1, length) - dz) / (1 - dz);
  return { x: x / length * magnitude, y: y / length * magnitude };
}
export function validateConfig(config: Partial<GamepadConfig>): GamepadConfig {
  const zone = (value: number | undefined, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0.05, Math.min(0.45, value)) : fallback;
  return { leftDeadzone: zone(config.leftDeadzone, DEFAULT_GAMEPAD_CONFIG.leftDeadzone), rightDeadzone: zone(config.rightDeadzone, DEFAULT_GAMEPAD_CONFIG.rightDeadzone) };
}
export function isMapped(pad: PadSnapshot): boolean {
  return pad.mapping === 'standard' && pad.axes.length >= 4 && pad.buttons.length >= 10;
}
export function selectPad(pads: readonly (PadSnapshot | null)[], previous: PadFrame): PadSnapshot | null {
  const connected = pads.filter((p): p is PadSnapshot => !!p && p.connected);
  const current = connected.find(p => p.index === previous.index && p.id === previous.id);
  return (current && isMapped(current) ? current : connected.find(isMapped)) ?? current ?? connected[0] ?? null;
}
function empty(mode: PadFrame['mode']): PadFrame {
  return { connected: false, mapped: false, id: '', index: null, move: zero(), aim: zero(), fire: false, confirm: false, cancel: false, pause: false, navigation: zero(), mode };
}
function button(pad: PadSnapshot, index: number): boolean {
  const b = pad.buttons[index];
  return !!b && (b.pressed || (Number.isFinite(b.value) && b.value >= 0.5));
}

/** Pure input state machine: no browser, Phaser, physics or UI dependencies. */
export class GamepadController {
  frame = empty('keyboard-mouse');
  config: GamepadConfig;
  private armed = false;
  private trigger = false;
  private previous = { confirm: false, cancel: false, pause: false, up: false, down: false, left: false, right: false };
  private navLatch: Vec = zero();
  private anchorMove: Vec = zero();
  private anchorAim: Vec = zero();
  constructor(config: Partial<GamepadConfig> = {}) { this.config = validateConfig(config); }
  configure(config: Partial<GamepadConfig>) { this.config = validateConfig({ ...this.config, ...config }); this.suppress(); }
  keyboardMouse() {
    this.frame.mode = 'keyboard-mouse';
    this.anchorMove = { ...this.frame.move }; this.anchorAim = { ...this.frame.aim };
  }
  /** New screen, resume, focus or device: require all sticks/buttons to return to rest. */
  suppress() {
    this.armed = false;
    this.frame = { ...this.frame, move: zero(), aim: zero(), fire: false, confirm: false, cancel: false, pause: false, navigation: zero() };
  }
  poll(pads: readonly (PadSnapshot | null)[]): PadFrame {
    const pad = selectPad(pads, this.frame);
    const changed = this.frame.index !== (pad?.index ?? null) || this.frame.id !== (pad?.id ?? '');
    if (changed) {
      this.armed = false; this.trigger = false; this.navLatch = zero();
      this.anchorMove = zero(); this.anchorAim = zero();
      this.previous = { confirm: false, cancel: false, pause: false, up: false, down: false, left: false, right: false };
    }
    if (!pad || !isMapped(pad)) {
      this.frame = { ...empty('keyboard-mouse'), connected: !!pad, mapped: false, id: pad?.id ?? '', index: pad?.index ?? null };
      return this.frame;
    }
    const move = normalizeStick(pad.axes[0], pad.axes[1], this.config.leftDeadzone);
    const aim = normalizeStick(pad.axes[2], pad.axes[3], this.config.rightDeadzone);
    const buttons = {
      confirm: button(pad, STANDARD_BUTTONS.confirm), cancel: button(pad, STANDARD_BUTTONS.cancel), pause: button(pad, STANDARD_BUTTONS.pause),
      up: button(pad, STANDARD_BUTTONS.up), down: button(pad, STANDARD_BUTTONS.down), left: button(pad, STANDARD_BUTTONS.left), right: button(pad, STANDARD_BUTTONS.right),
    };
    // Hysteresis filters noisy analog triggers near the actuation threshold.
    const rt = pad.buttons[STANDARD_BUTTONS.fire]?.value;
    const triggerValue = typeof rt === 'number' && Number.isFinite(rt) ? Math.max(0, Math.min(1, rt)) : 0;
    const fire = triggerValue >= (this.trigger ? 0.35 : 0.55);
    let navigation = zero();
    if (Math.hypot(move.x, move.y) < 0.35) this.navLatch = zero();
    else if (Math.max(Math.abs(move.x), Math.abs(move.y)) >= 0.6) {
      const direction = Math.abs(move.x) > Math.abs(move.y) ? { x: Math.sign(move.x), y: 0 } : { x: 0, y: Math.sign(move.y) };
      if (direction.x !== this.navLatch.x || direction.y !== this.navLatch.y) navigation = direction;
      this.navLatch = direction;
    }
    const edge = (name: keyof typeof buttons) => buttons[name] && !this.previous[name];
    const confirm = edge('confirm'), cancel = edge('cancel'), pause = edge('pause');
    if (edge('up') && !buttons.down) navigation.y = -1;
    if (edge('down') && !buttons.up) navigation.y = 1;
    if (edge('left') && !buttons.right) navigation.x = -1;
    if (edge('right') && !buttons.left) navigation.x = 1;
    const activity = confirm || cancel || pause || (fire && !this.trigger) || navigation.x !== 0 || navigation.y !== 0 ||
      (Math.hypot(move.x, move.y) > 0 && (!Math.hypot(this.anchorMove.x, this.anchorMove.y) || Math.hypot(move.x - this.anchorMove.x, move.y - this.anchorMove.y) > 0.1)) || (Math.hypot(aim.x, aim.y) > 0 && (!Math.hypot(this.anchorAim.x, this.anchorAim.y) || Math.hypot(aim.x - this.anchorAim.x, aim.y - this.anchorAim.y) > 0.1));
    const neutral = !Math.hypot(move.x, move.y) && !Math.hypot(aim.x, aim.y) && triggerValue < 0.1 && !Object.values(buttons).some(Boolean);
    const wasArmed = this.armed;
    if (!this.armed && neutral) this.armed = true;
    let mode = changed ? 'keyboard-mouse' as const : this.frame.mode;
    if (wasArmed && activity) {
      mode = 'gamepad'; this.anchorMove = { ...move }; this.anchorAim = { ...aim };
    }
    // Returning to center is not an intentional takeover of keyboard/mouse input.
    if (!Math.hypot(move.x, move.y)) this.anchorMove = zero();
    if (!Math.hypot(aim.x, aim.y)) this.anchorAim = zero();
    this.previous = buttons; this.trigger = fire;
    this.frame = {
      connected: true, mapped: true, id: pad.id, index: pad.index, mode,
      move: wasArmed ? move : zero(), aim: wasArmed ? aim : zero(), fire: wasArmed && fire,
      confirm: wasArmed && confirm, cancel: wasArmed && cancel, pause: wasArmed && pause, navigation: wasArmed ? navigation : zero(),
    };
    return this.frame;
  }
}
