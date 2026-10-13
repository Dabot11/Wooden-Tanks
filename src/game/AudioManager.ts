export type Sound = 'shot' | 'bounce' | 'impact' | 'break' | 'destroy' | 'win' | 'shellCollision' | 'tread' | 'defeat';
export type AudioScene = 'menu' | 'briefing' | 'battle' | 'silent' | 'defeat';
export const MARCH_TEMPO = 112;
// An original minor-key toy march: plucked melody, bass and snare, on eighth notes.
export const MARCH_MELODY = [69,0,72,74,76,0,74,72,69,0,67,69,72,0,67,0,65,0,69,72,74,0,72,69,67,0,64,67,69,0,64,0];
export const SOUND_DURATION: Record<Sound, number> = { shot: .19, bounce: .16, impact: .14, break: .32, destroy: 1.05, shellCollision: .38, win: .5, tread: .1, defeat: 1.4 };
const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12);
/** Schedule finite voices; OfflineAudioContext can render the same synthesis as live play. */
export function synthSound(ctx: BaseAudioContext, output: AudioNode, type: Sound, at = ctx.currentTime, noise?: AudioBuffer): AudioScheduledSourceNode[] {
  const duration = SOUND_DURATION[type], sources: AudioScheduledSourceNode[] = [];
  const voice = (hz: number, end: number, level: number, shape: OscillatorType = 'triangle', delay = 0) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = shape;
    osc.frequency.setValueAtTime(hz, at + delay); osc.frequency.exponentialRampToValueAtTime(end, at + duration);
    gain.gain.setValueAtTime(.0001, at + delay); gain.gain.linearRampToValueAtTime(level, at + delay + .004); gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(gain); gain.connect(output); osc.start(at + delay); osc.stop(at + duration); sources.push(osc);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  };
  const burst = (hz: number, level: number, length = duration) => {
    const buffer = noise ?? ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .6), ctx.sampleRate);
    if (!noise) { const data = buffer.getChannelData(0); for (let i=0;i<data.length;i++) data[i] = Math.random()*2-1; }
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(); source.buffer = buffer; source.loop = length > buffer.duration;
    filter.type = 'bandpass'; filter.frequency.value = hz; filter.Q.value = .7;
    gain.gain.setValueAtTime(level, at); gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    source.connect(filter); filter.connect(gain); gain.connect(output); source.start(at); source.stop(at + length); sources.push(source);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  };
  if (type === 'shot') { voice(330,85,.3); voice(1450,520,.07,'sine'); burst(1700,.25,.075); }
  else if (type === 'bounce' || type === 'impact') { voice(type === 'bounce' ? 540 : 390,180,.2,'sine'); voice(940,460,.065,'triangle',.009); burst(2200,.14,.045); }
  else if (type === 'tread') { voice(145,85,.1); voice(740,390,.045,'sine'); burst(900,.07,.045); }
  else if (type === 'defeat') { voice(392,392,.11,'triangle'); voice(311,311,.12,'triangle',.28); voice(262,262,.14,'triangle',.58); voice(196,147,.1,'sine',.85); }
  else if (type === 'win') { voice(440,440,.1,'sine'); voice(660,660,.08,'sine',.08); voice(880,880,.07,'sine',.16); }
  else { voice(type === 'break' ? 210 : 120,45,.27); burst(type === 'break' ? 1300 : 650,.38); voice(640,130,.06,'triangle',.025); }
  return sources;
}
export function synthMarch(ctx: BaseAudioContext, output: AudioNode, step: number, at: number, noise?: AudioBuffer): AudioScheduledSourceNode[] {
  const sources: AudioScheduledSourceNode[] = [], index = step % MARCH_MELODY.length;
  const note = (midi: number, level: number, duration: number) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = 'triangle'; osc.frequency.value = frequency(midi);
    gain.gain.setValueAtTime(.0001, at); gain.gain.linearRampToValueAtTime(level, at+.007); gain.gain.exponentialRampToValueAtTime(.0001, at+duration);
    osc.connect(gain); gain.connect(output); osc.start(at); osc.stop(at+duration); sources.push(osc);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  };
  if (MARCH_MELODY[index]) note(MARCH_MELODY[index],.075,.19);
  if (step % 4 === 0) note(index < 16 ? 45 : 41,.095,.24);
  // Alternating low wooden drum and a soft snare, with occasional marching doubles.
  sources.push(...synthSound(ctx,output,step % 4 === 2 ? 'impact' : 'tread',at,noise));
  if (step % 8 === 7) sources.push(...synthSound(ctx,output,'tread',at+.11,noise));
  return sources;
}
export class AudioManager {
  private context?: AudioContext; private master?: GainNode; private music?: GainNode; private effects?: GainNode;
  private noise?: AudioBuffer; private voices = new Set<AudioScheduledSourceNode>();
  private scene: AudioScene = 'silent'; private hidden = false; private isMuted = false;
  private timer?: ReturnType<typeof setInterval>; private nextBeat = 0; private step = 0; private travel = 0; private lastTread = -1;
  get muted() { return this.isMuted; }
  set muted(value: boolean) { this.isMuted = value; this.sync(); }
  get state() { return { context: this.context?.state ?? 'unavailable', scene: this.scene, muted: this.muted, hidden: this.hidden, voices: this.voices.size, musicScheduled: this.timer !== undefined }; }
  unlock() {
    try {
      if (this.context?.state === 'closed') this.context=undefined;
      if (!this.context) {
        this.context = new AudioContext(); const ctx = this.context;
        this.master = ctx.createGain(); this.music = ctx.createGain(); this.effects = ctx.createGain();
        const limiter = ctx.createDynamicsCompressor(); limiter.threshold.value=-12; limiter.ratio.value=8; limiter.attack.value=.003; limiter.release.value=.15;
        this.music.connect(this.master); this.effects.connect(this.master); this.effects.gain.value=.65; this.master.connect(limiter); limiter.connect(ctx.destination);
        this.noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate*.6),ctx.sampleRate);
        const data=this.noise.getChannelData(0); for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
        ctx.onstatechange=()=>this.sync();
      }
      if(this.context.state==='suspended') void this.context.resume().then(()=>this.sync()).catch(()=>{});
      this.sync();
    } catch { /* Browsers without audio must remain playable. */ }
  }
  setScene(scene: AudioScene) { this.scene=scene; this.travel=0; this.sync(); }
  setHidden(hidden: boolean) { this.hidden=hidden; this.sync(); }
  private get audible() { return !this.muted && !this.hidden && this.scene !== 'silent' && this.context?.state==='running'; }
  private track(sources: AudioScheduledSourceNode[]) {
    for(const source of sources) {
      this.voices.add(source); const ended=source.onended;
      source.onended = event => { ended?.call(source,event); this.voices.delete(source); };
    }
  }
  private sync() {
    const ctx=this.context; if(!ctx || !this.master || !this.music) return;
    this.master.gain.setTargetAtTime(this.audible ? .65 : 0,ctx.currentTime,.015);
    this.music.gain.setTargetAtTime(this.scene==='defeat' ? 0 : this.scene==='battle' ? .32 : .22,ctx.currentTime,.12);
    if(!this.audible) {
      if(this.timer!==undefined) clearInterval(this.timer); this.timer=undefined;
      for(const source of this.voices) { try { source.stop(ctx.currentTime+.04); } catch { /* Already ended. */ } }
      this.travel=0; return;
    }
    if(this.scene==='defeat') {
      if(this.timer!==undefined) clearInterval(this.timer); this.timer=undefined; return;
    }
    if(this.timer===undefined) {
      this.nextBeat=ctx.currentTime+.035; this.step=0;
      this.timer=setInterval(()=>this.tick(),50); this.tick();
    }
  }
  private tick() {
    const ctx=this.context; if(!this.audible || !ctx || !this.music) return;
    // Never replay a backlog after a suspended tab.
    if(this.nextBeat<ctx.currentTime) this.nextBeat=ctx.currentTime+.025;
    while(this.nextBeat<ctx.currentTime+.14) {
      if(this.voices.size<80) this.track(synthMarch(ctx,this.music,this.step++,this.nextBeat,this.noise));
      this.nextBeat+=60/MARCH_TEMPO/2;
    }
  }
  play(type: Sound) {
    if(!this.audible || !this.context || !this.effects || (type !== 'destroy' && this.voices.size>88)) return;
    this.track(synthSound(this.context,this.effects,type,this.context.currentTime,this.noise));
  }
  defeat(): Promise<void> {
    this.setScene('defeat');
    if (!this.audible || !this.context || !this.effects) return Promise.resolve();
    // The descending cue follows the explosion; completion follows the audio clock.
    const sources = synthSound(this.context, this.effects, 'defeat', this.context.currentTime + 1.15, this.noise);
    this.track(sources);
    return new Promise(resolve => {
      let remaining = sources.length;
      for (const source of sources) {
        const ended = source.onended;
        source.onended = event => { ended?.call(source, event); if (--remaining === 0) resolve(); };
      }
    });
  }
  movement(distance: number) {
    if(!this.audible || this.scene!=='battle' || !Number.isFinite(distance) || distance<=0) { this.travel=0; return; }
    this.travel+=distance;
    if(this.travel>=10 && this.context!.currentTime-this.lastTread>=.09) { this.travel%=10; this.lastTread=this.context!.currentTime; this.play('tread'); }
  }
  dispose() {
    this.scene='silent'; this.sync(); if(this.context) { this.context.onstatechange=null; void this.context.close(); } this.voices.clear();
  }
}
export const audio = new AudioManager();
