import { gamepad, readBrowserPads } from '../input/GamepadRuntime';
import { isMapped } from '../input/GamepadController';
import { PlayerLobby, deviceName } from '../input/PlayerLobby';
import type { CoopLayout } from '../input/GamepadTeam';
import type { PlayerCount } from '../game/types';
import { showOverlay } from './Overlay';

export function showCoopSetup(root: HTMLElement, start: (layout: CoopLayout) => void, mode: 'coop' | 'duel' = 'coop') {
  gamepad.suppress();
  const lobby = new PlayerLobby(2, 'two-pads', gamepad.frame.index);
  let closed = false;
  let timer: ReturnType<typeof setInterval>;
  const cleanup = () => { closed = true; clearInterval(timer); remove(); gamepad.suppress(); };
  const close = () => { cleanup(); root.querySelector<HTMLElement>(mode === 'duel' ? '#duel' : '#coop')?.focus(); };
  const launch = () => {
    refresh();
    if (!lobby.allReady || !gamepad.startCoop(lobby.layout, lobby.devices(readBrowserPads()), lobby.count, true)) return;
    cleanup(); start(lobby.layout);
  };
  const selectLayout = (layout: CoopLayout) => { lobby.reset(lobby.count, layout); refresh(); if (lobby.allReady) buttons[0].focus(); };
  const remove = showOverlay(root, {
    eyebrow: mode === 'duel' ? 'DUELO LOCAL' : 'COOPERATIVO LOCAL', title: '¿Quiénes van a jugar?',
    description: mode === 'duel' ? 'Todos contra todos. El último tanque vivo gana. Primero en ganar tres rondas.' : 'Un equipo, tres vidas compartidas y fuego amigo activo.',
    cancel: close,
    actions: [
      { text: 'Empezar partida →', run: launch },
      { text: 'Jugar con controles →', secondary: true, run: () => selectLayout('two-pads') },
      { text: 'Teclado + controles →', secondary: true, run: () => selectLayout('keyboard-pad') },
      { text: 'Volver', run: close, secondary: true },
    ],
  });
  const modal = root.querySelector<HTMLElement>('.overlay:last-child .modal')!;
  modal.classList.add('coop-modal', 'player-lobby');
  const steps = document.createElement('ol'); steps.className = 'lobby-steps';
  steps.innerHTML = '<li><b>1</b> Elige cuántos juegan</li><li><b>2</b> Revisa sus dispositivos</li><li><b>3</b> Empezar partida · A</li>';
  const selector = document.createElement('div'); selector.className = 'party-size'; selector.setAttribute('role', 'group'); selector.setAttribute('aria-label', 'Cantidad de jugadores');
  for (const count of [2, 3, 4] as PlayerCount[]) {
    const button = document.createElement('button'); button.textContent = `${count} jugadores`; button.setAttribute('aria-pressed', String(count === lobby.count));
    button.onclick = () => { lobby.reset(count, lobby.layout); selector.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); refresh(); if (lobby.allReady) buttons[0].focus(); };
    selector.append(button);
  }
  const roster = document.createElement('div'); roster.className = 'lobby-roster';
  const inventory = document.createElement('p'); inventory.className = 'lobby-inventory';
  inventory.textContent = 'Controles asignados automáticamente. Si no aparece el tuyo, pulsa A para que el navegador lo detecte.';
  const status = document.createElement('p'); status.className = 'coop-detection'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  modal.querySelector('.modal-actions')!.before(steps, selector, roster, inventory, status);
  const buttons = modal.querySelectorAll<HTMLButtonElement>('.modal-actions button');
  function refresh() {
    if (closed) return;
    const pads = readBrowserPads();
    // Connected, compatible devices are assigned without a second join gesture.
    // Launch is always explicit, so reconnecting never starts a match accidentally.
    lobby.update(pads, false);
    lobby.slots.forEach((slot, i) => {
      slot.ready = slot.connected;
      let card = roster.children[i] as HTMLElement | undefined;
      if (!card) { card = document.createElement('div'); card.className = 'lobby-player'; card.innerHTML = `<b class="lobby-number">P${i + 1}</b><div><strong></strong><small></small></div><span></span>`; roster.append(card); }
      card.dataset.player = String(i + 1); card.dataset.ready = String(slot.ready);
      card.querySelector('strong')!.textContent = slot.keyboard ? 'Teclado y mouse' : slot.device ? `${deviceName(slot.device.id)} · control ${slot.device.index + 1}` : 'Sin dispositivo';
      card.title = slot.device?.id ?? (slot.keyboard ? 'Teclado y mouse' : 'Conecta un control');
      card.querySelector('small')!.textContent = !slot.connected ? slot.device ? 'Desconectado: reconecta este mando' : 'Conecta un control y pulsa A' : slot.keyboard ? 'WASD · mouse para apuntar y disparar' : 'LS mover · RS apuntar · RT disparar';
      card.querySelector('span')!.textContent = slot.ready ? 'LISTO ✓' : 'FALTA CONTROL';
    });
    while (roster.children.length > lobby.count) roster.lastElementChild!.remove();
    const count = pads.filter(p => p?.connected && isMapped(p)).length;
    const wasDisabled = buttons[0].disabled;
    buttons[0].disabled = !lobby.allReady;
    buttons[1].setAttribute('aria-pressed', String(lobby.layout === 'two-pads')); buttons[2].setAttribute('aria-pressed', String(lobby.layout === 'keyboard-pad'));
    const text = `${count} controles detectados. ` + (lobby.missing ? `Falta agregar ${lobby.missing} ${lobby.missing === 1 ? 'control' : 'controles'}.` : 'Todos listos. Selecciona Empezar partida y pulsa A o Enter.');
    if (status.textContent !== text) status.textContent = text;
    if (wasDisabled && !buttons[0].disabled) buttons[0].focus();
  }
  refresh();
  (buttons[0].disabled ? selector.querySelector('button')! : buttons[0]).focus();
  timer = setInterval(refresh, 50);
  return close;
}
