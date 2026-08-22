/**
 * PrincessCycle - Ambient Audio Controller
 * Manages procedural background relaxation soundscapes (Gentle Rain, Soft Waves, Mute).
 */

import { DOM } from './dom.js';
import { soundFx } from './audio.js';

export class AudioAmbienceController {
  constructor() {
    this.currentMode = 'off';
  }

  init() {
    DOM.settings.ambientSoundBtns().forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-ambient');
        DOM.settings.ambientSoundBtns().forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setMode(mode);
      });
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === 'rain') {
      soundFx.playAmbientRain(0.18);
    } else if (mode === 'ocean') {
      soundFx.playAmbientWaves(0.18);
    } else {
      soundFx.stopAmbient();
    }
  }
}
