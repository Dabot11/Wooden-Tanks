import { gamepad, readBrowserPads } from '../input/GamepadRuntime';
import { isMapped } from '../input/GamepadController';
import { PlayerLobby, deviceName, readyButton } from '../input/PlayerLobby';
import type { CoopLayout } from '../input/GamepadTeam';
import { showOverlay } from './Overlay';

export function showCoopSetup(root: HTMLElement, start: (layout: CoopLayout) => void, mode: 'coop' | 'duel' = 'coop') {
  gamepad.suppress();
  const lobby = new PlayerLobby(2, 'two-pads', gamepad.frame.index);
  let timer: ReturnType<typeof setInterval>, countdown: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  const cleanup = () => { closed = true; clearInterval(timer); clearTimeout(countdown); window.removeEventListener('keydown', keyboard, true); remove(); gamepad.suppress(); };
  const close = () => { cleanup(); root.querySelector<HTMLElement>(mode === 'duel' ? '#duel' : '#coop')?.focus(); };
  const launch = () => {
    if (!lobby.allReady || !gamepad.startCoop(lobby.layout, lobby.devices(readBrowserPads()), lobby.count, true)) { countdown = undefined; refresh(); return; }
    cleanup(); start(lobby.layout);
  };
  const selectLayout = (layout: CoopLayout) => { clearTimeout(countdown); countdown = undefined; lobby.reset(lobby.count, layout); delete modal.dataset.configure; refresh(); if (layout === 'keyboard-pad') modal.querySelector<HTMLButtonElement>('.keyboard-ready')?.focus(); };
  const remove = showOverlay(root, {
    eyebrow: mode === 'duel' ? 'DUELO LOCAL' : 'COOPERATIVO LOCAL', title: 'Preparen sus tanques',
    description: mode === 'duel' ? 'Todos contra todos. El último tanque vivo gana la ronda. Primero en ganar tres rondas.' : 'Un equipo, tres vidas compartidas y fuego amigo activo.',
    cancel: close,
    actions: [
      { text: 'Jugar con controles →', run: () => selectLayout('two-pads') },
      { text: 'Teclado + controles →', run: () => selectLayout('keyboard-pad'), secondary: true },
      { text: 'Volver', run: close, secondary: true },
    ],
  });
  const modal = root.querySelector<HTMLElement>('.modal')!;
  modal.classList.add('coop-modal', 'player-lobby');
  modal.addEventListener('pointerdown', () => { delete modal.dataset.configure; });
  const selector = document.createElement('div'); selector.className = 'party-size'; selector.setAttribute('role', 'group'); selector.setAttribute('aria-label', 'Cantidad de jugadores');
  for (const count of [2, 3, 4] as const) {
    const button = document.createElement('button'); button.textContent = `${count} jugadores`; button.setAttribute('aria-pressed', String(count === lobby.count));
    button.onclick = () => { clearTimeout(countdown); countdown = undefined; lobby.reset(count, lobby.layout); delete modal.dataset.configure; selector.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); refresh(); };
    selector.append(button);
  }
  const roster = document.createElement('div'); roster.className = 'lobby-roster';
  const inventory = document.createElement('p'); inventory.className = 'lobby-inventory';
  const status = document.createElement('p'); status.className = 'coop-detection'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  modal.querySelector('.modal-actions')!.before(selector, roster, inventory, status);
  const buttons = modal.querySelectorAll<HTMLButtonElement>('.modal-actions button');
  function keyboard(event: KeyboardEvent) {
    if (event.key !== 'Enter' || !lobby.slots[0].keyboard || root.querySelector('.modal') !== modal) return;
    if (event.repeat) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    if ((event.target as HTMLElement)?.closest('button')) return;
    event.preventDefault(); event.stopImmediatePropagation(); delete modal.dataset.configure; lobby.keyboardReady(); refresh();
  }
  window.addEventListener('keydown', keyboard, true);
  function refresh() {
    if (closed) return;
    const pads = readBrowserPads();
    const held = pads.some(p => p?.buttons[0]?.pressed || (p?.buttons[0]?.value ?? 0) >= 0.5);
    if (!held) delete modal.dataset.consumeReady;
    lobby.update(pads, modal.dataset.configure !== 'true' && modal.dataset.consumeReady !== 'true');
    lobby.slots.forEach((slot, i) => {
      let card = roster.children[i] as HTMLElement | undefined;
      if (!card) { card = document.createElement('div'); card.className = 'lobby-player'; card.innerHTML = `<b class="lobby-number">P${i + 1}</b><div><strong></strong><small></small></div><span></span>`; roster.append(card); }
      card.dataset.player = String(i + 1); card.dataset.ready = String(slot.ready);
      card.querySelector('strong')!.textContent = slot.keyboard ? 'Teclado y mouse' : slot.device ? `${deviceName(slot.device.id)} · control ${slot.device.index + 1}` : 'Sin dispositivo';
      card.title = slot.device?.id ?? 'Teclado y mouse';
      card.querySelector('small')!.textContent = !slot.connected ? slot.device ? 'Desconectado: reconecta este mando' : 'Conecta un mando y pulsa un botón' : slot.ready ? 'Confirmado por este jugador' : slot.keyboard ? 'Pulsa Enter para estar listo' : `Pulsa ${readyButton(slot.device!.id)} para estar listo`;
      card.querySelector('span')!.textContent = slot.ready ? 'LISTO ✓' : slot.connected ? 'ESPERANDO' : 'FALTA CONTROL';
      let keyboardButton = card.querySelector<HTMLButtonElement>('.keyboard-ready');
      if (slot.keyboard) {
        if (!keyboardButton) { keyboardButton = document.createElement('button'); keyboardButton.className = 'keyboard-ready'; keyboardButton.onclick = () => { delete modal.dataset.configure; lobby.keyboardReady(); refresh(); }; card.querySelector('div')!.append(keyboardButton); }
        keyboardButton.textContent = slot.ready ? 'Retirar listo' : 'Estoy listo · Enter';
      } else keyboardButton?.remove();
    });
    while (roster.children.length > lobby.count) roster.lastElementChild!.remove();
    const connected = pads.filter(p => p?.connected);
    inventory.textContent = `Dispositivos conectados: ${connected.map(p => `${deviceName(p!.id)} ${p!.index + 1}${isMapped(p!) ? '' : ' (mapeo no compatible)'}`).join(' · ') || 'ningún control'} · teclado/mouse disponible`;
    const count = connected.filter(p => isMapped(p!)).length;
    buttons[0].disabled = false; buttons[1].disabled = false;
    buttons[0].setAttribute('aria-pressed', String(lobby.layout === 'two-pads')); buttons[1].setAttribute('aria-pressed', String(lobby.layout === 'keyboard-pad'));
    const text = `${count} controles detectados. ` + (lobby.missing ? `Falta agregar ${lobby.missing} ${lobby.missing === 1 ? 'control' : 'controles'}.` : lobby.allReady ? 'Todos listos. Comenzando…' : 'Cada jugador debe confirmar desde su dispositivo.');
    if (status.textContent !== text) status.textContent = text;
    if (lobby.allReady && !countdown) countdown = setTimeout(launch, 500);
    if (!lobby.allReady && countdown) { clearTimeout(countdown); countdown = undefined; }
  }
  refresh(); timer = setInterval(refresh, 50);
  return close;
}
