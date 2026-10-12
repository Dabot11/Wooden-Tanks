import { gamepad, readBrowserPads } from '../input/GamepadRuntime';
import { isMapped } from '../input/GamepadController';
import type { CoopLayout } from '../input/GamepadTeam';
import { showOverlay } from './Overlay';

export function showCoopSetup(root: HTMLElement, start: (layout: CoopLayout) => void) {
  gamepad.suppress();
  let timer: ReturnType<typeof setInterval>;
  const close = () => { clearInterval(timer); remove(); gamepad.suppress(); root.querySelector<HTMLElement>('#coop')?.focus(); };
  const launch = (layout: CoopLayout) => {
    if (!gamepad.startCoop(layout, readBrowserPads())) { refresh(); return; }
    clearInterval(timer); remove(); start(layout);
  };
  const remove = showOverlay(root, {
    eyebrow: 'COOPERATIVO LOCAL', title: 'Dos tanques, un equipo',
    description: 'P1 azul · P2 dorado. Sin daño entre compañeros. Tres vidas compartidas: si uno cae, el otro puede terminar la misión. Ambos vuelven en la siguiente. Si caen los dos, se pierde una vida.',
    cancel: close,
    actions: [
      { text: 'Dos controles →', run: () => launch('two-pads') },
      { text: 'Teclado + control →', run: () => launch('keyboard-pad'), secondary: true },
      { text: 'Volver', run: close, secondary: true },
    ],
  });
  const modal = root.querySelector<HTMLElement>('.modal')!;
  modal.classList.add('coop-modal');
  const status = document.createElement('p'); status.className = 'coop-detection'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  modal.querySelector('.modal-actions')!.before(status);
  const buttons = modal.querySelectorAll<HTMLButtonElement>('.modal-actions button');
  function refresh() {
    const count = readBrowserPads().filter(p => p?.connected && isMapped(p)).length;
    const text = `${count} ${count === 1 ? 'control detectado' : 'controles detectados'}. Conéctalos por Bluetooth o USB y pulsa un botón en cada uno. Con dos controles, el usado en el menú será P1. Con teclado + control, el mando será P2.`;
    if (status.textContent !== text) status.textContent = text;
    buttons[0].disabled = count < 2; buttons[1].disabled = count < 1;
  }
  refresh(); timer = setInterval(refresh, 200);
  buttons[readBrowserPads().filter(p => p?.connected && isMapped(p)).length >= 2 ? 0 : 1]?.focus();
  return close;
}
