// Original wind-chime ambience. No noise buffers, rain, hiss, or percussion.
export function createGardenSoundscape(a: AudioContext, output: GainNode) {
  const bus = a.createBiquadFilter();
  bus.type = "lowpass";
  bus.frequency.value = 4200;
  bus.Q.value = 0.3;
  bus.connect(output);
  const delay = a.createDelay(1),
    echo = a.createGain(),
    wet = a.createGain();
  delay.delayTime.value = 0.43;
  echo.gain.value = 0.23;
  wet.gain.value = 0.2;
  delay.connect(echo);
  echo.connect(delay);
  delay.connect(wet);
  wet.connect(bus);
  const notes = [60, 62, 64, 67, 69, 72, 74],
    frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
  function chime(midi: number, t: number, level: number, pan: number) {
    const panner = a.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(bus);
    panner.connect(delay);
    // Quiet upper partials add the shimmer of a suspended chime without a hiss layer.
    [1, 2, 2.756, 4.07].forEach((ratio, i) => {
      const osc = a.createOscillator(),
        envelope = a.createGain(),
        duration = [8, 4, 2.5, 1.4][i];
      osc.type = "sine";
      osc.frequency.value = frequency(midi) * ratio;
      osc.detune.value = i === 1 ? 1.2 : 0;
      envelope.gain.setValueAtTime(0, t);
      envelope.gain.linearRampToValueAtTime(
        level * [1, 0.17, 0.045, 0.015][i],
        t + 0.045,
      );
      envelope.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(envelope);
      envelope.connect(panner);
      osc.start(t);
      osc.stop(t + duration + 0.05);
      osc.onended = () => {
        osc.disconnect();
        envelope.disconnect();
        if (i === 0) panner.disconnect();
      };
    });
  }
  let next = a.currentTime + 0.2,
    last = -1,
    strikes = 0;
  function schedule() {
    if (a.state !== "running") return;
    while (next < a.currentTime + 0.3) {
      let pick = Math.floor(Math.random() * notes.length);
      if (pick === last) pick = (pick + 2) % notes.length;
      last = pick;
      chime(
        notes[pick],
        next,
        0.085 + Math.random() * 0.035,
        (Math.random() - 0.5) * 1.15,
      );
      strikes++;
      // Small occasional pairs, with spacious, irregular gaps like a gentle breeze.
      next +=
        strikes % 4 === 0
          ? 0.42 + Math.random() * 0.35
          : 2.2 + Math.random() * 2.8;
    }
  }
  const timer = setInterval(schedule, 100);
  schedule();
  return () => {
    clearInterval(timer);
    delay.disconnect();
    echo.disconnect();
    wet.disconnect();
    bus.disconnect();
  };
}
