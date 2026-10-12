import { gamepad, saveGamepadConfig, DEFAULT_GAMEPAD_CONFIG } from '../input/GamepadRuntime';
import { showOverlay } from './Overlay';

export function showGamepadSettings(root: HTMLElement) {
  const previous = document.activeElement as HTMLElement | null;
  const close = () => { remove(); gamepad.suppress(); previous?.focus(); };
  gamepad.suppress();
  const remove = showOverlay(root, {
    eyebrow: 'TWIN-STICK', title: 'Tu control, tu zona',
    description: 'Conecta el mando por Bluetooth o USB y pulsa un botón para detectarlo. Aumenta la zona muerta si el tanque o la torreta se mueven solos.',
    cancel: close,
    actions: [
      { text: 'Restaurar valores', secondary: true, run: () => { saveGamepadConfig(DEFAULT_GAMEPAD_CONFIG); render(); } },
      { text: 'Listo · B para volver', run: close },
    ],
  });
  const body = document.createElement('div'); body.className = 'gamepad-settings';
  body.innerHTML = `<label for="left-deadzone">Stick izquierdo <output id="left-zone-value"></output></label><input id="left-deadzone" type="range" min="0.05" max="0.45" step="0.01" aria-label="Zona muerta del stick izquierdo"><label for="right-deadzone">Stick derecho <output id="right-zone-value"></output></label><input id="right-deadzone" type="range" min="0.05" max="0.45" step="0.01" aria-label="Zona muerta del stick derecho"><small>Stick / cruceta para navegar · ← → ajustar · A confirmar · B volver</small>`;
  const modals = root.querySelectorAll<HTMLElement>('.modal'); const modal = modals[modals.length - 1]; modal.querySelector('.modal-actions')!.before(body);
  const left = body.querySelector<HTMLInputElement>('#left-deadzone')!;
  const right = body.querySelector<HTMLInputElement>('#right-deadzone')!;
  function render() {
    left.value = String(gamepad.config.leftDeadzone); right.value = String(gamepad.config.rightDeadzone);
    body.querySelector('#left-zone-value')!.textContent = `${Math.round(gamepad.config.leftDeadzone * 100)} %`;
    body.querySelector('#right-zone-value')!.textContent = `${Math.round(gamepad.config.rightDeadzone * 100)} %`;
  }
  left.addEventListener('input', () => { saveGamepadConfig({ leftDeadzone: Number(left.value) }); render(); });
  right.addEventListener('input', () => { saveGamepadConfig({ rightDeadzone: Number(right.value) }); render(); });
  render(); left.focus();
  return close;
}
