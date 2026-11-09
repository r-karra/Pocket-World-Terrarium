import { WeatherMode } from '../types/world';

export interface SoundscapeState {
  enabled: boolean;
  volume: number;
  trackName: string;
}

export class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private isEnabled = false;
  private volume = 0.65;
  private activeMode: WeatherMode = 'pollen';
  private currentTrackName = 'Meadow Birdsong & Summer Breeze';

  // Noise Buffer (shared across wind, rain, waves, embers)
  private noiseBuffer: AudioBuffer | null = null;

  // Layer 1: Wind
  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  // Layer 2: Rain
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilterLow: BiquadFilterNode | null = null;
  private rainFilterHigh: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;

  // Layer 3: Ocean Waves / Surf
  private waveSource: AudioBufferSourceNode | null = null;
  private waveFilter: BiquadFilterNode | null = null;
  private waveGain: GainNode | null = null;
  private waveLfoGain: GainNode | null = null;
  private waveLfo: OscillatorNode | null = null;

  // Layer 4: Campfire Embers Crackle
  private emberSource: AudioBufferSourceNode | null = null;
  private emberFilter: BiquadFilterNode | null = null;
  private emberGain: GainNode | null = null;
  private crackleIntervalId: number | null = null;

  // Procedural Birdsong scheduler
  private birdTimerId: number | null = null;

  // Procedural Chimes scheduler
  private chimeTimerId: number | null = null;

  // State update callback
  private onStateUpdate?: (state: SoundscapeState) => void;

  constructor(onStateUpdate?: (state: SoundscapeState) => void) {
    this.onStateUpdate = onStateUpdate;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle & Context Initialization
  // ---------------------------------------------------------------------------

  private initAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isEnabled ? this.volume : 0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Pre-compute 5-second seamless pink/brown noise loop
      this.noiseBuffer = this.generateNoiseBuffer(this.ctx, 5.0);

      this.setupWindLayer();
      this.setupRainLayer();
      this.setupWaveLayer();
      this.setupEmberLayer();

      this.startBirdsongLoop();
      this.startChimeLoop();
      this.startCrackleLoop();
    }
    return this.ctx;
  }

  private generateNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink noise approximation (Paul Kellet's filter)
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    return buffer;
  }

  // ---------------------------------------------------------------------------
  // Layer Setup
  // ---------------------------------------------------------------------------

  private setupWindLayer() {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = this.noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.windSource.start(0);
  }

  private setupRainLayer() {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = this.noiseBuffer;
    this.rainSource.loop = true;

    // Dual bandpass to produce soothing rain spectrum
    this.rainFilterLow = this.ctx.createBiquadFilter();
    this.rainFilterLow.type = 'bandpass';
    this.rainFilterLow.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.rainFilterLow.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.rainFilterHigh = this.ctx.createBiquadFilter();
    this.rainFilterHigh.type = 'highpass';
    this.rainFilterHigh.frequency.setValueAtTime(2400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.rainSource.connect(this.rainFilterLow);
    this.rainFilterLow.connect(this.rainFilterHigh);
    this.rainFilterHigh.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    this.rainSource.start(0);
  }

  private setupWaveLayer() {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    this.waveSource = this.ctx.createBufferSource();
    this.waveSource.buffer = this.noiseBuffer;
    this.waveSource.loop = true;

    this.waveFilter = this.ctx.createBiquadFilter();
    this.waveFilter.type = 'lowpass';
    this.waveFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.waveGain = this.ctx.createGain();
    this.waveGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    // LFO to create 4.5-second rhythmic ocean surf swell
    this.waveLfo = this.ctx.createOscillator();
    this.waveLfo.type = 'sine';
    this.waveLfo.frequency.setValueAtTime(0.22, this.ctx.currentTime); // ~4.5 second swell

    this.waveLfoGain = this.ctx.createGain();
    this.waveLfoGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    this.waveLfo.connect(this.waveLfoGain.gain);
    this.waveLfo.start(0);

    this.waveSource.connect(this.waveFilter);
    this.waveFilter.connect(this.waveLfoGain);
    this.waveLfoGain.connect(this.waveGain);
    this.waveGain.connect(this.masterGain);

    this.waveSource.start(0);
  }

  private setupEmberLayer() {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    this.emberSource = this.ctx.createBufferSource();
    this.emberSource.buffer = this.noiseBuffer;
    this.emberSource.loop = true;

    this.emberFilter = this.ctx.createBiquadFilter();
    this.emberFilter.type = 'lowpass';
    this.emberFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.emberGain = this.ctx.createGain();
    this.emberGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.emberSource.connect(this.emberFilter);
    this.emberFilter.connect(this.emberGain);
    this.emberGain.connect(this.masterGain);

    this.emberSource.start(0);
  }

  // ---------------------------------------------------------------------------
  // Procedural Birdsong Generator (Sine & Triangle Warbles)
  // ---------------------------------------------------------------------------

  private playBirdChirp() {
    if (!this.ctx || !this.masterGain || !this.isEnabled) return;
    if (this.activeMode === 'snow' || this.activeMode === 'rain' || this.activeMode === 'mountain_frost') {
      return; // Birds take shelter during snow, rain, and mountain blizzards
    }

    const t = this.ctx.currentTime;
    const notes = [2200, 2600, 2900, 3300, 3600];
    const baseFreq = notes[Math.floor(Math.random() * notes.length)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, t + 0.12);

    // Subtle chirping envelope
    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);

    // Occasional double chirp reply
    if (Math.random() > 0.5) {
      const t2 = t + 0.18;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 1.15, t2);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, t2 + 0.07);

      gain2.gain.setValueAtTime(0.0, t2);
      gain2.gain.linearRampToValueAtTime(0.035, t2 + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.12);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);

      osc2.start(t2);
      osc2.stop(t2 + 0.13);
    }
  }

  private startBirdsongLoop() {
    const scheduleNext = () => {
      const delay = 3200 + Math.random() * 4500;
      this.birdTimerId = window.setTimeout(() => {
        this.playBirdChirp();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  // ---------------------------------------------------------------------------
  // Procedural Celestial Chimes (for Rainbow & Stardust)
  // ---------------------------------------------------------------------------

  private playChimeTone() {
    if (!this.ctx || !this.masterGain || !this.isEnabled) return;
    if (this.activeMode !== 'rainbow' && this.activeMode !== 'stardust') return;

    const t = this.ctx.currentTime;
    const pentatonic = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.032, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.25);
  }

  private startChimeLoop() {
    const scheduleNext = () => {
      const delay = 1800 + Math.random() * 2600;
      this.chimeTimerId = window.setTimeout(() => {
        this.playChimeTone();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  // ---------------------------------------------------------------------------
  // Procedural Campfire Crackles
  // ---------------------------------------------------------------------------

  private playEmberCrackle() {
    if (!this.ctx || !this.masterGain || !this.isEnabled) return;
    if (this.activeMode !== 'embers') return;

    const t = this.ctx.currentTime;
    // Short burst of high-frequency filtered pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400 + Math.random() * 800, t);

    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.018, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  private startCrackleLoop() {
    const scheduleNext = () => {
      const delay = 120 + Math.random() * 260;
      this.crackleIntervalId = window.setTimeout(() => {
        this.playEmberCrackle();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  // ---------------------------------------------------------------------------
  // Dynamic Weather Adaptation
  // ---------------------------------------------------------------------------

  public updateWeatherMode(mode: WeatherMode, conditionName: string) {
    this.activeMode = mode;
    this.updateTrackName(conditionName);

    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const ramp = 0.8; // Smooth 800ms transition between soundscape layers

    // Default target gains
    let targetWind = 0.28;
    let targetWindFreq = 380;
    let targetRain = 0.0;
    let targetWaves = 0.0;
    let targetEmbers = 0.0;

    switch (mode) {
      case 'snow':
        // Cold, whispering winter wind; birds take shelter
        targetWind = 0.45;
        targetWindFreq = 680;
        targetRain = 0.0;
        break;

      case 'rain':
        // Soothing steady rainfall with soft wet breeze
        targetWind = 0.22;
        targetWindFreq = 320;
        targetRain = 0.48;
        break;

      case 'mountain_frost':
        // Icy alpine howling peak wind
        targetWind = 0.62;
        targetWindFreq = 940;
        break;

      case 'sea_spray':
        // Ocean waves and sea breeze
        targetWind = 0.32;
        targetWindFreq = 420;
        targetWaves = 0.55;
        break;

      case 'embers':
        // Crackling campfire & warm fireplace rumble
        targetWind = 0.16;
        targetWindFreq = 260;
        targetEmbers = 0.45;
        break;

      case 'rainbow':
        // Gentle magical breeze with chimes
        targetWind = 0.24;
        targetWindFreq = 460;
        break;

      case 'stardust':
        // Quiet cosmic night ambience
        targetWind = 0.18;
        targetWindFreq = 520;
        break;

      case 'dust':
        // Swirling desert sand wind
        targetWind = 0.42;
        targetWindFreq = 480;
        break;

      case 'clear':
        // Minimal serene breeze
        targetWind = 0.15;
        targetWindFreq = 320;
        break;

      case 'pollen':
      default:
        // Warm sunny meadow breeze & birdsong
        targetWind = 0.25;
        targetWindFreq = 360;
        break;
    }

    if (this.windGain && this.windFilter) {
      this.windGain.gain.setTargetAtTime(targetWind, t, ramp);
      this.windFilter.frequency.setTargetAtTime(targetWindFreq, t, ramp);
    }
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(targetRain, t, ramp);
    }
    if (this.waveGain) {
      this.waveGain.gain.setTargetAtTime(targetWaves, t, ramp);
    }
    if (this.emberGain) {
      this.emberGain.gain.setTargetAtTime(targetEmbers, t, ramp);
    }

    this.notifyState();
  }

  private updateTrackName(conditionName: string) {
    if (conditionName.includes('Snow')) {
      this.currentTrackName = 'Frosty Winter Wind & Snow Flurries';
    } else if (conditionName.includes('Rain')) {
      this.currentTrackName = 'Soothing Rain Shower & Soft Breeze';
    } else if (conditionName.includes('Frost') || conditionName.includes('Alpine')) {
      this.currentTrackName = 'Alpine Mountain Ridge Gusts';
    } else if (conditionName.includes('Sea') || conditionName.includes('Spray') || conditionName.includes('Mist')) {
      this.currentTrackName = 'Coastal Sea Surf & Maritime Breeze';
    } else if (conditionName.includes('Embers') || conditionName.includes('Hearth')) {
      this.currentTrackName = 'Crackling Campfire Embers & Hearth';
    } else if (conditionName.includes('Rainbow')) {
      this.currentTrackName = 'Prismatic Rainbow Chimes & Breeze';
    } else if (conditionName.includes('Stardust') || conditionName.includes('Astral')) {
      this.currentTrackName = 'Starry Night Ambience & Astral Chimes';
    } else if (conditionName.includes('Dust') || conditionName.includes('Sand')) {
      this.currentTrackName = 'Desert Wind & Sculpting Sand Dust';
    } else if (conditionName.includes('Clear')) {
      this.currentTrackName = 'Peaceful Terrarium Breeze';
    } else {
      this.currentTrackName = 'Meadow Birdsong & Summer Breeze';
    }
  }

  // ---------------------------------------------------------------------------
  // Public Control API
  // ---------------------------------------------------------------------------

  public toggle(): boolean {
    return this.setEnabled(!this.isEnabled);
  }

  public setEnabled(enabled: boolean): boolean {
    this.isEnabled = enabled;

    const ctx = this.initAudioContext();
    if (ctx.state === 'suspended' && enabled) {
      ctx.resume().catch(() => {});
    }

    if (this.masterGain) {
      const t = ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(enabled ? this.volume : 0.0, t, 0.25);
    }

    this.notifyState();
    return this.isEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && this.isEnabled) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.15);
    }
    this.notifyState();
  }

  public getState(): SoundscapeState {
    return {
      enabled: this.isEnabled,
      volume: this.volume,
      trackName: this.currentTrackName,
    };
  }

  public playShutterSound() {
    try {
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const t = ctx.currentTime;
      // 1. Initial mechanical shutter mirror-flip click
      const osc1 = ctx.createOscillator();
      const filter1 = ctx.createBiquadFilter();
      const gain1 = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(140, t);
      osc1.frequency.exponentialRampToValueAtTime(45, t + 0.04);

      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(800, t);

      gain1.gain.setValueAtTime(0.0, t);
      gain1.gain.linearRampToValueAtTime(0.25, t + 0.005);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(t);
      osc1.stop(t + 0.05);

      // 2. Crisp metallic shutter snap click (~42ms later)
      const t2 = t + 0.042;
      const osc2 = ctx.createOscillator();
      const filter2 = ctx.createBiquadFilter();
      const gain2 = ctx.createGain();

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1800, t2);
      osc2.frequency.exponentialRampToValueAtTime(320, t2 + 0.06);

      filter2.type = 'bandpass';
      filter2.frequency.setValueAtTime(2200, t2);
      filter2.Q.setValueAtTime(2.5, t2);

      gain2.gain.setValueAtTime(0.0, t2);
      gain2.gain.linearRampToValueAtTime(0.2, t2 + 0.004);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.065);

      osc2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t2);
      osc2.stop(t2 + 0.07);
    } catch {
      // AudioContext unavailable or autoplay blocked
    }
  }

  public playCelestialTransitionSound(mode: 'day' | 'twilight' | 'night' | 'auto') {
    try {
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const t = ctx.currentTime;
      const notes =
        mode === 'day'
          ? [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 (Bright ascending sun)
          : mode === 'twilight'
            ? [440.0, 554.37, 659.25, 880.0] // A4, C#5, E5, A5 (Warm golden sunset)
            : [329.63, 392.0, 493.88, 659.25]; // E4, G4, B4, E5 (Deep starry night)

      notes.forEach((freq, idx) => {
        const noteTime = t + idx * 0.07;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(mode === 'night' ? 1800 : 3500, noteTime);

        gain.gain.setValueAtTime(0.0, noteTime);
        gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.65);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.7);
      });
    } catch {
      // AudioContext unavailable
    }
  }

  private notifyState() {
    if (this.onStateUpdate) {
      this.onStateUpdate(this.getState());
    }
  }

  public dispose() {
    if (this.birdTimerId !== null) clearTimeout(this.birdTimerId);
    if (this.chimeTimerId !== null) clearTimeout(this.chimeTimerId);
    if (this.crackleIntervalId !== null) clearTimeout(this.crackleIntervalId);

    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
  }
}
