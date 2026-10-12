import { GamepadController, DEFAULT_GAMEPAD_CONFIG } from './GamepadController';
import type { GamepadConfig, PadSnapshot } from './GamepadController';
import { GamepadMenus } from './GamepadMenus';

const STORAGE_KEY = 'wooden-tanks-gamepad-v1';
function loadConfig(): Partial<GamepadConfig> {
  try { const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); return value && typeof value === 'object' ? value as Partial<GamepadConfig> : {}; } catch { return {}; }
}
export function readBrowserPads(): readonly (PadSnapshot | null)[] {
  try { return typeof navigator.getGamepads === 'function' ? Array.from(navigator.getGamepads()) : []; } catch { return []; }
}
export const gamepad = new GamepadController(loadConfig());
export function saveGamepadConfig(config: Partial<GamepadConfig>) {
  gamepad.configure(config);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gamepad.config)); } catch { /* Input works without persistence. */ }
}
export { DEFAULT_GAMEPAD_CONFIG };

export class GamepadRuntime {
  private menus = new GamepadMenus();
  private badge: HTMLElement;
  private disconnectedUntil = 0;
  private originals = new WeakMap<HTMLElement, string>();
  private abort = new AbortController();
  constructor(private app: HTMLElement, private onDisconnect: () => void, private onPause: () => void) {
    this.badge = document.createElement('div'); this.badge.className = 'gamepad-status'; this.badge.hidden = true;
    this.badge.setAttribute('role', 'status'); this.badge.setAttribute('aria-live', 'polite'); app.append(this.badge);
    const options = { signal: this.abort.signal };
    const reset = () => gamepad.suppress();
    window.addEventListener('gamepadconnected', () => this.refresh(), options);
    window.addEventListener('gamepaddisconnected', () => this.refresh(), options);
    window.addEventListener('blur', reset, options);
    window.addEventListener('focus', reset, options);
    document.addEventListener('visibilitychange', reset, options);
    window.addEventListener('keydown', event => { if (!event.repeat) gamepad.keyboardMouse(); }, options);
    window.addEventListener('pointerdown', () => gamepad.keyboardMouse(), options);
    window.addEventListener('pointermove', event => { if (event.movementX || event.movementY) gamepad.keyboardMouse(); }, options);
  }
  private refresh() {
    const previous = gamepad.frame;
    const frame = gamepad.poll(readBrowserPads());
    if (previous.connected && (previous.index !== frame.index || previous.id !== frame.id)) {
      this.disconnectedUntil = performance.now() + 3000;
      if (previous.mode === 'gamepad') this.onDisconnect();
    }
    const text = frame.connected ? (frame.mapped ? 'Control conectado · A / B menús' : 'Control detectado · mapeo no compatible') : 'Control desconectado · usa teclado / mouse';
    this.badge.hidden = !frame.connected && performance.now() > this.disconnectedUntil;
    if (this.badge.textContent !== text) this.badge.textContent = text;
    this.badge.title = frame.id;
    const hints = this.app.querySelector<HTMLElement>('.controls-strip') ?? this.app.querySelector<HTMLElement>('.menu-footer > span:last-child');
    if (hints) {
      if (!this.originals.has(hints)) this.originals.set(hints, hints.innerHTML);
      const source = frame.mode === 'gamepad' && frame.mapped ? 'gamepad' : 'keyboard-mouse';
      if (hints.dataset.inputMode !== source) {
        hints.dataset.inputMode = source;
        hints.innerHTML = source === 'gamepad' ? '<span><kbd>LS</kbd> mover · <kbd>RS</kbd> apuntar</span><span><kbd>RT</kbd> disparar · <kbd>MENÚ</kbd> pausa</span><span><kbd>A</kbd> confirmar · <kbd>B</kbd> volver</span>' : this.originals.get(hints)!;
      }
    }
  }
  update() {
    this.refresh();
    const frame = gamepad.frame;
    if (!frame.mapped) return;
    if (frame.pause) { this.onPause(); return; }
    this.menus.update(document.querySelector<HTMLElement>('#ui')!, frame);
  }
  destroy() { this.abort.abort(); this.badge.remove(); }
}
