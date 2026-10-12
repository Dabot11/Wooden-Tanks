import { tankIcon } from './HUD';
export interface Action { text: string; run: () => void; secondary?: boolean }
export function showOverlay(root: HTMLElement, options: { eyebrow: string; title: string; description: string; actions: Action[]; symbol?: string }) {
  const overlay = document.createElement('div'); overlay.className = 'overlay';
  const card = document.createElement('section'); card.className = 'modal'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');
  card.innerHTML = `<div class="modal-symbol">${options.symbol ?? tankIcon}</div><span class="eyebrow">${options.eyebrow}</span><h2>${options.title}</h2><p>${options.description}</p><div class="modal-actions"></div>`;
  for (const action of options.actions) {
    const button = document.createElement('button'); button.className = action.secondary ? 'button secondary' : 'button primary'; button.textContent = action.text;
    button.onclick = action.run; card.querySelector('.modal-actions')!.append(button);
  }
  overlay.append(card); root.append(overlay);
  (card.querySelector('button') as HTMLButtonElement | null)?.focus();
  card.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const buttons = Array.from(card.querySelectorAll<HTMLButtonElement>('button'));
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    e.preventDefault(); buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
  });
  return () => overlay.remove();
}
