// Synthesize a baby-like cry using Web Audio API
export function startCrySound(audioContext: AudioContext): () => void {
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioContext.destination);

  // Main cry oscillator — high sawtooth
  const osc = audioContext.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 520;

  // Fast pitch LFO — 5Hz makes it sound like wailing, not a siren
  const pitchLfo = audioContext.createOscillator();
  const pitchLfoGain = audioContext.createGain();
  pitchLfo.type = 'sine';
  pitchLfo.frequency.value = 5;
  pitchLfoGain.gain.value = 35; // narrow swing = baby, wide swing = ambulance
  pitchLfo.connect(pitchLfoGain);
  pitchLfoGain.connect(osc.frequency);

  // Amplitude LFO — makes it pulse like actual crying (breath pattern)
  const ampLfo = audioContext.createOscillator();
  const ampLfoGain = audioContext.createGain();
  ampLfo.type = 'sine';
  ampLfo.frequency.value = 1.8; // ~2 cries per second
  ampLfoGain.gain.value = 0.15;
  ampLfo.connect(ampLfoGain);
  ampLfoGain.connect(masterGain.gain);

  // Bandpass filter to cut low rumble and shape into a more vocal sound
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 700;
  filter.Q.value = 1.2;

  osc.connect(filter);
  filter.connect(masterGain);

  osc.start();
  pitchLfo.start();
  ampLfo.start();

  return () => {
    try {
      masterGain.gain.setValueAtTime(masterGain.gain.value, audioContext.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
      setTimeout(() => {
        try { osc.stop(); pitchLfo.stop(); ampLfo.stop(); masterGain.disconnect(); } catch (e) {}
      }, 150);
    } catch (e) {}
  };
}
