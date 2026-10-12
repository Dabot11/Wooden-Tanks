import { DEFAULT_GAMEPAD_CONFIG } from './GamepadController';
import type { GamepadConfig, PadSnapshot } from './GamepadController';
import { GamepadTeam } from './GamepadTeam';
import { GamepadMenus } from './GamepadMenus';

const STORAGE_KEY = 'wooden-tanks-gamepad-v1';
function loadConfig(): Partial<GamepadConfig> {
  try { const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); return value && typeof value === 'object' ? value as Partial<GamepadConfig> : {}; } catch { return {}; }
}
export function readBrowserPads(): readonly (PadSnapshot | null)[] {
  try { return typeof navigator.getGamepads === 'function' ? Array.from(navigator.getGamepads()) : []; } catch { return []; }
}
export const gamepad = new GamepadTeam(loadConfig());
export function saveGamepadConfig(config: Partial<GamepadConfig>) {
  gamepad.configure(config);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gamepad.config)); } catch { /* Input works without persistence. */ }
}
export { DEFAULT_GAMEPAD_CONFIG };

export class GamepadRuntime {
  private menus = new GamepadMenus();
  private badge: HTMLElement;
  private disconnectedUntil = 0;
  private lastPointer?: { x: number; y: number };
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
    window.addEventListener('pointermove', event => {
      const moved = !this.lastPointer || event.clientX !== this.lastPointer.x || event.clientY !== this.lastPointer.y || event.movementX || event.movementY;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      if (moved) gamepad.keyboardMouse();
    }, options);
  }
  private refresh() {
    const previous = gamepad.frames;
    const frame = gamepad.poll(readBrowserPads());
    if (previous.some((old, i) => old.connected && (!gamepad.frames[i].connected || old.index !== gamepad.frames[i].index || old.id !== gamepad.frames[i].id))) {
      this.disconnectedUntil = performance.now() + 3000;
      if (gamepad.layout || previous.some(f => f.mode === 'gamepad')) this.onDisconnect();
    }
    const text = gamepad.layout ? (gamepad.ready ? `Cooperativo · ${gamepad.playerCount} jugadores · fuego amigo` : `Reconecta ${gamepad.frames.slice(0, gamepad.playerCount).map((f, i) => !f.mapped && !(i === 0 && gamepad.layout === 'keyboard-pad') ? 'P' + (i + 1) : '').filter(Boolean).join(', ')} para reanudar`) :
      gamepad.connectedCount > 1 ? `${gamepad.connectedCount} controles conectados · A / B menús` :
      frame.connected ? (frame.mapped ? 'Control conectado · A / B menús' : 'Control detectado · mapeo no compatible') : 'Control desconectado · usa teclado / mouse';
    this.badge.hidden = !gamepad.layout && !frame.connected && performance.now() > this.disconnectedUntil;
    if (this.badge.textContent !== text) this.badge.textContent = text;
    this.badge.title = gamepad.frames.map(f => f.id).filter(Boolean).join(' / ');
    const hints = this.app.querySelector<HTMLElement>('.controls-strip') ?? this.app.querySelector<HTMLElement>('.menu-footer > span:last-child');
    if (hints && !gamepad.layout) {
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
    const frames = gamepad.frames.filter(f => f.mapped);
    if (frames.some(f => f.pause)) { if (gamepad.pauseRequested) this.onPause(); return; }
    // Process at most one menu command per frame, even if both players press A.
    const frame = frames.find(f => f.confirm || f.cancel || f.navigation.x || f.navigation.y) ?? frames.find(f => f.mode === 'gamepad') ?? frames[0];
    if (frame) this.menus.update(document.querySelector<HTMLElement>('#ui')!, frame);
  }
  destroy() { this.abort.abort(); this.badge.remove(); }
}
