/**
 * PrincessCycle - Ambient Wellness & Fairy Sparkle Sound Synthesizer
 * 100% Zero-dependency pure Web Audio API generative ambient soundscapes
 * (Gentle Rain, Ocean Waves, Fairy Harp Chimes)
 */

class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.activeNodes = [];
    this.currentSound = null; // 'rain' | 'ocean' | null
    this.soundFxEnabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  setSoundFxEnabled(val) {
    this.soundFxEnabled = !!val;
  }

  // Play gentle fairy chimes
  playChime(type = 'success') {
    if (!this.soundFxEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;

      if (type === 'success' || type === 'sparkle') {
        // Magical fairy glissando chime: E5 (659.25Hz) -> G#5 (830.61Hz) -> B5 (987.77Hz) -> E6 (1318.51Hz)
        const notes = [659.25, 830.61, 987.77, 1318.51];
        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + (i * 0.05));

          gain.gain.setValueAtTime(0.001, now + (i * 0.05));
          gain.gain.exponentialRampToValueAtTime(0.06, now + (i * 0.05) + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + (i * 0.05) + 0.45);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + (i * 0.05));
          osc.stop(now + (i * 0.05) + 0.5);
        });
      } else if (type === 'breath-in') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.4); // B4
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.05, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      } else if (type === 'breath-out') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(493.88, now); // B4
        osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.4); // E4
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.05, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      } else if (type === 'tap') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      }
    } catch (e) {}
  }

  // Generative Pink Noise for Soothing Rain & Ocean Waves
  startAmbient(type = 'rain') {
    this.stopAmbient();
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.currentSound = type;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'rain' ? 800 : 450, this.ctx.currentTime);

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 1.2);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    whiteNoise.start();
    this.activeNodes = [whiteNoise, filter, masterGain];
  }

  stopAmbient() {
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    this.currentSound = null;
  }
}

export const soundFx = new AmbientAudioEngine();
