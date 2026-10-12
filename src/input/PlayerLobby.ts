import { isMapped } from './GamepadController';
import type { PadSnapshot } from './GamepadController';
import type { PlayerCount } from '../game/types';
import type { CoopLayout } from './GamepadTeam';
export function deviceName(id: string): string {
  if (/xbox|xinput|microsoft|045e/i.test(id)) return 'Xbox';
  if (/playstation|dualshock|dualsense|sony|054c/i.test(id)) return 'PlayStation';
  if (/nintendo|switch|057e/i.test(id)) return 'Nintendo';
  return 'Control';
}
export function readyButton(id: string) { return deviceName(id) === 'PlayStation' ? '✕' : deviceName(id) === 'Nintendo' ? 'B (botón inferior)' : 'A'; }
export interface LobbySlot { device: { index: number; id: string } | null; connected: boolean; ready: boolean; held: boolean; keyboard: boolean }
/** Assignments stay reserved across disconnects; readiness always belongs to its device. */
export class PlayerLobby {
  slots: LobbySlot[] = [];
  constructor(public count: PlayerCount = 2, public layout: CoopLayout = 'two-pads', private preferredIndex?: number | null) { this.reset(count, layout); }
  reset(count: PlayerCount, layout: CoopLayout) {
    this.count = count; this.layout = layout;
    this.slots = Array.from({ length: count }, (_, i) => ({ device: null, connected: layout === 'keyboard-pad' && i === 0, keyboard: layout === 'keyboard-pad' && i === 0, ready: false, held: true }));
  }
  update(pads: readonly (PadSnapshot | null)[], allowReady = true) {
    const mapped = pads.filter((p): p is PadSnapshot => !!p?.connected && isMapped(p));
    const available = mapped.filter(p => !this.slots.some(s => s.device?.index === p.index && s.device.id === p.id));
    available.sort((a, b) => Number(b.index === this.preferredIndex) - Number(a.index === this.preferredIndex));
    for (const slot of this.slots) {
      if (slot.keyboard) continue;
      if (!slot.device && available.length) { const pad = available.shift()!; slot.device = { index: pad.index, id: pad.id }; }
      const pad = mapped.find(p => p.index === slot.device?.index && p.id === slot.device.id);
      slot.connected = !!pad;
      if (!pad) { slot.ready = false; slot.held = true; continue; }
      const held = !!pad.buttons[0]?.pressed || (pad.buttons[0]?.value ?? 0) >= 0.5;
      if (allowReady && held && !slot.held) slot.ready = !slot.ready;
      slot.held = held;
    }
  }
  keyboardReady() { const slot = this.slots.find(s => s.keyboard); if (slot) slot.ready = !slot.ready; }
  get missing() { return this.slots.filter(s => !s.connected).length; }
  get allReady() { return this.slots.every(s => s.connected && s.ready); }
  devices(pads: readonly (PadSnapshot | null)[]) {
    return this.slots.filter(s => !s.keyboard).map(s => pads.find(p => p?.connected && p.index === s.device?.index && p.id === s.device.id) ?? null);
  }
}
