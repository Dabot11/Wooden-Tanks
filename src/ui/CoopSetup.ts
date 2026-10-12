import { gamepad, readBrowserPads } from '../input/GamepadRuntime';
import { isMapped } from '../input/GamepadController';
import type { PlayerCount } from '../game/types';
import type { CoopLayout } from '../input/GamepadTeam';
import { showOverlay } from './Overlay';

export function showCoopSetup(root: HTMLElement, start: (layout: CoopLayout) => void) {
  gamepad.suppress();
  let playerCount: PlayerCount = 2;
  let timer: ReturnType<typeof setInterval>;
  const close = () => { clearInterval(timer); remove(); gamepad.suppress(); root.querySelector<HTMLElement>('#coop')?.focus(); };
  const launch = (layout: CoopLayout) => {
    if (!gamepad.startCoop(layout, readBrowserPads(), playerCount)) { refresh(); return; }
    clearInterval(timer); remove(); start(layout);
  };
  const remove = showOverlay(root, {
    eyebrow: 'COOPERATIVO LOCAL', title: 'Hasta cuatro tanques, un equipo',
    description: 'P1 azul · P2 rojo · P3 verde · P4 amarillo. Fuego amigo activo. Tres vidas compartidas: los caídos regresan en la siguiente misión; si cae todo el equipo, se pierde una vida.',
    cancel: close,
    actions: [
      { text: 'Jugar con controles →', run: () => launch('two-pads') },
      { text: 'Teclado + controles →', run: () => launch('keyboard-pad'), secondary: true },
      { text: 'Volver', run: close, secondary: true },
    ],
  });
  const modal = root.querySelector<HTMLElement>('.modal')!;
  modal.classList.add('coop-modal');
  const selector = document.createElement('div'); selector.className = 'party-size'; selector.setAttribute('role', 'group'); selector.setAttribute('aria-label', 'Cantidad de jugadores');
  for (const count of [2, 3, 4] as const) {
    const button = document.createElement('button'); button.textContent = `${count} jugadores`; button.setAttribute('aria-pressed', String(count === playerCount));
    button.onclick = () => { playerCount = count; selector.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); refresh(); };
    selector.append(button);
  }
  modal.querySelector('.modal-actions')!.before(selector);
  const status = document.createElement('p'); status.className = 'coop-detection'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  modal.querySelector('.modal-actions')!.before(status);
  const buttons = modal.querySelectorAll<HTMLButtonElement>('.modal-actions button');
  function refresh() {
    const count = readBrowserPads().filter(p => p?.connected && isMapped(p)).length;
    const text = `${count} controles detectados. Pulsa un botón en cada control. Se necesitan ${playerCount} controles, o teclado/mouse para P1 y ${playerCount - 1} controles. El mando usado en el menú se asigna primero.`;
    if (status.textContent !== text) status.textContent = text;
    buttons[0].disabled = count < playerCount; buttons[1].disabled = count < playerCount - 1;
  }
  refresh(); timer = setInterval(refresh, 200);
  buttons[readBrowserPads().filter(p => p?.connected && isMapped(p)).length >= 2 ? 0 : 1]?.focus();
  return close;
}
