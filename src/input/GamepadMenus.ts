import type { PadFrame } from './GamepadController';

export class GamepadMenus {
  update(root: HTMLElement, frame: PadFrame): boolean {
    const overlays = root.querySelectorAll<HTMLElement>('.modal');
    const scope = overlays[overlays.length - 1] ?? root.querySelector<HTMLElement>('.menu-actions');
    if (!scope) return false;
    const controls = Array.from(scope.querySelectorAll<HTMLElement>('button:not(:disabled), input[type="range"]'));
    if (!controls.length || frame.mode !== 'gamepad') { controls.forEach(c => c.classList.remove('gamepad-focused')); return true; }
    const current = document.activeElement as HTMLElement;
    let index = controls.indexOf(current);
    if (index < 0) { index = 0; controls[index].focus(); }
    if (scope.classList.contains('player-lobby') && frame.confirm) {
      if (scope.dataset.configure === 'true') { scope.dataset.configure = 'false'; scope.dataset.consumeReady = 'true'; if (current instanceof HTMLButtonElement && !current.classList.contains('keyboard-ready')) current.click(); }
      return true;
    }
    if (frame.cancel) {
      scope.dispatchEvent(new Event('gamepad-cancel'));
      return true;
    }
    const { x, y } = frame.navigation;
    const focused = controls[index];
    controls.forEach(c => c.classList.toggle('gamepad-focused', c === focused));
    if (x && focused instanceof HTMLInputElement && focused.type === 'range') {
      const step = Number(focused.step) || 0.01;
      focused.value = String(Math.max(Number(focused.min), Math.min(Number(focused.max), Number(focused.value) + x * step)));
      focused.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (x || y) {
      if (scope.classList.contains('player-lobby')) scope.dataset.configure = 'true';
      const grid = focused.closest('.mission-grid');
      const step = grid && y ? 5 * y : (y || x);
      index = Math.max(0, Math.min(controls.length - 1, index + step));
      controls[index].focus();
      controls.forEach(c => c.classList.toggle('gamepad-focused', c === controls[index]));
    } else if (frame.confirm && focused instanceof HTMLButtonElement) focused.click();
    return true;
  }
}
