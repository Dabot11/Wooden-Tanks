export class AudioManager {
  private context?: AudioContext;
  muted = false;
  unlock() { this.context ??= new AudioContext(); if (this.context.state === 'suspended') void this.context.resume(); }
  play(type: 'shot' | 'bounce' | 'impact' | 'break' | 'destroy' | 'win') {
    if (this.muted || !this.context || this.context.state !== 'running') return;
    const ctx = this.context, now = ctx.currentTime;
    const duration = type === 'destroy' ? 0.45 : type === 'win' ? 0.35 : type === 'shot' ? 0.12 : 0.07;
    const gain = ctx.createGain(); gain.connect(ctx.destination); gain.gain.setValueAtTime(type === 'destroy' ? 0.16 : 0.07, now); gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    if (type === 'destroy' || type === 'break' || type === 'shot') {
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate); const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const noise = ctx.createBufferSource(); noise.buffer = buffer;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = type === 'shot' ? 1200 : 450;
      noise.connect(filter); filter.connect(gain); noise.start(now); noise.stop(now + duration);
    }
    const oscillator = ctx.createOscillator(); oscillator.type = type === 'bounce' || type === 'win' ? 'sine' : 'triangle';
    const frequency = type === 'bounce' ? 980 : type === 'win' ? 660 : type === 'destroy' ? 110 : 240;
    oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(type === 'win' ? 990 : Math.max(45, frequency * 0.3), now + duration);
    oscillator.connect(gain); oscillator.start(now); oscillator.stop(now + duration);
  }
}
export const audio = new AudioManager();
