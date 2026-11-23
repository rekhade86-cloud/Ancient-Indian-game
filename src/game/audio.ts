/**
 * Procedural Web Audio synthesizer for Dyut Krida / Chaupar.
 * Generates ivory/bone dice clatter, wooden Goti placement thuds,
 * dramatic Shankh (conch) + clash capture chimes, and temple bells.
 */
class ChauparAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /** Dry ivory/bone stick dice clattering across velvet and wood */
  public playDiceRoll(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const hitTimes = [0, 0.045, 0.095, 0.15, 0.215, 0.28, 0.34];

    hitTimes.forEach((offset, i) => {
      const t = now + offset;
      // Short filtered noise burst for bone click
      const bufferSize = Math.floor(ctx.sampleRate * 0.022);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.22));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 + i * 190 + Math.random() * 450, t);
      filter.Q.setValueAtTime(3.2, t);

      const gain = ctx.createGain();
      const vol = 0.22 * (1 - i * 0.09);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(t);

      // Subtle ivory resonant knock
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920 + Math.random() * 380, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.024);
      oscGain.gain.setValueAtTime(0.09 * (1 - i * 0.08), t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.032);
    });
  }

  /** Heavy sandalwood Goti thud placed on embroidered silk */
  public playGotiPlace(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(195, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.11);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  /** Dramatic clash + resonant Shankh (conch horn) sweep on Capture (Maar) */
  public playCaptureClash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Metallic strike burst
    const clashOsc = ctx.createOscillator();
    const clashGain = ctx.createGain();
    clashOsc.type = 'sawtooth';
    clashOsc.frequency.setValueAtTime(420, now);
    clashOsc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
    clashGain.gain.setValueAtTime(0.22, now);
    clashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    clashOsc.connect(clashGain);
    clashGain.connect(ctx.destination);
    clashOsc.start(now);
    clashOsc.stop(now + 0.24);

    // Resonant Shankh (conch) harmonic horn
    const baseFreq = 293.66; // D4
    const harmonics = [1, 2, 3.01];
    harmonics.forEach((h, idx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq * h * 0.94, now + 0.06);
      osc.frequency.linearRampToValueAtTime(baseFreq * h, now + 0.22);
      osc.frequency.setValueAtTime(baseFreq * h, now + 0.55);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now + 0.06);

      const amp = idx === 0 ? 0.16 : idx === 1 ? 0.08 : 0.04;
      gain.gain.setValueAtTime(0.001, now + 0.06);
      gain.gain.linearRampToValueAtTime(amp, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.06);
      osc.stop(now + 0.82);
    });
  }

  /** Clear brass temple bell chime for Safe Square (Charkoni) or Jodi formation */
  public playSafeChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const partials = [
      { freq: 880, amp: 0.16, dur: 0.7 },
      { freq: 1760, amp: 0.08, dur: 0.5 },
      { freq: 2637, amp: 0.045, dur: 0.35 },
    ];

    partials.forEach(({ freq, amp, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.05);
    });
  }

  /** Auspicious ascending temple bells when reaching Central Home (Meru) or winning */
  public playHomeVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880, 1174.66]; // D major auspicious chime
    notes.forEach((freq, i) => {
      const t = now + i * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  }

  /** Low gong thud for Teen-Trik 3-consecutive-bonus penalty */
  public playTeenTrik(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(72, now + 0.45);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }
}

export const chauparAudio = new ChauparAudioEngine();
