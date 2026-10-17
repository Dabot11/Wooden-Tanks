import { tankIcon } from './HUD';
export interface Action { text: string; run: () => void; secondary?: boolean; danger?: boolean }
export function showOverlay(root: HTMLElement, options: { eyebrow: string; title: string; description: string; actions: Action[]; symbol?: string; pauseKey?: boolean; cancel?: () => void }) {
  const overlay = document.createElement('div'); overlay.className = 'overlay';
  const card = document.createElement('section'); card.className = 'modal'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-label', options.title);
  card.innerHTML = `<div class="modal-symbol">${options.symbol ?? tankIcon}</div><span class="eyebrow">${options.eyebrow}</span><h2>${options.title}</h2><p>${options.description}</p><div class="modal-actions"></div>`;
  for (const action of options.actions) {
    const button = document.createElement('button'); button.className = action.secondary ? 'button secondary' : 'button primary'; button.classList.toggle('danger', !!action.danger); button.textContent = action.text;
    button.onclick = action.run; card.querySelector('.modal-actions')!.append(button);
  }
  card.addEventListener('gamepad-cancel', () => options.cancel?.());
  overlay.append(card); root.append(overlay);
  (card.querySelector('button') as HTMLButtonElement | null)?.focus();
  card.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'p' && options.pauseKey) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) options.cancel?.(); return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) options.cancel?.(); return; }
    if (e.key !== 'Tab') return;
    const buttons = Array.from(card.querySelectorAll<HTMLElement>('button:not(:disabled), input[type="range"]'));
    const i = buttons.indexOf(document.activeElement as HTMLElement);
    e.preventDefault(); buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
  });
  return () => overlay.remove();
}

/** Nested confirmation preserves the mission screen and returns focus on cancel. */
export function confirmCampaignExit(root: HTMLElement, leave: () => void) {
  if (root.querySelector('.exit-confirmation')) return;
  const previous = document.activeElement as HTMLElement | null;
  const cancel = () => { remove(); previous?.focus(); };
  const remove = showOverlay(root, {
    eyebrow: 'SALIR DE LA CAMPAÑA', title: '¿Finalizar la partida?',
    description: 'Si sales, perderás el avance de esta partida, tus vidas y tu puntuación actual. Las misiones desbloqueadas y tu récord se conservarán.',
    symbol: '!', cancel,
    actions: [
      { text: 'Seguir jugando', run: cancel },
      { text: 'Sí, finalizar partida', danger: true, run: () => { remove(); leave(); } },
    ],
  });
  root.querySelector('.overlay:last-child .modal')!.classList.add('exit-confirmation');
}
