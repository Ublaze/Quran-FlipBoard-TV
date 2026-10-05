/**
 * Sound engine using Web Audio API.
 * Generates a synthetic split-flap clatter sound
 * (no external audio files needed).
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3;
    this._initialized = false;
  }

  /** Initialize AudioContext (must be called after user interaction) */
  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
    } catch (e) {
      console.warn('Web Audio not available:', e);
      this.enabled = false;
    }
  }

  /** Play a split-flap transition sound */
  playFlap() {
    if (!this.enabled || !this.ctx) return;

    // Resume context if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    // Layer 1: Short noise burst (mechanical click)
    this._noiseClick(now, 0.06, this.volume * 0.5);

    // Layer 2: Low thump
    this._thump(now, 80, 0.04, this.volume * 0.3);

    // Layer 3: Rapid flutter (multiple tiny clicks)
    for (let i = 0; i < 6; i++) {
      this._noiseClick(now + 0.03 + i * 0.05, 0.02, this.volume * 0.15);
    }

    // Layer 4: Final settle click
    this._noiseClick(now + 0.35, 0.04, this.volume * 0.4);
    this._thump(now + 0.35, 60, 0.03, this.volume * 0.2);
  }

  /** Short noise burst */
  _noiseClick(startTime, duration, amplitude) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Shaped noise — fast attack, quick decay
      const envelope = Math.exp(-i / (bufferSize * 0.15));
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.value = amplitude;

    // Bandpass to make it sound more mechanical
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(startTime);
  }

  /** Low frequency thump */
  _thump(startTime, freq, duration, amplitude) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(amplitude, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
